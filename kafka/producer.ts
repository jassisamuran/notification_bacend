import kafka from "./kafka";
const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
  console.log("Connected to Kafka producer");
};

export const sendMessage = async (message: string) => {
  // await connectProducer();
  await producer.send({
    topic: "notification",
    messages: [
      {
        value: message,
        //  key: "kafKa", // Use a unique key for the target consumer
      },
    ],
    // Optionally, you can set a partition if you want to target a specific partition
    // partition: desiredPartitionNumber,
  });

  process.on("SIGTERM", async () => {
    await producer.disconnect();
    process.exit(0);
  });
  // console.log("Message sent to Kafka topic:", message);
};
