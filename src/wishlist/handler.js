import { WishlistService } from './service.js';

export class WishlistHandler {
  // Get user's wishlist
  static async getUserWishlist(req, res) {
    try {
      const { userId } = req.user;
      
      const wishlist = await WishlistService.getUserWishlist(userId);
      
      res.json({
        status: true,
        data: wishlist
      });
    } catch (error) {
      console.error('Get wishlist error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Add song to wishlist
  static async addSongToWishlist(req, res) {
    try {
      const { song } = req.body;
      const { userId } = req.user;
      
      if (!song) {
        return res.status(400).json({
          status: false,
          error: 'Song data is required'
        });
      }

      const wishlist = await WishlistService.addSongToWishlist(userId, song);
      
      res.json({
        status: true,
        data: wishlist,
        message: 'Song added to wishlist successfully'
      });
    } catch (error) {
      console.error('Add song to wishlist error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Remove song from wishlist
  static async removeSongFromWishlist(req, res) {
    try {
      const { songId } = req.params;
      const { userId } = req.user;
      
      const wishlist = await WishlistService.removeSongFromWishlist(userId, songId);
      
      res.json({
        status: true,
        data: wishlist,
        message: 'Song removed from wishlist successfully'
      });
    } catch (error) {
      console.error('Remove song from wishlist error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Check if song is in wishlist
  static async checkSongInWishlist(req, res) {
    try {
      const { songId } = req.params;
      const { userId } = req.user;
      
      const isInWishlist = await WishlistService.isSongInWishlist(userId, songId);
      
      res.json({
        status: true,
        data: { isInWishlist }
      });
    } catch (error) {
      console.error('Check song in wishlist error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  // Clear wishlist
  static async clearWishlist(req, res) {
    try {
      const { userId } = req.user;
      
      const result = await WishlistService.clearWishlist(userId);
      
      res.json({
        status: true,
        message: result.message
      });
    } catch (error) {
      console.error('Clear wishlist error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }
}