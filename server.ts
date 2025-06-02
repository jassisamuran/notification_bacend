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
import http from "http";
import { Server } from "socket.io";

connectDb();
import notificationRoutes from "./src/routes/notificationRoutes";
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
io.on("connection", (socket) => {
  console.log("client connected", socket.id);
  socket.on("message", (data) => {
    console.log("Message from client", data);
    socket.broadcast.emit("message", data);
  });
  socket.on("disconnect", () => {
    console.log("client disconnected", socket.id);
  });
});
app.use("/api/notifications", notificationRoutes);

// app.listen(PORT, () => {
//   // (async () => {
//   //   sendMessage("notification-service", "Hello from Kafka producer");
//   //   // console.log("User created:", await User.find());+
//   //   console.log(`Server is running on port ${PORT}`);
//   // })();
// });
server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
const start = async () => {
  try {
    await connectProducer();
    await startConsumer();
    await startKafkaConsumers();
    app.listen(4000, () => {
      console.log("Server is running on port 4000");
    });

    // Example usage
    // console.log("this is a test");
    // await sendMessage("Hello Kafka");
  } catch (err) {
    console.error(err);
  }
};
start();
