import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
dotenv.config();

import {
  CONNECTED_TO_MONGODB,
  MONGODB_DISCONNECTED,
  MONGODB_URI_NOT_DEFINED,
} from "../../utils/constants";
import User from "../../models/User";

const MONDODB_URI = "mongodb://127.0.0.1:27017/notifications";
if (!MONDODB_URI) {
  throw new Error(MONGODB_URI_NOT_DEFINED);
}

type UserType = {
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
};

async function seedUsers(totalCount: number) {
  const BATCH_SIZE = 10000;

  try {
    await mongoose.connect(MONDODB_URI);
    console.log(CONNECTED_TO_MONGODB);

    let inserted = 0;
    while (inserted < totalCount) {
      const batch: UserType[] = [];
      const currentBatchSize = Math.min(BATCH_SIZE, totalCount - inserted);

      for (let i = 0; i < currentBatchSize; i++) {
        batch.push({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          phone: `+91${faker.string.numeric(10)}`,
          isActive: true,
        });
      }

      await User.insertMany(batch, { ordered: false });
      inserted += currentBatchSize;
      console.log(`Inserted batch: ${inserted}/${totalCount}`);
    }

    console.log(`${totalCount} users seeded successfully`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log(MONGODB_DISCONNECTED);
  }
}

const userCount = parseInt(process.argv[2]) || 10000;
seedUsers(userCount);
