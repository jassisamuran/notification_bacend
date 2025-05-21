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

  async enqueue(payload: any, priority: number = 0) {
    const id = uuidv4();
    const item: QueueItem = {
      id,
      payload,
      retryCount: 0,
      timestamp: Date.now(),
      priority: priority,
    };
    await redisClient.zadd(this.queueName, priority, JSON.stringify(item));
    console.log(
      `Added item ${id} to queue in ${this.queueName} with priority ${priority}`
    );
    return id;
  }
  async dequeue(): Promise<QueueItem | null> {
    const result = await redisClient.zpopmin(this.queueName);
    if (!result || result.length === 0) {
      return null;
    }
    const itemJson = result[0]; // check this is correct or not
    const item: QueueItem = JSON.parse(itemJson);
    await redisClient.set(
      `${this.processingQueueName}:${item.id}`,
      itemJson,
      "EX",
      300
    );
    return item;
  }
  async complete(id: string): Promise<void> {
    await redisClient.del(`${this.processingQueueName}:${id}`);
    console.log(`Completed processing item ${id}`);
  }
  async retry(item: QueueItem, delay: number = 60): Promise<void> {
    item.retryCount++;
    item.timestamp = Date.now();
    await redisClient.del(`${this.processingQueueName}:${item.id}`);

    const newPriorityqueue = item.priority + item.retryCount * delay; //check out this
    if (item.retryCount < 5) {
      await redisClient.lpush(this.deadLetterQueueName, JSON.stringify(item));
      console.log(
        `moved item ${item.id} form dead letter queue after ${item.retryCount} `
      );
    } else {
      await redisClient.zadd(
        this.queueName,
        newPriorityqueue,
        JSON.stringify(item)
      );
      console.log(
        `Requeued item ${item.id} with new priority ${newPriorityqueue}, retry ${item.retryCount}`
      );
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
