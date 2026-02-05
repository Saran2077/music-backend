import mongoose from "mongoose";

const spotifyPlaylistSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    spotifyId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    imageUrl: {
        type: String
    },
    totalTracks: {
        type: Number,
        default: 0
    },
    tracks: [{
        spotifyId: String,
        name: String,
        artists: [String],
        album: String,
        duration: Number,
        previewUrl: String
    }],
    migrated: {
        type: Boolean,
        default: false
    },
    migratedPlaylistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist'
    }
}, { timestamps: true });

spotifyPlaylistSchema.index({ userId: 1, spotifyId: 1 }, { unique: true });

const SpotifyPlaylist = mongoose.model('SpotifyPlaylist', spotifyPlaylistSchema);
export default SpotifyPlaylist;
