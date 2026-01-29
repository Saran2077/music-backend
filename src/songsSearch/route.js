import { Router } from 'express';
import { SongsSearchHandler } from './handler.js';

const router = Router();

// Search songs
router.get('/search', SongsSearchHandler.searchSongs);

// Get song by ID
router.get('/song/:id', SongsSearchHandler.getSongById);

// Search playlists
router.get('/playlists', SongsSearchHandler.searchPlaylists);

// Search albums
router.get('/albums', SongsSearchHandler.searchAlbums);

// Get lyrics
router.get('/lyrics', SongsSearchHandler.getLyrics);

export default router;