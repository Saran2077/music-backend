import mongoose from "mongoose";

const spotifyTokenSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    scope: {
        type: String
    }
}, { timestamps: true });

const SpotifyToken = mongoose.model('SpotifyToken', spotifyTokenSchema);
export default SpotifyToken;
