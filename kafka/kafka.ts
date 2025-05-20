import { Kafka } from "kafkajs";

const kafkaClient = new Kafka({
  clientId: "notification-service",
  brokers: ["localhost:9092"],
  connectionTimeout: 3000,
  retry: {
    initialRetryTime: 100,
    retries: 5,
  },
});

export default kafkaClient;
