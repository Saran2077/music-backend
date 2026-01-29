import WatchHistory from '../../models/History.js';
import Song from '../../models/Songs.js';
import User from '../../models/User.js';

export class HistoryService {
  // Get user's watch history
  static async getUserHistory(userId, limit = 50) {
    try {
      let history = await WatchHistory.findOne({ userId })
        .populate('songs.songId')
        .sort({ 'songs.watchedAt': -1 });
      
      if (!history) {
        // Create history if it doesn't exist
        history = new WatchHistory({
          userId,
          songs: []
        });
        await history.save();
      }

      // Sort songs by watchedAt and limit results
      if (history.songs) {
        history.songs = history.songs
          .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
          .slice(0, limit);
      }
      
      return history;
    } catch (error) {
      console.error('Error getting user history:', error);
      throw error;
    }
  }

  // Add song to watch history or update duration
  static async addSongToHistory(userId, songData, duration = 0) {
    try {
      let history = await WatchHistory.findOne({ userId });
      
      if (!history) {
        history = new WatchHistory({
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

      // Check if this song is already the most recent entry (within last 5 minutes)
      const recentEntry = history.songs.find(item => 
        item.songId.toString() === song._id.toString() &&
        new Date() - new Date(item.watchedAt) < 5 * 60 * 1000 // 5 minutes
      );

      if (recentEntry) {
        // Update existing recent entry
        recentEntry.duration = Math.max(recentEntry.duration, duration);
        recentEntry.watchedAt = new Date();
      } else {
        // Remove any older entries of the same song
        history.songs = history.songs.filter(
          item => item.songId.toString() !== song._id.toString()
        );

        // Add new entry at the beginning
        history.songs.unshift({
          songId: song._id,
          duration,
          watchedAt: new Date()
        });
      }

      // Keep only last 100 entries
      if (history.songs.length > 100) {
        history.songs = history.songs.slice(0, 100);
      }

      await history.save();
      return await WatchHistory.findOne({ userId }).populate('songs.songId');
    } catch (error) {
      console.error('Error adding song to history:', error);
      throw error;
    }
  }

  // Remove song from history
  static async removeSongFromHistory(userId, songId) {
    try {
      const history = await WatchHistory.findOne({ userId });
      
      if (!history) {
        throw new Error('History not found');
      }

      history.songs = history.songs.filter(
        item => item.songId.toString() !== songId
      );
      
      await history.save();
      return await WatchHistory.findOne({ userId }).populate('songs.songId');
    } catch (error) {
      console.error('Error removing song from history:', error);
      throw error;
    }
  }

  // Clear entire history
  static async clearHistory(userId) {
    try {
      const history = await WatchHistory.findOne({ userId });
      
      if (!history) {
        throw new Error('History not found');
      }

      history.songs = [];
      await history.save();
      
      return { message: 'History cleared successfully' };
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }

  // Get recently played songs (unique songs from history)
  static async getRecentlyPlayed(userId, limit = 20) {
    try {
      const history = await WatchHistory.findOne({ userId })
        .populate('songs.songId');
      
      if (!history || !history.songs.length) {
        return [];
      }

      // Get unique songs (remove duplicates)
      const uniqueSongs = [];
      const seenSongIds = new Set();

      for (const item of history.songs) {
        if (item.songId && !seenSongIds.has(item.songId._id.toString())) {
          uniqueSongs.push({
            song: item.songId,
            lastPlayed: item.watchedAt,
            duration: item.duration
          });
          seenSongIds.add(item.songId._id.toString());
        }
      }

      return uniqueSongs.slice(0, limit);
    } catch (error) {
      console.error('Error getting recently played:', error);
      throw error;
    }
  }

  // Get listening statistics
  static async getListeningStats(userId) {
    try {
      const history = await WatchHistory.findOne({ userId })
        .populate('songs.songId');
      
      if (!history || !history.songs.length) {
        return {
          totalSongs: 0,
          totalListeningTime: 0,
          averageListeningTime: 0,
          mostPlayedSong: null
        };
      }

      const songCounts = {};
      let totalListeningTime = 0;

      // Calculate statistics
      history.songs.forEach(item => {
        if (item.songId) {
          const songId = item.songId._id.toString();
          songCounts[songId] = (songCounts[songId] || 0) + 1;
          totalListeningTime += item.duration || 0;
        }
      });

      // Find most played song
      let mostPlayedSong = null;
      let maxCount = 0;
      
      for (const [songId, count] of Object.entries(songCounts)) {
        if (count > maxCount) {
          maxCount = count;
          const songItem = history.songs.find(
            item => item.songId && item.songId._id.toString() === songId
          );
          mostPlayedSong = songItem ? songItem.songId : null;
        }
      }

      return {
        totalSongs: Object.keys(songCounts).length,
        totalPlays: history.songs.length,
        totalListeningTime,
        averageListeningTime: history.songs.length > 0 ? totalListeningTime / history.songs.length : 0,
        mostPlayedSong
      };
    } catch (error) {
      console.error('Error getting listening stats:', error);
      throw error;
    }
  }
}