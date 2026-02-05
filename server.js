import express from 'express';
import cors from 'cors';
import { connectDb } from "./db/connectDb.js";
import { configDotenv } from "dotenv";
import { authMiddleware } from './middleware/auth.js';

// Import routes
import songsSearchRoutes from './src/songsSearch/route.js';
import playlistRoutes from './src/playlist/route.js';
import wishlistRoutes from './src/wishlist/route.js';
import historyRoutes from './src/history/route.js';
import spotifyRoutes from './src/spotify/route.js';
import { getClerkClient } from './src/client/createClerkCleint.js';


configDotenv();
getClerkClient();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/songs', songsSearchRoutes);
app.use('/api/playlists', authMiddleware, playlistRoutes);
app.use('/api/wishlist', authMiddleware, wishlistRoutes);
app.use('/api/history', authMiddleware, historyRoutes);
app.use('/api/spotify', spotifyRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to database and start server
connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });