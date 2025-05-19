import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import {CONNECTED_TO_MONGODB,MONGODB_CONNECTION_ERROR,MONGODB_DISCONNECTED,MONGODB_URI_NOT_DEFINED} from  '../../utils/constants';
const MONDODB_URI = process.env.MONGODB_URI;
if (!MONDODB_URI) {
    throw new Error(MONGODB_URI_NOT_DEFINED);
}
import User from "../../models/User";
async function getAllUserIds(){
    try{
        await mongoose.connect(MONDODB_URI || "");
        console.log(CONNECTED_TO_MONGODB);
        const users= await User.find({}).select("_id");
        const userIds=users.map((user)=>user._id);
        console.log("User IDs:", userIds);
        process.exit(0);
    }catch(error){
        console.error(MONGODB_CONNECTION_ERROR, error);
        process.exit(1);
    }finally{
        mongoose.disconnect();
        console.log(MONGODB_DISCONNECTED);
     }

}
getAllUserIds();    