import Wishlist from '../../models/Wishlist.js';
import Song from '../../models/Songs.js';
import User from '../../models/User.js';

export class WishlistService {
  // Get user's wishlist
  static async getUserWishlist(userId) {
    try {
      let wishlist = await Wishlist.findOne({ userId }).populate('songs');
      
      if (!wishlist) {
        // Create wishlist if it doesn't exist
        wishlist = new Wishlist({
          userId,
          songs: []
        });
        await wishlist.save();
      }
      
      return wishlist;
    } catch (error) {
      console.error('Error getting user wishlist:', error);
      throw error;
    }
  }

  // Add song to wishlist
  static async addSongToWishlist(userId, songData) {
    try {
      let wishlist = await Wishlist.findOne({ userId });
      
      if (!wishlist) {
        wishlist = new Wishlist({
          userId,
          songs: []
        });
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

      // Check if song is already in wishlist
      if (!wishlist.songs.includes(song._id)) {
        wishlist.songs.push(song._id);
        await wishlist.save();
      }

      return await Wishlist.findOne({ userId }).populate('songs');
    } catch (error) {
      console.error('Error adding song to wishlist:', error);
      throw error;
    }
  }

  // Remove song from wishlist
  static async removeSongFromWishlist(userId, songId) {
    try {
      const wishlist = await Wishlist.findOne({ userId });
      
      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      wishlist.songs = wishlist.songs.filter(
        id => id.toString() !== songId
      );
      
      await wishlist.save();
      return await Wishlist.findOne({ userId }).populate('songs');
    } catch (error) {
      console.error('Error removing song from wishlist:', error);
      throw error;
    }
  }

  // Check if song is in wishlist
  static async isSongInWishlist(userId, songId) {
    try {
      const wishlist = await Wishlist.findOne({ userId });
      
      if (!wishlist) {
        return false;
      }

      const song = await Song.findOne({ id: songId });
      if (!song) {
        return false;
      }

      return wishlist.songs.includes(song._id);
    } catch (error) {
      console.error('Error checking song in wishlist:', error);
      throw error;
    }
  }

  // Clear entire wishlist
  static async clearWishlist(userId) {
    try {
      const wishlist = await Wishlist.findOne({ userId });
      
      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      wishlist.songs = [];
      await wishlist.save();
      
      return { message: 'Wishlist cleared successfully' };
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      throw error;
    }
  }
}