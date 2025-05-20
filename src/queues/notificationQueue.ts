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
  async retry(item: QueueItem): Promise<void> {
    item.retryCount++;
    item.timestamp = Date.now();
    // await e
  }
}
