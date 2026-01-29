import { PlaylistService } from './service.js';

export class PlaylistHandler {
  // Create a new playlist
  static async createPlaylist(req, res) {
    try {
      const { name } = req.body;
      const { userId } = req.user; // Assuming user info is added by auth middleware
      
      if (!name) {
        return res.status(400).json({
          status: false,
          error: 'Playlist name is required'
        });
      }

      const playlist = await PlaylistService.createPlaylist(userId, name);
      
      res.status(201).json({
        status: true,
        data: playlist,
        message: 'Playlist created successfully'
      });
    } catch (error) {
      console.error('Create playlist error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Get all playlists for a user
  static async getUserPlaylists(req, res) {
    try {
      const { userId } = req.user;
      
      const playlists = await PlaylistService.getUserPlaylists(userId);
      
      res.json({
        status: true,
        data: playlists
      });
    } catch (error) {
      console.error('Get user playlists error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Get a specific playlist
  static async getPlaylist(req, res) {
    try {
      const { playlistId } = req.params;
      const { userId } = req.user;
      
      const playlist = await PlaylistService.getPlaylistById(playlistId, userId);
      
      res.json({
        status: true,
        data: playlist
      });
    } catch (error) {
      console.error('Get playlist error:', error);
      res.status(404).json({
        status: false,
        error: error.message
      });
    }
  }

  // Add song to playlist
  static async addSongToPlaylist(req, res) {
    try {
      const { playlistId } = req.params;
      const { song } = req.body;
      const { userId } = req.user;
      
      if (!song) {
        return res.status(400).json({
          status: false,
          error: 'Song data is required'
        });
      }

      const playlist = await PlaylistService.addSongToPlaylist(playlistId, song, userId);
      
      res.json({
        status: true,
        data: playlist,
        message: 'Song added to playlist successfully'
      });
    } catch (error) {
      console.error('Add song to playlist error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Remove song from playlist
  static async removeSongFromPlaylist(req, res) {
    try {
      const { playlistId, songId } = req.params;
      const { userId } = req.user;
      
      const playlist = await PlaylistService.removeSongFromPlaylist(playlistId, songId, userId);
      
      res.json({
        status: true,
        data: playlist,
        message: 'Song removed from playlist successfully'
      });
    } catch (error) {
      console.error('Remove song from playlist error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Update playlist
  static async updatePlaylist(req, res) {
    try {
      const { playlistId } = req.params;
      const { name } = req.body;
      const { userId } = req.user;
      
      if (!name) {
        return res.status(400).json({
          status: false,
          error: 'Playlist name is required'
        });
      }

      const playlist = await PlaylistService.updatePlaylist(playlistId, name, userId);
      
      res.json({
        status: true,
        data: playlist,
        message: 'Playlist updated successfully'
      });
    } catch (error) {
      console.error('Update playlist error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Delete playlist
  static async deletePlaylist(req, res) {
    try {
      const { playlistId } = req.params;
      const { userId } = req.user;
      
      const result = await PlaylistService.deletePlaylist(playlistId, userId);
      
      res.json({
        status: true,
        message: result.message
      });
    } catch (error) {
      console.error('Delete playlist error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }
}