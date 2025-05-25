import { createKafkaConsumer } from "../../kafka/consumerFactory";
import { otpQueue } from "../queues/notificationQueue";

interface OtpMessage {
  type: string;
  userId: string;
  code: string;
  channel: "sms" | "email"; // Which channel to send OTP through
  expiry?: string;
  priority?: number;
}

export async function startOtpConsumer() {
  await createKafkaConsumer(
    "otp-group-service",
    (message) => message.type === "otp",
    async (message) => {
      const otpMessage = message as unknown as OtpMessage;
      //use logger here
      console.log(`Processing OTP message for user: ${otpMessage.userId}`);
      //   try {
      if (!otpMessage.userId || !otpMessage.code) {
        throw new Error("invalid otp message:missing required fields");
      }
      const priority = otpMessage.priority || 1;
      console.log(priority);
      const queueId = await otpQueue.enqueue(otpMessage, priority);
      console.log("this is result ", queueId);

      console.log(
        `OTP for user ${otpMessage.userId} queued with ID: ${queueId}`
      );
      //   } catch (error) {
      //     console.log(`Failed to queue otp : ${error}`);
      //   }
    }
  );
}
