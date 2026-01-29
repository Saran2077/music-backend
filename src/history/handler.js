import { HistoryService } from './service.js';

export class HistoryHandler {
  // Get user's watch history
  static async getUserHistory(req, res) {
    try {
      const { userId } = req.user;
      const { limit } = req.query;
      
      const history = await HistoryService.getUserHistory(userId, parseInt(limit) || 50);
      
      res.json({
        status: true,
        data: history
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Add song to history
  static async addSongToHistory(req, res) {
    try {
      const { song, duration } = req.body;
      const { userId } = req.user;
      
      if (!song) {
        return res.status(400).json({
          status: false,
          error: 'Song data is required'
        });
      }

      const history = await HistoryService.addSongToHistory(userId, song, duration || 0);
      
      res.json({
        status: true,
        data: history,
        message: 'Song added to history successfully'
      });
    } catch (error) {
      console.error('Add song to history error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Remove song from history
  static async removeSongFromHistory(req, res) {
    try {
      const { songId } = req.params;
      const { userId } = req.user;
      
      const history = await HistoryService.removeSongFromHistory(userId, songId);
      
      res.json({
        status: true,
        data: history,
        message: 'Song removed from history successfully'
      });
    } catch (error) {
      console.error('Remove song from history error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Clear history
  static async clearHistory(req, res) {
    try {
      const { userId } = req.user;
      
      const result = await HistoryService.clearHistory(userId);
      
      res.json({
        status: true,
        message: result.message
      });
    } catch (error) {
      console.error('Clear history error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Get recently played songs
  static async getRecentlyPlayed(req, res) {
    try {
      const { userId } = req.user;
      const { limit } = req.query;
      
      const recentSongs = await HistoryService.getRecentlyPlayed(userId, parseInt(limit) || 20);
      
      res.json({
        status: true,
        data: recentSongs
      });
    } catch (error) {
      console.error('Get recently played error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Get listening statistics
  static async getListeningStats(req, res) {
    try {
      const { userId } = req.user;
      
      const stats = await HistoryService.getListeningStats(userId);
      
      res.json({
        status: true,
        data: stats
      });
    } catch (error) {
      console.error('Get listening stats error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }
}