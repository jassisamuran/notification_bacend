import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

import {
  CONNECTED_TO_MONGODB,
  MONGODB_CONNECTION_ERROR,
  MONGODB_DISCONNECTED,
  MONGODB_URI_NOT_DEFINED,
} from "../../utils/constants";

const MONGODB_URI = "mongodb://127.0.0.1:27017/notifications";

if (!MONGODB_URI) {
  throw new Error(MONGODB_URI_NOT_DEFINED);
}

import User from "../../models/User";

async function getAllUserIds() {
  try {
    await mongoose.connect(MONGODB_URI || "");
    console.log(CONNECTED_TO_MONGODB);

    const users = await User.find({}).select("_id");
    const userIds = users.map((user) => user._id.toString());

    // Ensure directory exists
    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Create and write to file
    const outputPath = path.join(outputDir, "user_ids.txt");
    fs.writeFileSync(outputPath, userIds.join("\n"), "utf-8");

    console.log(`✅ User IDs written to file: ${outputPath}`);
    process.exit(0);
  } catch (error) {
    console.error(MONGODB_CONNECTION_ERROR, error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log(MONGODB_DISCONNECTED);
  }
}

getAllUserIds();
