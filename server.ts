// server.ts

import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import connectDb from "./modules/database/mongoose";
import { connectProducer } from "./kafka/producer";
import startKafkaConsumers from "./kafka/main";
import http from "http";
import { Server } from "socket.io";
import notificationRoutes from "./src/routes/notificationRoutes";
import { startWorkers } from "./src/workers/index";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/notifications", notificationRoutes);
import { setSocketIO } from "./io"; // path to io.ts

const PORT = process.env.PORT || 5001;
let users = 0;
async function start() {
  try {
    await connectDb();
    await connectProducer();
    await startKafkaConsumers();
    console.log("✅ Kafka and DB connected");
  } catch (error) {
    console.error("❌ Startup failed:", error);
    process.exit(1);
  }
}

if (process.env.WORKER_TYPE === "email" || process.env.WORKER_TYPE === "sms") {
  (async () => {
    await start();
    startWorkers();
  })();

  console.log("worker is started");
} else {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    transports: ["websocket"], // use websocket transport only
  });

  setSocketIO(io);
  io.on("connection", (socket) => {
    users++;
    console.log("✅ client connected", socket.id, users);

    socket.on("message", (data) => {
      console.log("📩 Message:", data);
      socket.emit("message", data + "k,k");
      socket.broadcast.emit("message", data + "k,k");
    });

    socket.on("disconnect", () => {
      users--;
      console.log("❌ client disconnected", socket.id, users);
    });
  });

  server.listen(PORT, () => {
    console.log(`🟢 Socket.IO server listening on port ${PORT}`);
  });

  start();
}
