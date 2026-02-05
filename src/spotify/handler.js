import querystring from 'querystring';
import axios from "axios";
import Playlist from '../../models/Playlist.js';
import Song from '../../models/Songs.js';
import { SongsSearchService } from '../songsSearch/service.js';

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
            var state = generateRandomString(16);
            var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-library-read';

            const authUrl = 'https://accounts.spotify.com/authorize?' +
                querystring.stringify({
                    response_type: 'code',
                    client_id: process.env.SPOTIFY_CLIENT_ID,
                    scope: scope,
                    redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
                    state: state
                });

            // Return the auth URL instead of redirecting
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
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'state_mismatch'
                    }));
            } else {
                var authOptions = {
                    url: 'https://accounts.spotify.com/api/token',
                    form: {
                        code: code,
                        redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
                        grant_type: 'authorization_code'
                    },
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
                    },
                    json: true
                };

                const response = await axios.request(authOptions);
                console.log("SPOTIFY RESPONSE", response.data)
                // TODO: Make request to Spotify token endpoint
                // For now, just return success
                res.status(200).json({
                    status: true,
                    data: {
                        success: true,
                        message: 'Authentication successful'
                    }
                });
            }
        } catch (err) {
            console.log(`Error in spotify auth callback: ${err}`)
            res.status(500).json({
                status: false,
                message: `Internal Error: ${err.message}`
            })
        }
    }

    async migratePlaylist(req, res) {
        try {
            const { accessToken, userId } = req.body;

            if (!accessToken || !userId) {
                return res.status(400).json({
                    status: false,
                    message: 'Access token and userId are required'
                });
            }

            // Step 1: Get user's Spotify playlists
            const playlistsResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            const spotifyPlaylists = playlistsResponse.data.items;
            const migrationResults = [];

            // Step 2: Process each playlist
            for (const spotifyPlaylist of spotifyPlaylists) {
                try {
                    // Get full playlist details including tracks
                    const playlistDetailsResponse = await axios.get(
                        `https://api.spotify.com/v1/playlists/${spotifyPlaylist.id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    );

                    const playlistDetails = playlistDetailsResponse.data;
                    
                    // Create playlist in our database
                    const newPlaylist = new Playlist({
                        name: playlistDetails.name,
                        userId: userId,
                        imageUrl: playlistDetails.images?.[0]?.url || null,
                        description: playlistDetails.description || '',
                        spotifyId: playlistDetails.id,
                        songs: []
                    });

                    await newPlaylist.save();

                    const migratedSongs = [];
                    const failedSongs = [];

                    // Step 3: Process each track in the playlist
                    const tracks = playlistDetails.tracks.items;
                    
                    for (const item of tracks) {
                        if (!item.track) continue;

                        const track = item.track;
                        const artistNames = track.artists.map(a => a.name).join(', ');
                        const searchQuery = `${track.name} ${artistNames}`;

                        try {
                            // Search for song on JioSaavn
                            const searchResult = await SongsSearchService.searchSongs(searchQuery);
                            
                            if (searchResult.status && searchResult.results && searchResult.results.length > 0) {
                                const jiosaavnSong = searchResult.results[0];
                                
                                // Check if song already exists in database
                                let song = await Song.findOne({ id: jiosaavnSong.id });
                                
                                if (!song) {
                                    // Create new song
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

                                // Add song to playlist
                                newPlaylist.songs.push(song._id);
                                migratedSongs.push({
                                    spotifyName: track.name,
                                    jiosaavnName: jiosaavnSong.name,
                                    matched: true
                                });
                            } else {
                                failedSongs.push({
                                    name: track.name,
                                    artist: artistNames,
                                    reason: 'No match found on JioSaavn'
                                });
                            }
                        } catch (songError) {
                            console.error(`Error migrating song ${track.name}:`, songError);
                            failedSongs.push({
                                name: track.name,
                                artist: artistNames,
                                reason: songError.message
                            });
                        }

                        // Add small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }

                    // Save playlist with all songs
                    await newPlaylist.save();

                    migrationResults.push({
                        playlistName: playlistDetails.name,
                        playlistId: newPlaylist._id,
                        totalTracks: tracks.length,
                        migratedCount: migratedSongs.length,
                        failedCount: failedSongs.length,
                        migratedSongs: migratedSongs,
                        failedSongs: failedSongs
                    });

                } catch (playlistError) {
                    console.error(`Error migrating playlist ${spotifyPlaylist.name}:`, playlistError);
                    migrationResults.push({
                        playlistName: spotifyPlaylist.name,
                        error: playlistError.message,
                        success: false
                    });
                }
            }

            res.status(200).json({
                status: true,
                data: {
                    totalPlaylists: spotifyPlaylists.length,
                    results: migrationResults
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