import { createKafkaConsumer } from "../../kafka/consumerFactory";
import { emailQueue } from "../queues/notificationQueue";
// implement logger here

interface EmailService {
  type: string;
  to: string;
  subject: string;
  body: string;
  template?: string;
  variable?: Record<string, any>;
  priority?: string;
}
export async function startEmailCosumer() {
  await createKafkaConsumer(
    "email-service-group",
    (mesasage) => mesasage.type === "email",
    async (message) => {
      const emailMessage = message as unknown as EmailService;
      // loggerunknown

      try {
        if (!emailMessage.to || !emailMessage.subject) {
          throw new Error("Invalid email message: required fields");
        }
        const priority = emailMessage.priority
          ? Number(emailMessage.priority)
          : 10;
        const queueId = await emailQueue.enqueue(emailMessage, priority);
        // log
      } catch (errr) {
        // log
      }
    }
  );
}
