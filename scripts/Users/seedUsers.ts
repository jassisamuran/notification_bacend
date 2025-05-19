import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
dotenv.config();
import {CONNECTED_TO_MONGODB,MONGODB_DISCONNECTED,MONGODB_URI_NOT_DEFINED} from  '../../utils/constants';
import User from "../../models/User";

const MONDODB_URI = process.env.MONGODB_URI;
if (!MONDODB_URI) {
    throw new Error(MONGODB_URI_NOT_DEFINED);
}
type UserType={
    name:String,
    email:String,
    phone:String, 
    isActive:Boolean,
}

async function seedUsers(count:number){
    try{
        await mongoose.connect(MONDODB_URI || "");
        console.log(CONNECTED_TO_MONGODB);
        const users:UserType[]=[];

        for(let i=0; i<count; i++){
            users.push({
                name:faker.person.fullName(),
                email:faker.internet.email(),
                phone:`+91${faker.string.numeric(10)}`,
                isActive:true,

            });
            console.log(`User ${i+1}:`, users[i]);
        }
        await User.insertMany(users);
        console.log(`${count} users seeded successfully`);
        process.exit(0);

    }catch(error){
        console.error("Error seeding users:", error);
        process.exit(1);
    }finally{
        await mongoose.disconnect();
        console.log(MONGODB_DISCONNECTED);
    }

}
const userCount = parseInt(process.argv[2]) || 10; 
seedUsers(userCount);
