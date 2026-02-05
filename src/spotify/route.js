import express from "express"
import Handler from "./handler.js";
import { authMiddleware } from "../../middleware/auth.js";

const router = express.Router();
const handler = new Handler();

router.post('/auth', authMiddleware, handler.auth.bind(handler));

router.get('/auth/callback', handler.authCallback.bind(handler));

router.get('/playlists', authMiddleware, handler.getStoredPlaylists.bind(handler));

router.post('/playlists/refresh', authMiddleware, handler.fetchPlaylists.bind(handler));

router.post('/migrate', authMiddleware, handler.migratePlaylist.bind(handler));

export default router;