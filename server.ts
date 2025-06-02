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
import { startWorkers } from "./src/workers/index";
import cluster from "cluster";

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

const start = async () => {
  try {
    await connectProducer();
    // await startConsumer();
    startKafkaConsumers();
    startWorkers();
    if (cluster.isPrimary) {
      server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error(err);
  }
};
start();
