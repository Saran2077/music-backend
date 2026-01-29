import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema({
    songs: [ {
      songId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Song", 
        required: true 
      },
      duration: { type: Number, default: 0 }, // duration watched in seconds
      watchedAt: { type: Date, default: Date.now } // optional timestamp for this song
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })

const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema)
export default WatchHistory;