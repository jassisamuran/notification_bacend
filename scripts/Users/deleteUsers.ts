import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const MONDODB_URI = process.env.MONGODB_URI;
import {CONNECTED_TO_MONGODB,MONGODB_CONNECTION_ERROR,MONGODB_DISCONNECTED,MONGODB_URI_NOT_DEFINED} from  '../../utils/constants';
if (!MONDODB_URI) {
    throw new Error(MONGODB_URI_NOT_DEFINED);
}
import User from "../../models/User";
async function deleteUsers() {  
    try {
        await mongoose.connect(MONDODB_URI || "");
        console.log(CONNECTED_TO_MONGODB);
        const deletedUsers = await User.deleteMany({});
        console.log("Deleted users:", deletedUsers);
        process.exit(0);
    } catch (error) {
        console.error(MONGODB_CONNECTION_ERROR, error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log(MONGODB_DISCONNECTED);
    }
}
deleteUsers();