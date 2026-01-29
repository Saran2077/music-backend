import { Router } from 'express';
import { PlaylistHandler } from './handler.js';

const router = Router();

// Get all playlists for user
router.get('/', PlaylistHandler.getUserPlaylists);

// Create new playlist
router.post('/', PlaylistHandler.createPlaylist);

// Get specific playlist
router.get('/:playlistId', PlaylistHandler.getPlaylist);

// Update playlist
router.put('/:playlistId', PlaylistHandler.updatePlaylist);

// Delete playlist
router.delete('/:playlistId', PlaylistHandler.deletePlaylist);

// Add song to playlist
router.post('/:playlistId/songs', PlaylistHandler.addSongToPlaylist);

// Remove song from playlist
router.delete('/:playlistId/songs/:songId', PlaylistHandler.removeSongFromPlaylist);

export default router;