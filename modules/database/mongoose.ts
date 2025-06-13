import mongoose from "mongoose";
const MONDODB_URI = "mongodb://127.0.0.1:27017/notifications";
if (!MONDODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONDODB_URI, { maxPoolSize: 200 });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
export default connectDB;
