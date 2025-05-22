import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import routes from "./routes";
import connectDb from "./modules/database/mongoose";
import User from "./models/User";
import { sendMessage, connectProducer } from "./kafka/producer";
import startConsumer from "./kafka/consumer";
import startKafkaConsumers from "./kafka/main";
import redisClient from "./src/queues/redisClient";

connectDb();
import notificationRoutes from "./src/routes/notificationRoutes";
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/notifications", notificationRoutes);

app.listen(PORT, () => {
  // (async () => {
  //   sendMessage("notification-service", "Hello from Kafka producer");
  //   // console.log("User created:", await User.find());
  //   console.log(`Server is running on port ${PORT}`);
  // })();
});
const start = async () => {
  try {
    await connectProducer();
    await startConsumer();
    await startKafkaConsumers();

    await redisClient.connect();

    app.listen(5000, () => {
      console.log("Server is running on port 5000");
    });

    // Example usage
    // console.log("this is a test");
    // await sendMessage("Hello Kafka");
  } catch (err) {
    console.error(err);
  }
};
start();
