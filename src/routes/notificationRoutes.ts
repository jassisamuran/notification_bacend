import { Router } from "express";
import { sendMessage } from "../../kafka/producer";
const notificationRoutes: Router = Router();

notificationRoutes.post(
  "/",

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
  },
);

export default notificationRoutes;
