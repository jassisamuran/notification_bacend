import redisClient from "./redisClient";
import { v4 as uuidv4 } from "uuid";
interface QueueItem {
  id: string;
  payload: any;
  retryCount: number;
  timestamp: number;
  priority: number;
}

export class NotificationQueue {
  private queueName: string;
  private processingQueueName: string;
  private deadLetterQueueName: string;

  constructor(type: string) {
    this.queueName = `notificationQueue:${type}`;
    this.processingQueueName = `processingQueue:${type}`;
    this.deadLetterQueueName = `deadLetterQueue:${type}`;
  }
  private extractActualPayload(item: QueueItem): any {
    let payload = item.payload;

    // If payload has queue item structure, extract the actual data
    while (
      payload &&
      typeof payload === "object" &&
      "id" in payload &&
      "retryCount" in payload &&
      "timestamp" in payload
    ) {
      console.log("Unwrapping nested payload structure");
      payload = payload.payload;
    }

    return payload;
  }

  async enqueue(payload: any, priority: number = 0) {
    const id = uuidv4();
    const item: QueueItem = {
      id,
      payload,
      retryCount: 0,
      timestamp: Date.now(),
      priority: priority,
    };
<<<<<<< Updated upstream
=======
    // Save to MongoDB
    // Ensure all required fields are present and types match the Notification schema
    try {
      if (payload.notificationId) {
        const result = await Notification.updateOne(
          { _id: payload.notificationId },
          { $set: { status: "queue" } }
        );
        console.log("MongoDB updated with status=queue:", result);
      } else {
        console.warn("Missing notificationId in payload, MongoDB not updated");
      }
    } catch (err) {
      console.error("Error updating MongoDB status to queue:", err);
    }
>>>>>>> Stashed changes
    await redisClient.zadd(this.queueName, priority, JSON.stringify(item));
    console.log(
      `Added item ${id} to queue in ${this.queueName} with priority ${priority}`
    );
    return id;
  }
  // async dequeue(): Promise<QueueItem | null> {
  //   const result = await redisClient.zpopmin(this.queueName);
  //   if (!result || result.length === 0) {
  //     return null;
  //   }
  //   const itemJson = result[0]; // check this is correct or not
  //   // console.log("item json is ", itemJson);/
  //   const item: QueueItem = JSON.parse(itemJson);
  //   await redisClient.set(
  //     `${this.processingQueueName}:${item.id}`,
  //     JSON.stringify(item),
  //     "EX",
  //     300
  //   );
  //   return item;
  // }
  async dequeue(): Promise<QueueItem | null> {
    try {
      const result = await redisClient.zpopmin(this.queueName);
      if (!result || result.length === 0) {
        return null;
      }

      const itemJson = result[0];
      const item: QueueItem = JSON.parse(itemJson);

      // Extract actual payload and reconstruct item
      const actualPayload = this.extractActualPayload(item);
      const cleanItem: QueueItem = {
        ...item,
        payload: actualPayload,
      };

      await redisClient.set(
        `${this.processingQueueName}:${item.id}`,
        JSON.stringify(cleanItem),
        "EX",
        300
      );

      return cleanItem;
    } catch (error) {
      console.error("Error dequeuing item:", error);
      return null;
    }
  }

  async complete(id: string): Promise<void> {
    try {
      const itemJson = await redisClient.get(
        `${this.processingQueueName}:${id}`
      );

      if (!itemJson) {
        console.warn(`No item found in processing queue for id ${id}`);
        return;
      }

      const item: QueueItem = JSON.parse(itemJson);
      const payload = item.payload;

      // Clean up Redis
      await redisClient.del(`${this.processingQueueName}:${id}`);
      console.log(`Completed processing item ${id}`);

      // Update MongoDB status
      const notificationId = payload?.notificationId || payload?._id;
      if (notificationId) {
        const result = await Notification.updateOne(
          { _id: notificationId },
          { $set: { status: "sent" } }
        );
        console.log(
          `MongoDB updated with status=sent for ${notificationId}:`,
          result
        );
      } else {
        console.warn(
          "No notificationId/_id found in payload; skipping MongoDB update."
        );
      }
    } catch (error) {
      console.error(`Error completing item ${id}:`, error);
    }
  }

  async retry(item: QueueItem, delay: number = 60): Promise<void> {
    item.retryCount++;
    item.timestamp = Date.now();
    await redisClient.del(`${this.processingQueueName}:${item.id}`);

    const newPriorityqueue = item.priority + Math.pow(2, item.retryCount); //check out this
    if (item.retryCount > 5) {
      await redisClient.lpush(this.deadLetterQueueName, JSON.stringify(item));
      console.log(`Moved item ${item.id} to dead letter queue`);

      if (item.payload.notificationId || item.payload._id) {
        await Notification.updateOne(
          { _id: item.payload.notificationId || item.payload._id },
          { $set: { status: "dead-letter" } }
        );
      }
    } else {
      await redisClient.zadd(
        this.queueName,
        newPriorityqueue,
        JSON.stringify(item)
      );
      console.log(`Requeued item ${item.id} with priority ${newPriorityqueue}`);

      if (item.payload.notificationId || item.payload._id) {
        await Notification.updateOne(
          { _id: item.payload.notificationId || item.payload._id },
          { $set: { status: "retry" } }
        );
      }
    }
  }

  async getlength(): Promise<number> {
    return redisClient.zcard(this.queueName);
  }

  async recoveredStalledTasks(): Promise<number> {
    const processingKeys = await redisClient.keys(
      `${this.processingQueueName}:*`
    );
    let recovered = 0;

    for (const key of processingKeys) {
      const itemJson = await redisClient.get(key);
      if (itemJson) {
        const item: QueueItem = JSON.parse(itemJson);

        // If the item has been processing for more than 10 minutes, recover it
        if (Date.now() - item.timestamp > 10 * 60 * 1000) {
          await this.retry(item);
          recovered++;
        }
      }
    }

    return recovered;
  }
}
export const emailQueue = new NotificationQueue("email");
export const smsQueue = new NotificationQueue("sms");
export const otpQueue = new NotificationQueue("otp");
export const pushQueue = new NotificationQueue("push");
