import { Router } from 'express';
import { HistoryHandler } from './handler.js';

const router = Router();

// Get user's history
router.get('/', HistoryHandler.getUserHistory);

// Add song to history
router.post('/songs', HistoryHandler.addSongToHistory);

// Remove song from history
router.delete('/songs/:songId', HistoryHandler.removeSongFromHistory);

// Clear entire history
router.delete('/clear', HistoryHandler.clearHistory);

// Get recently played songs
router.get('/recent', HistoryHandler.getRecentlyPlayed);

// Get listening statistics
router.get('/stats', HistoryHandler.getListeningStats);

export default router;