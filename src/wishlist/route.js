import { Router } from 'express';
import { WishlistHandler } from './handler.js';

const router = Router();

// Get user's wishlist
router.get('/', WishlistHandler.getUserWishlist);

// Add song to wishlist
router.post('/songs', WishlistHandler.addSongToWishlist);

// Remove song from wishlist
router.delete('/songs/:songId', WishlistHandler.removeSongFromWishlist);

// Check if song is in wishlist
router.get('/songs/:songId/check', WishlistHandler.checkSongInWishlist);

// Clear entire wishlist
router.delete('/clear', WishlistHandler.clearWishlist);

export default router;