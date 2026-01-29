import fetch from 'node-fetch';

const JIOSAAVN_BASE_URL = 'https://saavn.sumit.co/api';

export class SongsSearchService {
  static async searchSongs(query, lyrics = false, songdata = true) {
    try {
      const url = `${JIOSAAVN_BASE_URL}/search/songs?query=${encodeURIComponent(query)}`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Handle the response format: {success: true, data: {total: 48009, start: -9, results: [...]}}
      if (data.success && data.data && data.data.results) {
        return {
          status: true,
          results: data.data.results,
          total: data.data.total
        };
      } else if (data.results) {
        return {
          status: true,
          results: data.results
        };
      } else {
        return {
          status: true,
          results: []
        };
      }
    } catch (error) {
      console.error('Error searching songs:', error);
      throw new Error('Failed to search songs');
    }
  }

  static async getSongById(id, lyrics = false) {
    try {
      const url = `${JIOSAAVN_BASE_URL}/songs/get/?id=${encodeURIComponent(id)}&lyrics=${lyrics}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting song by ID:', error);
      throw new Error('Failed to get song details');
    }
  }

  static async searchPlaylists(query, lyrics = false) {
    try {
      const url = `${JIOSAAVN_BASE_URL}/search/playlists?query=${encodeURIComponent(query)}&lyrics=${lyrics}`;
      console.log(url)
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching playlists:', error);
      throw new Error('Failed to search playlists');
    }
  }

  static async searchAlbums(query, lyrics = false) {
    try {
      const url = `${JIOSAAVN_BASE_URL}/search/albums?query=${encodeURIComponent(query)}&lyrics=${lyrics}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching albums:', error);
      throw new Error('Failed to search albums');
    }
  }

  static async getLyrics(query) {
    try {
      const url = `${JIOSAAVN_BASE_URL}/lyrics/?query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting lyrics:', error);
      throw new Error('Failed to get lyrics');
    }
  }
}