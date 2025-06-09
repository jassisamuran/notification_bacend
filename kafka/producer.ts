import kafka from "./kafka";
const producer = kafka.producer();
import { getSocketIO } from "../io";
export const connectProducer = async () => {
  await producer.connect();
  console.log("Connected to Kafka producer");
};

export const sendMessage = async (message: string) => {
  const io = getSocketIO(); // ✅ now it gets the actual instance
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized yet");
    return;
  }
  // await connectProducer();
  await producer.send({
    topic: "notification",
    messages: [
      {
        value: JSON.stringify(message),
        //  key: "kafKa", // Use a unique key for the target consumer
      },
    ],
    // Optionally, you can set a partition if you want to target a specific partition
    // partition: desiredPartitionNumber,
  });

  // if (process.env.WORKER_ID === "0") {
  io.emit("message", "hie how");
  // } else if (process.env.WORKER_ID === "1") {
  //   io.emit("message", "hie how");
  // } else if (process.env.WORKER_ID === "2") {
  //   io.emit("message", "hie how");
  // } else if (process.env.WORKER_ID === "3") {
  //   io.emit("message", "hie how");
  // } else if (process.env.WORKER_ID === "4") {
  //   io.emit("message", "hie how");
  // }

  process.on("SIGTERM", async () => {
    await producer.disconnect();
    process.exit(0);
  });
  // console.log("Message sent to Kafka topic:", message);
};
