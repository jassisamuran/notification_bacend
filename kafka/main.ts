import { createKafkaConsumer } from "./consumerFactory";
<<<<<<< Updated upstream
import { smsQueue } from "../src/queues/notificationQueue";
import { emailQueue } from "../src/queues/notificationQueue";
=======
import { emailQueue, smsQueue } from "../src/queues/notificationQueue";
import Notification from "../models/notificationSchema";
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      console.log("Processing email message:");
      const queueId = await emailQueue.enqueue(message, 3);
      console.log("id of emial queue is ", queueId);
=======
      console.log(
        "Processing email message id :",
        message,
        message.notificationId
      );

      await emailQueue.enqueue(message);
>>>>>>> Stashed changes
    },
  },
  {
    groupId: "sms-group-service",
    filter: (message: Message) => message.type === "sms",
    process: async (message: Message) => {
      // console.log("Processing sms message:", message);
      const queueId = smsQueue.enqueue(message, message.priority);
      // console.log("this is id", queueId);
    },
  },
  {
    groupId: "otp-service-group",
    filter: (message: Message) => message.type === "otp",
    process: async (message: Message) => {
      // console.log("Processing otp message:", message);
      const queueId = emailQueue.enqueue(message, message.priority);
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
