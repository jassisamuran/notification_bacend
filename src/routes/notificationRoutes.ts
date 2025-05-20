import { Router } from "express";
import validateNotificationPayload from "../middlewares/validateNotificationPayload";
import { sendMessage } from "../../kafka/producer";
import rateLimiter from "..//middlewares/notificationRateLImiter";
const notificationRoutes: Router = Router();

notificationRoutes.post(
  "/",
  rateLimiter,
  validateNotificationPayload,
  (req, res) => {
    try {
      const body = req.body;
      res.send({
        message: "Notification sent successfully",
        data: body,
      });
      sendMessage(body);
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).send({
        message: "Failed to send notification",
        error: (error as Error).message,
      });
    }
  }
);

export default notificationRoutes;
