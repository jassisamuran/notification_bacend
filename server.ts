import cluster from "cluster";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import startKafkaConsumers from "./kafka/main";
import { connectProducer } from "./kafka/producer";
import connectDb from "./modules/database/mongoose";
import healthRoutes from "./src/routes/healthRoutes";
import notificationRoutes from "./src/routes/notificationRoutes";
import { startWorkers } from "./src/workers/index";
dotenv.config();

connectDb();
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
app.use("/api/health/check", healthRoutes);

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
