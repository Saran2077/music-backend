import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })

const Wishlist = mongoose.model('Wishlist', wishlistSchema)
export default Wishlist;