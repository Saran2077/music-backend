import mongoose from "mongoose";

const songsSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String
    },
    year: {
        type: Number
    },
    releaseDate: {
        type: Date
    },
    duration: {
        type: Number
    },
    label: {
        type: String
    },
    explicitContent: {
        type: Boolean
    },
    playCount: {
        type: Number
    },
    language: {
        type: String
    },
    hasLyrics: {
        type: Boolean
    },
    lyricsId: {
        type: String
    },
    url: {
        type: String
    },
    copyright: {
        type: String
    },
    album: {
        type: Object
    },
    artists: {
        type: Object
    },
    image: {
        type: [Object]
    },
    downloadUrl: {
        type: [{
            quality: String,
            url: String
        }]
    }
}, { timestamps: true })

const Song = mongoose.model("Song", songsSchema);

export default Song;