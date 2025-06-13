import Redis from "ioredis";
import redisClient from "../queues/redisClient";
import { EventEmitter } from "events";
import { timeStamp } from "console";
import { pipeline } from "stream";
class NotificationMetricsService extends EventEmitter {
  private redis: Redis;
  private metricsCache: Map<String, any> = new Map();
  private lastUpdate = Date.now();

  constructor() {
    super();
    // this.redis = new Redis(
    //   redisConfig || {
    //     host: "localhost",
    //     port: 6379,
    //     retryDelayOnFailover: 100,
    //     lazyConnect: true,
    //   }
    // );
    this.redis = redisClient;
  }

  async incrementQueued(type: "email" | "sms" | "otp" | "push") {
    const pipeline = this.redis.pipeline();
    const now = Date.now();
    const day = Math.floor((now / 1000) * 60 * 60 * 24);

    pipeline.incr(`notifications:${type}:queued`);
    pipeline.incr(`notifications:queued:day:${day}`);
    pipeline.expire(`notifications:queued:day:${day}`, 24 * 60 * 60);

    await pipeline.exec();
    this.emit("queue", { type, timeStamp: now });
  }

  async increamentPocessing(type: "email" | "sms" | "otp" | "sms") {
    const pipeline = this.redis.pipeline();
    const now = Date.now();
    pipeline.incr(`notifications:${type}:processing`);
    this.emit("processing", { type, timeStamp: now });
  }

  async incrementRetry(type: "email" | "sms" | "otp" | "push") {
    const pipeline = this.redis.pipeline();
    const now = Date.now();
    const day = Math.floor(now / (1000 * 60 * 60 * 24));

    pipeline.incr(`notifications:${type}:retry`);
    pipeline.incr(`notifications:retry:day:${day}`);
    pipeline.expire(`notifications:retry:day:${day}`, 24 * 60 * 60);

    await pipeline.exec();
    this.emit("retry", { type, timeStamp: now });
  }

  async increamentDeadLetter(type: "email" | "sms" | "otp" | "push") {
    const pipeline = this.redis.pipeline();
    const now = Date.now();
    const day = Math.floor((now / 1000) * 60 * 60 * 24);

    pipeline.incr(`notifications:${type}:deadletter`);
    pipeline.incr(`notifications:deadletter:day:${day}`);
    pipeline.expire(`notifications:deadletter:day:${day}`, 24 * 60 * 60);

    await pipeline.exec();
    this.emit("deadletter", { type, timestamp: now });
  }

  async incrementStalled(type: "email" | "sms" | "otp" | "push") {
    const pipeline = this.redis.pipeline();
    const now = Date.now();

    pipeline.incr(`notifications:${type}:stalled`);
    await pipeline.exec();

    this.emit("stalled", { type, timestamp: now });
  }

  async increamentSystemError(
    type: "email" | "sms" | "otp" | "push",
    error: string
  ) {
    const pipeline = this.redis.pipeline();
    const now = Date.now();
    pipeline.incr(`notifications:${type}:system_error`);
    pipeline.incr(`notifications:system_error:${error}`);
    await pipeline.exec();
    this.emit("systemError", { type, error, timeStamp: now });
  }

  async recordProcessingTime(
    type: "email" | "sms" | "otp" | "push",
    timeMs: number
  ) {
    const key = `notifications:${type}:processing_times`;
    // Use a sorted set to track processing times (keep last 1000 entries)
    await this.redis.zadd(key, Date.now(), timeMs);
    await this.redis.zremrangebyrank(key, 0, -1001); //keep last 1000 items
  }
  async updateQueueSize(type: "email" | "sms" | "otp" | "push", size: number) {
    await this.redis.set(`notifications:${type}:queue_size`, size);
    this.emit(`queueSizeUpdate`, { type, size, timeStamp: Date.now() });
  }

  async processingQueueSize(
    type: "email" | "sms" | "otp" | "push",
    size: number
  ) {
    await this.redis.set(`notifications:${type}:processing_size`, size);
  }
  async updateDeadLetterQueueSize(
    type: "email" | "sms" | "otp" | "push",
    size: number
  ) {
    await this.redis.set(`notifications:${type}:deadletter_size`, size);
  }

