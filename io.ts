import { Server } from "socket.io";

let io: Server;

export const setSocketIO = (ioInstance: Server) => {
  io = ioInstance;
};

export const getSocketIO = () => {
  return io;
};
    