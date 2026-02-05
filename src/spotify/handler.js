import querystring from 'querystring';
import axios from "axios";
import Playlist from '../../models/Playlist.js';
import Song from '../../models/Songs.js';
import SpotifyToken from '../../models/SpotifyToken.js';
import SpotifyPlaylist from '../../models/SpotifyPlaylist.js';
import { SongsSearchService } from '../songsSearch/service.js';
import User from '../../models/User.js';

function generateRandomString(num) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < num; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

class Handler {
    async auth(req, res) {
        try {
            const { userId } = req.user;

            if (!userId) {
                return res.status(400).json({
                    status: false,
                    message: 'userId is required'
                });
            }

            // Check if user already has valid token
            const existingToken = await SpotifyToken.findOne({ userId });
            if (existingToken && existingToken.expiresAt > new Date()) {
                return res.status(200).json({
                    status: true,
                    data: {
                        authenticated: true,
                        message: 'Already authenticated with Spotify'
                    }
                });
            }

            var state = generateRandomString(16) + ':' + userId; // Include userId in state
            var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-library-read';

            const authUrl = 'https://accounts.spotify.com/authorize?' +
                querystring.stringify({
                    response_type: 'code',
                    client_id: process.env.SPOTIFY_CLIENT_ID,
                    scope: scope,
                    redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
                    state: state
                });

            res.status(200).json({
                status: true,
                data: {
                    authenticated: false,
                    authUrl: authUrl
                }
            });
        } catch (err) {
            console.log(`Error in spotify auth: ${err}`)
            res.status(500).json({
                status: false,
                message: `Internal Error: ${err.message}`
            })
        }
    }

