import Redis from "ioredis";
import { EventEmitter } from "events";
import { timeStamp } from "console";
class NotificationMetricsService extends EventEmitter {
  private redis: Redis;
  private metricsCache: Map<String, any> = new Map();
  private lastUpdate = Date.now();

  //   constructor(redisConfig?: any) {
  //     super();
  //     this.redis = new Redis(
  //       redisConfig || {
  //         host: "localhost",
  //         port: 6379,
  //         retryDelayOnFailover: 100,
  //         lazyConnect: true,
  //       }
  //     );
  //   }

  async incrementQueued(type: "email" | "sms" | "otp" | "push") {
    const pipeline = this.redis.pipeline();
    const now = Date.now();
    const day = Math.floor((now / 1000) * 60 * 60 * 24);

    pipeline.incr(`notification:${type}:queued`);
    pipeline.incr(`notification:queued:day:${day}`);
    pipeline.expire(`notification:queued:day:${day}`, 24 * 60 * 60);

    await pipeline.exec();
    this.emit("queue", { type, timeStamp: now });
  }

  async increamentPocessing(type: "email" | "sms" | "otp" | "sms") {
    const pipeline = this.redis.pipeline();
    const now = Date.now();
    pipeline.incr(`notification:${type}:processing`);
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
    this.emit("processing", { type, timeStamp: now });
  }
}

export default NotificationMetricsService;
