import kafka from "./kafka";
const consumer = kafka.consumer({
  groupId: "kafKa",
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

const startConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: "notification", fromBeginning: true });

    console.log("Consumer ready. Waiting for messages...");

    await consumer.run({
      eachMessage: async ({
        message,
      }: {
        message: { value: Buffer | null };
      }) => {
        try {
          const value = message.value?.toString();
          console.log("Received message:", value);
        } catch (error) {
          console.error("Failed to process message:", error);
        }
      },
    });

    // Keep the consumer alive
    process.on("SIGTERM", async () => {
      await consumer.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error("Consumer setup failed:", error);
    process.exit(1);
  }
};

export default startConsumer;
