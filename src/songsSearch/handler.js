import { SongsSearchService } from './service.js';

export class SongsSearchHandler {
  static async searchSongs(req, res) {
    try {
      const { query, lyrics = false, songdata = true } = req.query;
      
      if (!query) {
        return res.status(400).json({
          status: false,
          error: 'Query parameter is required'
        });
      }

      const result = await SongsSearchService.searchSongs(query, lyrics, songdata);
      
      res.json({
        status: true,
        data: result
      });
    } catch (error) {
      console.error('Search songs error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  static async getSongById(req, res) {
    try {
      const { id, lyrics = false } = req.query;
      
      if (!id) {
        return res.status(400).json({
          status: false,
          error: 'Song ID is required'
        });
      }

      const result = await SongsSearchService.getSongById(id, lyrics);
      
      res.json({
        status: true,
        data: result
      });
    } catch (error) {
      console.error('Get song by ID error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  static async searchPlaylists(req, res) {
    try {
      const { query, lyrics = false } = req.query;
      
      if (!query) {
        return res.status(400).json({
          status: false,
          error: 'Query parameter is required'
        });
      }

      const result = await SongsSearchService.searchPlaylists(query, lyrics);
      
      res.json({
        status: true,
        data: result
      });
    } catch (error) {
      console.error('Search playlists error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  static async searchAlbums(req, res) {
    try {
      const { query, lyrics = false } = req.query;
      
      if (!query) {
        return res.status(400).json({
          status: false,
          error: 'Query parameter is required'
        });
      }

      const result = await SongsSearchService.searchAlbums(query, lyrics);
      
      res.json({
        status: true,
        data: result
      });
    } catch (error) {
      console.error('Search albums error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }

  static async getLyrics(req, res) {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({
          status: false,
          error: 'Query parameter is required'
        });
      }

      const result = await SongsSearchService.getLyrics(query);
      
      res.json({
        status: true,
        data: result
      });
    } catch (error) {
      console.error('Get lyrics error:', error);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }
}