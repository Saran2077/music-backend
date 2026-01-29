import mongoose from "mongoose"

export const connectDb = async () => {
    try {
                console.log("DB Connecting...", process.env.MONGODB_URL)

        await mongoose.connect(process.env.MONGODB_URL);
        console.log("DB Connected")
    } catch (err) {
        console.log(err)
        process.exit(1);
    }
}