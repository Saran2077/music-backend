import fetch from 'node-fetch';

const JIOSAAVN_BASE_URL = 'https://saavn.sumit.co/api';

// Simple in-memory cache with TTL
class Cache {
  constructor(ttlMinutes = 30) {
    this.cache = new Map();
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
  }

  set(key, value) {
    const expiresAt = Date.now() + this.ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Create cache instances for different types of data
const searchCache = new Cache(30); // 30 minutes for search results
const songCache = new Cache(60); // 60 minutes for individual songs
const playlistCache = new Cache(45); // 45 minutes for playlists
const albumCache = new Cache(45); // 45 minutes for albums
const lyricsCache = new Cache(120); // 2 hours for lyrics (they rarely change)

export class SongsSearchService {
  static async searchSongs(query, lyrics = false, songdata = true) {
    try {
      // Create cache key
      const cacheKey = `search_songs_${query}_${lyrics}_${songdata}`;
      
      // Check cache first
      const cachedResult = searchCache.get(cacheKey);
      if (cachedResult) {
        console.log('Returning cached search results for:', query);
        return cachedResult;
      }

      const url = `${JIOSAAVN_BASE_URL}/search/songs?query=${encodeURIComponent(query)}`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      let result;
      // Handle the response format: {success: true, data: {total: 48009, start: -9, results: [...]}}
      if (data.success && data.data && data.data.results) {
        result = {
          status: true,
          results: data.data.results,
          total: data.data.total
        };
      } else if (data.results) {
        result = {
          status: true,
          results: data.results
        };
      } else {
        result = {
          status: true,
          results: []
        };
      }

      // Cache the result
      searchCache.set(cacheKey, result);
      console.log('Cached search results for:', query);
      
      return result;
    } catch (error) {
      console.error('Error searching songs:', error);
      throw new Error('Failed to search songs');
    }
  }

  static async getSongById(id, lyrics = false) {
    try {
      // Create cache key
      const cacheKey = `song_${id}_${lyrics}`;
      
      // Check cache first
      const cachedResult = songCache.get(cacheKey);
      if (cachedResult) {
        console.log('Returning cached song data for ID:', id);
        return cachedResult;
      }

      const url = `${JIOSAAVN_BASE_URL}/songs/get/?id=${encodeURIComponent(id)}&lyrics=${lyrics}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      songCache.set(cacheKey, data);
      console.log('Cached song data for ID:', id);
      
      return data;
    } catch (error) {
      console.error('Error getting song by ID:', error);
      throw new Error('Failed to get song details');
    }
  }

  static async searchPlaylists(query, lyrics = false) {
    try {
      // Create cache key
      const cacheKey = `search_playlists_${query}_${lyrics}`;
      
      // Check cache first
      const cachedResult = playlistCache.get(cacheKey);
      if (cachedResult) {
        console.log('Returning cached playlist search results for:', query);
        return cachedResult;
      }

      const url = `${JIOSAAVN_BASE_URL}/search/playlists?query=${encodeURIComponent(query)}&lyrics=${lyrics}`;
      console.log(url)
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      playlistCache.set(cacheKey, data);
      console.log('Cached playlist search results for:', query);
      
      return data;
    } catch (error) {
      console.error('Error searching playlists:', error);
      throw new Error('Failed to search playlists');
    }
  }

  static async searchAlbums(query, lyrics = false) {
    try {
      // Create cache key
      const cacheKey = `search_albums_${query}_${lyrics}`;
      
      // Check cache first
      const cachedResult = albumCache.get(cacheKey);
      if (cachedResult) {
        console.log('Returning cached album search results for:', query);
        return cachedResult;
      }

      const url = `${JIOSAAVN_BASE_URL}/search/albums?query=${encodeURIComponent(query)}&lyrics=${lyrics}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      albumCache.set(cacheKey, data);
      console.log('Cached album search results for:', query);
      
      return data;
    } catch (error) {
      console.error('Error searching albums:', error);
      throw new Error('Failed to search albums');
    }
  }

  static async getLyrics(query) {
    try {
      // Create cache key
      const cacheKey = `lyrics_${query}`;
      
      // Check cache first
      const cachedResult = lyricsCache.get(cacheKey);
      if (cachedResult) {
        console.log('Returning cached lyrics for:', query);
        return cachedResult;
      }

      const url = `${JIOSAAVN_BASE_URL}/lyrics/?query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      lyricsCache.set(cacheKey, data);
      console.log('Cached lyrics for:', query);
      
      return data;
    } catch (error) {
      console.error('Error getting lyrics:', error);
      throw new Error('Failed to get lyrics');
    }
  }

  // Cache management methods
  static clearCache() {
    searchCache.clear();
    songCache.clear();
    playlistCache.clear();
    albumCache.clear();
    lyricsCache.clear();
    console.log('All caches cleared');
  }

  static getCacheStats() {
    return {
      searchCache: searchCache.size(),
      songCache: songCache.size(),
      playlistCache: playlistCache.size(),
      albumCache: albumCache.size(),
      lyricsCache: lyricsCache.size()
    };
  }
}