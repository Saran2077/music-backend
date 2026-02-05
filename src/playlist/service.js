import Playlist from '../../models/Playlist.js';
import Song from '../../models/Songs.js';
import User from '../../models/User.js';

export class PlaylistService {
  // Create a new playlist
  static async createPlaylist(userId, name, imageUrl = null, description = '') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const playlist = new Playlist({
        name,
        userId,
        songs: [],
        imageUrl,
        description
      });

      await playlist.save();
      return playlist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  }

  // Get all playlists for a user
  static async getUserPlaylists(userId) {
    try {
      const playlists = await Playlist.find({ userId })
        .populate('songs')
        .sort({ createdAt: -1 });
      
      return playlists;
    } catch (error) {
      console.error('Error getting user playlists:', error);
      throw error;
    }
  }

  // Get a specific playlist by ID
  static async getPlaylistById(playlistId, userId) {
    try {
      const playlist = await Playlist.findOne({ 
        _id: playlistId, 
        userId 
      }).populate('songs');
      
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      
      return playlist;
    } catch (error) {
      console.error('Error getting playlist:', error);
      throw error;
    }
  }

  // Add song to playlist
  static async addSongToPlaylist(playlistId, songData, userId) {
    try {
      const playlist = await Playlist.findOne({ 
        _id: playlistId, 
        userId 
      });
      
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Check if song already exists in database
      let song = await Song.findOne({ id: songData.id });
      
      if (!song) {
        // Create new song if it doesn't exist
        song = new Song({
          id: songData.id,
          name: songData.name,
          type: songData.type,
          year: songData.year,
          duration: songData.duration,
          language: songData.language,
          hasLyrics: songData.hasLyrics,
          lyricsId: songData.lyricsId,
          url: songData.url,
          copyright: songData.copyright,
          album: songData.album,
          artists: songData.artists,
          image: songData.image,
          downloadUrl: songData.downloadUrl
        });
        
        await song.save();
      }

      // Check if song is already in playlist
      if (!playlist.songs.includes(song._id)) {
        playlist.songs.push(song._id);
        await playlist.save();
      }

      return await Playlist.findById(playlistId).populate('songs');
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      throw error;
    }
  }

  // Remove song from playlist
  static async removeSongFromPlaylist(playlistId, songId, userId) {
    try {
      const playlist = await Playlist.findOne({ 
        _id: playlistId, 
        userId 
      });
      
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Filter out the song by comparing ObjectId strings
      playlist.songs = playlist.songs.filter(
        id => id.toString() !== songId.toString()
      );
      
      await playlist.save();
      return await Playlist.findById(playlistId).populate('songs');
    } catch (error) {
      console.error('Error removing song from playlist:', error);
      throw error;
    }
  }

  // Update playlist name
  static async updatePlaylist(playlistId, name, userId) {
    try {
      const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, userId },
        { name },
        { new: true }
      ).populate('songs');
      
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      
      return playlist;
    } catch (error) {
      console.error('Error updating playlist:', error);
      throw error;
    }
  }

  // Delete playlist
  static async deletePlaylist(playlistId, userId) {
    try {
      const playlist = await Playlist.findOneAndDelete({ 
        _id: playlistId, 
        userId 
      });
      
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      
      return { message: 'Playlist deleted successfully' };
    } catch (error) {
      console.error('Error deleting playlist:', error);
      throw error;
    }
  }
}