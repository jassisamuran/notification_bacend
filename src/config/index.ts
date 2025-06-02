import dotenv from "dotenv";
dotenv.config();
export const config = {
  emial: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    from: process.env.EMAIL_FROM,
  },
  sms: {
    account_ssid: process.env.ACCOUNT_SSID,
    auth_token: process.env.AUTH_TOKEN,
    fromNumber: Number(9465848473),
  },
};