  async getMetricsByType(type: "email" | "sms" | "otp" | "push") {
    const pipeline = this.redis.pipeline();
    const currentDate = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    pipeline.get(`notifications:${type}:success`);
    pipeline.get(`notifications:${type}:failure`);
    pipeline.get(`notifications:${type}:queued`);
    pipeline.get(`notifications:${type}:retry`);
    pipeline.get(`notifications:${type}:deadletter`);
    pipeline.get(`notifications:${type}:queue_size`);
    pipeline.get(`notifications:${type}:processing_size`);
    pipeline.get(`notifications:${type}:deadletter_size`);

    pipeline.zrange(
      `nofification:${type}:processing_times`,
      -100,
      -1,
      "WITHSCORES"
    );
    const results = await pipeline.exec();

    const totalSent = parseInt(results![0][1] as string) || 0;
    const totalFailed = parseInt(results![1][1] as string) || 0;
    const totalQueued = parseInt(results![2][1] as string) || 0;
    const totalRetry = parseInt(results![3][1] as string) || 0;
    const totalDeadLetter = parseInt(results![4][1] as string) || 0;
    const queueSize = parseInt(results![5][1] as string) || 0;
    const processingSize = parseInt(results![6][1] as string) || 0;
    const deadLetterSize = parseInt(results![7][1] as string) || 0;
    const last24hSuccess = parseInt(results![8][1] as string) || 0;
    const last24hFailure = parseInt(results![9][1] as string) || 0;

    // calculate average processing time
    const processingTimes = results![10][1] as string[];
    let averageProcessingTime = 0;
    if (processingTimes && processingTimes.length > 0) {
      const times = processingTimes
        .filter((_, index) => index % 2 == 0)
        .map(Number);
      averageProcessingTime = times.reduce((a, b) => a + b, 0) / times.length;
    }
    const totalProcessed = totalSent + totalFailed;
    const successRate =
      totalProcessed > 0 ? (totalSent / totalProcessed) * 100 : 0;
    const retryRate = totalQueued > 0 ? (totalRetry / totalQueued) * 100 : 0;
    const deadLetterRate =
      totalQueued > 0 ? (totalDeadLetter / totalQueued) * 100 : 0;
    return {
      type,
      totalSent,
      totalFailed,
      totalQueued,
      totalRetry,
      totalDeadLetter,
      queueSize,
      processingSize,
      deadLetterSize,
      successRate,
      retryRate,
      deadLetterRate,
      last24hSuccess,
      last24hFailure,
      averageProcessingTime: Math.round(averageProcessingTime),
    };
  }

  async increamentSuccess(type: "email" | "sms" | "otp" | "push" = "email") {
    const pipeline = this.redis.pipeline();
    const now = Date.now();
    const hour = Math.floor(now / (1000 * 60 * 60));
    const day = Math.floor(now / (1000 * 60 * 60 * 24));

    pipeline.incr("notifications:total:success");
    pipeline.incr(`notifications:${type}:success`);

    pipeline.incr(`notifications:success:hour:${hour}`);
    pipeline.expire(`notifications:success:hour:${hour}`, 25 * 60 * 60);

    pipeline.incr(`notifications:success:day:${day}`);
    pipeline.expire(`notifications:success:day:${day}`, 25 * 60 * 60);

    const minute = Math.floor(now / (1000 * 60));
    pipeline.incr(`notifications:rate:${minute}`);
    pipeline.expire(`notifications:rate:${minute}`, 120);

    await pipeline.exec();
    this.emit("success", { type, timestamp: now });
  }

  async incrementFailure(
    type: "email" | "sms" | "otp" | "push" = "email",
    error?: string
  ) {
    const pipeline = this.redis.pipeline();
    const now = Date.now();
    const hour = Math.floor(now / (1000 * 60 * 60));
    const day = Math.floor(now / (1000 * 60 * 60 * 24));

    pipeline.incr("notifications:total:failure");
    pipeline.incr(`notifications:${type}:failure`);

    pipeline.incr(`notifications:failure:hour:${hour}`);
    pipeline.expire(`notifications:failure:hour:${hour}`, 25 * 60 * 60);

    pipeline.incr(`notifications:failure:day:${day}`);
    pipeline.expire(`notifications:failure:day:${day}`, 25 * 60 * 60);

    if (error) {
      pipeline.incr(`notifications:errors:${error}`);
      pipeline.expire(`notifications:errors:${error}`, 24 * 60 * 60);
    }

    await pipeline.exec();
    this.emit("failure", { type, error, timestamp: now });
  }
}
export default NotificationMetricsService;
