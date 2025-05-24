import { createKafkaConsumer } from "./consumerFactory";
import { smsQueue } from "../src/queues/notificationQueue";
interface Message {
  type: string;
  [key: string]: any;
}

interface CustomerConfig {
  groupId: string;
  filter: (message: Message) => boolean;
  process: (message: Message) => Promise<void>;
}

const customerConfigs: CustomerConfig[] = [
  {
    groupId: "email-group-service",
    filter: (message: Message) => message.type === "email",
    process: async (message: Message) => {
      console.log("Processing email message:", message);
    },
  },
  {
    groupId: "sms-group-service",
    filter: (message: Message) => message.type === "sms",
    process: async (message: Message) => {
      console.log("Processing sms message:", message);
      const queueId = smsQueue.enqueue(message, message.priority);
      console.log("this is id", queueId);
    },
  },
  {
    groupId: "otp-service-group",
    filter: (message: Message) => message.type === "otp",
    process: async (message: Message) => {
      console.log("Processing otp message:", message);
    },
  },
];

function startKafkaConsumers() {
  customerConfigs.forEach((config) => {
    createKafkaConsumer(config.groupId, config.filter, config.process);
  });
}
export default startKafkaConsumers;

startKafkaConsumers();
