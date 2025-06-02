import twilio from "twilio";
import { config } from "../config";

const twilioClient = twilio(config.sms.account_ssid, config.sms.auth_token);

export async function sendSms(
  to: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("to is ", to);
    // const normalizedPhone = normalizePhoneNumber(to);
    const message = await twilioClient.messages.create({
      body: text,
      from: String(config.sms.fromNumber),
      to: to,
    });
    console.info(`SMS sent successfully to ${to}: ${message.sid}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send SMS" };
  }
}

// // Helper function to normalize phone numbers
// function normalizePhoneNumber(phone: string): string {
//   // Example normalization: ensure phone starts with '+'
//   if (!phone.startsWith("+")) {
//     return "+91" + phone;
//   }
//   return phone;
// }
