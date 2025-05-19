import kafka from "./kafka";
const producer = kafka.producer();
// const sendMessage = async (topic: string, message: string) => {
//   await producer.connect();
//   console.log("Connected to Kafka producer");
//   await producer.send({
//     topic: topic,
//     messages: [{ value: message }],
//   });
//   await producer.disconnect();
// };
// export default sendMessage;
// const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
  console.log("Connected to Kafka producer");
};

export const sendMessage = async (message: string) => {
  // await connectProducer();
  await producer.send({
    topic: "notification",
    messages: [{ value: JSON.stringify(message), key: Date.now().toString() }],
  });

  process.on("SIGTERM", async () => {
    await producer.disconnect();
    process.exit(0);
  });
  console.log("Message sent to Kafka topic:", message);
};
