import { Router } from "express";
import validateNotificationPayload from "../middlewares/validateNotificationPayload";
import { sendMessage } from "../../kafka/producer";
import rateLimiter from "..//middlewares/notificationRateLImiter";
const notificationRoutes: Router = Router();
import Notification from "../../models/notificationSchema";
import { MONGODB } from "../../utils/constants";
notificationRoutes.post(
  "/",

  validateNotificationPayload,
  async (req, res) => {
    try {
      const body = req.body;
      const notification = new Notification({
        to: body.to || "",
        from: body.from || "",
        userId: body.userId || "",
        priority: body?.priority || 10,
        message: body.message || "",
        type: body.type || "",
      });
      const SavedDoc = await notification.save();
      console.log("saved doc is", SavedDoc);
      await sendMessage(
        JSON.stringify({
          notificationId: SavedDoc._id,
          userId: SavedDoc.userId,
          type: SavedDoc.type,
          priority: SavedDoc.priority,
          to: SavedDoc.to,
        })
      );
      res.send({
        message: MONGODB.createdAndQueued,
        data: SavedDoc,
      });
    } catch (error) {
      res.status(500).send({
        message: MONGODB.error,
        error: (error as Error).message,
      });
    }
  }
);

export default notificationRoutes;
