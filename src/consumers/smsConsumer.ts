import { createKafkaConsumer } from "../../kafka/consumerFactory";
import { emailQueue, smsQueue } from "../queues/notificationQueue";
// implement logger

interface SmsService {
  type: string;
  to: string;
  text: string;
  priority: number;
}

export async function startSmsConsumer() {
  await createKafkaConsumer(
    "sms-group-service",
    (message) => message.type == "sms",
    async (message) => {
      const smsMessage = message as unknown as SmsService;
      //  logger
      try {
        if (!smsMessage.to || !smsMessage.text) {
          throw new Error("Invalid sms service: missing required fields");
        }
        const priority = smsMessage.priority || 10;
        const queueId = smsQueue.enqueue(smsMessage, priority);
        console.log("SMS message queued with ID:", queueId);
        // logger
      } catch (error) {
        console.error("Error processing SMS message:", error);
        // logger
      }
    }
  );
  //   logger
}
