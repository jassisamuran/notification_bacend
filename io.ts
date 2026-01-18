import { Server } from "socket.io";

let io: Server;

export const setSocketIO = (ioInstance: Server) => {
  io = ioInstance;
};

export const getSocketIO = () => {
  if (!io) {
    console.error(
      "❌ Socket.IO is NOT initialized! You must call initSocketIO() first."
    );
  }
  return io;
};