    async authCallback(req, res) {
        try {
            var code = req.query.code || null;
            var state = req.query.state || null;

            if (state === null) {
                return res.redirect('myapp://spotify-callback?error=state_mismatch');
            }

            // Extract userId from state
            const userId = state.split(':')[1];
            if (!userId) {
                return res.redirect('myapp://spotify-callback?error=invalid_state');
            }

            const tokenResponse = await axios.post(
                'https://accounts.spotify.com/api/token',
                querystring.stringify({
                    code: code,
                    redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
                    grant_type: 'authorization_code'
                }),
                {
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
                    }
                }
            );

            const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

            // Calculate expiration time
            const expiresAt = new Date(Date.now() + expires_in * 1000);


            // Store or update token in database
            await SpotifyToken.findOneAndUpdate(
                { _id: userId },
                {
                    userId,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresAt,
                    scope
                },
                { upsert: true, new: true }
            );

            // Redirect back to app with success
            res.redirect('myapp://spotify-callback?success=true');

        } catch (err) {
            console.log(`Error in spotify auth callback: ${err}`)
            res.redirect('myapp://spotify-callback?error=auth_failed');
        }
    }

    async getAccessToken(userId) {
        const tokenData = await SpotifyToken.findOne({ userId });
        
        if (!tokenData) {
            throw new Error('No Spotify token found. Please authenticate first.');
        }

        // Check if token is expired
        if (tokenData.expiresAt <= new Date()) {
            // Refresh the token
            const refreshResponse = await axios.post(
                'https://accounts.spotify.com/api/token',
                querystring.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: tokenData.refreshToken
                }),
                {
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
                    }
                }
            );

            const { access_token, expires_in } = refreshResponse.data;
            const expiresAt = new Date(Date.now() + expires_in * 1000);

            // Update token in database
            tokenData.accessToken = access_token;
            tokenData.expiresAt = expiresAt;
            await tokenData.save();

            return access_token;
        }

        return tokenData.accessToken;
    }

    async getStoredPlaylists(req, res) {
        try {
            let { userId } = req.user;

            if (!userId) {
                return res.status(400).json({
                    status: false,
                    message: 'userId is required'
                });
            }

            // Just fetch stored playlists from database
            const storedPlaylists = await SpotifyPlaylist.find({ userId }).sort({ name: 1 });
            console.log(`Returning ${storedPlaylists.length} stored playlists for user ${userId}`)
            
            res.status(200).json({
                status: true,
                data: storedPlaylists
            });

        } catch (err) {
            console.log(`Error in get stored playlists: ${err}`);
            res.status(500).json({
                status: false,
                message: `Internal Error: ${err.message}`
            })
        }
    }

    async fetchPlaylists(req, res) {
        try {
            let { userId } = req.user;

            if (!userId) {
                return res.status(400).json({
                    status: false,
                    message: 'userId is required'
                });
            }

            const accessToken = await this.getAccessToken(userId?.toString());

            console.log("ACCESSTOKEN", accessToken)

            // Fetch playlists from Spotify
            const playlistsResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    limit: 50
                },
                timeout: 30000 // 30 second timeout for Spotify API
            });

            
            const spotifyPlaylists = playlistsResponse.data.items;
            console.log(`Fetched ${spotifyPlaylists.length} playlists from Spotify`)

            // Process playlists with better error handling
            const processedPlaylists = [];
            
            for (const playlist of spotifyPlaylists) {
                try {
                    // Fetch full playlist details to get tracks
                    const detailsResponse = await axios.get(
                        `https://api.spotify.com/v1/playlists/${playlist.id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            },
                            timeout: 15000 // 15 second timeout per playlist
                        }
                    );

                    const details = detailsResponse.data;
                    const tracks = details.tracks.items.map(item => ({
                        spotifyId: item.track?.id,
                        name: item.track?.name,
                        artists: item.track?.artists?.map(a => a.name) || [],
                        album: item.track?.album?.name,
                        duration: item.track?.duration_ms,
                        previewUrl: item.track?.preview_url
                    })).filter(t => t.spotifyId);

                    // Check if already migrated
                    const existingPlaylist = await Playlist.findOne({ 
                        userId, 
                        spotifyId: playlist.id 
                    });

                    const savedPlaylist = await SpotifyPlaylist.findOneAndUpdate(
                        { userId, spotifyId: playlist.id },
                        {
                            userId,
                            spotifyId: playlist.id,
                            name: playlist.name,
                            description: playlist.description || '',
                            imageUrl: playlist.images?.[0]?.url || null,
                            totalTracks: details.tracks.total,
                            tracks,
                            migrated: !!existingPlaylist,
                            migratedPlaylistId: existingPlaylist?._id
                        },
                        { upsert: true, new: true }
                    );
                    
                    processedPlaylists.push(savedPlaylist);
                    console.log(`Processed playlist: ${playlist.name}`);
                } catch (playlistError) {
                    console.error(`Error processing playlist ${playlist.name}:`, playlistError.message);
                    // Continue with other playlists even if one fails
                }
            }

            // Fetch all stored playlists with migration status
            console.log("Fetching stored playlists")
            const storedPlaylists = await SpotifyPlaylist.find({ userId }).sort({ name: 1 });
            console.log(`Returning ${storedPlaylists.length} playlists`)
            
            res.status(200).json({
                status: true,
                data: storedPlaylists
            });

        } catch (err) {
            console.log(`Error in fetch playlists: ${err}`);
            res.status(500).json({
                status: false,
                message: `Internal Error: ${err.message}`
            })
        }
    }

    async migratePlaylist(req, res) {
        try {
            const { spotifyPlaylistId } = req.body;
            const { userId } = req.user;

            if (!userId || !spotifyPlaylistId) {
                return res.status(400).json({
                    status: false,
                    message: 'userId and spotifyPlaylistId are required'
                });
            }

            // Get Spotify playlist from database
            const spotifyPlaylist = await SpotifyPlaylist.findOne({ 
                userId, 
                spotifyId: spotifyPlaylistId 
            });

            if (!spotifyPlaylist) {
                return res.status(404).json({
                    status: false,
                    message: 'Spotify playlist not found'
                });
            }

            if (spotifyPlaylist.migrated) {
                return res.status(400).json({
                    status: false,
                    message: 'Playlist already migrated'
                });
            }

            // Create new playlist
            const newPlaylist = new Playlist({
                name: spotifyPlaylist.name,
                userId: userId,
                imageUrl: spotifyPlaylist.imageUrl,
                description: spotifyPlaylist.description,
                spotifyId: spotifyPlaylist.spotifyId,
                songs: []
            });

            await newPlaylist.save();

            const migratedSongs = [];
            const failedSongs = [];

            // Migrate each track
            for (const track of spotifyPlaylist.tracks) {
                const searchQuery = `${track.name} ${track.artists.join(' ')}`;

                try {
                    const searchResult = await SongsSearchService.searchSongs(searchQuery);
                    
                    if (searchResult.status && searchResult.results && searchResult.results.length > 0) {
                        const jiosaavnSong = searchResult.results[0];
                        
                        let song = await Song.findOne({ id: jiosaavnSong.id });
                        
                        if (!song) {
                            song = new Song({
                                id: jiosaavnSong.id,
                                name: jiosaavnSong.name,
                                type: jiosaavnSong.type,
                                year: jiosaavnSong.year,
                                releaseDate: jiosaavnSong.releaseDate,
                                duration: jiosaavnSong.duration,
                                label: jiosaavnSong.label,
                                explicitContent: jiosaavnSong.explicitContent,
                                playCount: jiosaavnSong.playCount,
                                language: jiosaavnSong.language,
                                hasLyrics: jiosaavnSong.hasLyrics,
                                lyricsId: jiosaavnSong.lyricsId,
                                url: jiosaavnSong.url,
                                copyright: jiosaavnSong.copyright,
                                album: jiosaavnSong.album,
                                artists: jiosaavnSong.artists,
                                image: jiosaavnSong.image,
                                downloadUrl: jiosaavnSong.downloadUrl
                            });
                            
                            await song.save();
                        }

                        newPlaylist.songs.push(song._id);
                        migratedSongs.push({
                            spotifyName: track.name,
                            jiosaavnName: jiosaavnSong.name
                        });
                    } else {
                        failedSongs.push({
                            name: track.name,
                            artists: track.artists,
                            reason: 'No match found on JioSaavn'
                        });
                    }
                } catch (songError) {
                    console.error(`Error migrating song ${track.name}:`, songError);
                    failedSongs.push({
                        name: track.name,
                        artists: track.artists,
                        reason: songError.message
                    });
                }

                await new Promise(resolve => setTimeout(resolve, 200));
            }

            await newPlaylist.save();

            // Update Spotify playlist as migrated
            spotifyPlaylist.migrated = true;
            spotifyPlaylist.migratedPlaylistId = newPlaylist._id;
            await spotifyPlaylist.save();

            res.status(200).json({
                status: true,
                data: {
                    playlistId: newPlaylist._id,
                    playlistName: newPlaylist.name,
                    totalTracks: spotifyPlaylist.tracks.length,
                    migratedCount: migratedSongs.length,
                    failedCount: failedSongs.length,
                    migratedSongs,
                    failedSongs
                }
            });

        } catch (err) {
            console.log(`Error in migrate playlist: ${err}`);
            res.status(500).json({
                status: false,
                message: `Internal Error: ${err.message}`
            })
        }
    }
}

export default Handler;