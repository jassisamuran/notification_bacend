import { Router } from "express";
import mongoose from "mongoose";
import kafka from "../../kafka/kafka";
import redisClient from "../queues/redisClient";
const healthCheck: Router = Router();

healthCheck.get("/", async (req, res) => {
  try {
    const healthChecks = await Promise.allSettled([
      checkKafkaHealth(),
      checkRedisHealth,
      checkMongoHealth,
    ]);

    const kafka =
      healthChecks[0].status === "fulfilled" && healthChecks[0].value;
    const redis =
      healthChecks[1].status === "fulfilled" && healthChecks[1].value;
    const mongodb =
      healthChecks[2].status === "fulfilled" && healthChecks[2].value;

    const allHealthy = kafka && redis && mongodb;
    const status = allHealthy ? "healthy" : "degraded";
    res.status(allHealthy ? 200 : 503).json({
      status,
      timeStamp: new Date().toISOString(),
      services: {
        kafka: kafka ? "connected" : "disconnected",
        redis: redis ? "connected" : "disconnected",
        mongodb: mongodb ? "connected" : "disconnected",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
});

async function checkKafkaHealth(): Promise<boolean> {
  try {
    const admin = kafka.admin();
    await admin.connect();
    await admin.listTopics();
    await admin.disconnect();
    return true;
  } catch (error) {
    console.error("Kafka health check failed:", error);
    return false;
  }
}

async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redisClient.ping();
    return pong === "PONG";
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
}

async function checkMongoHealth(): Promise<boolean> {
  try {
    if (!mongoose.connection.db) {
      console.error("MongoDB health check failed: no db connection");
      return false;
    }
    await mongoose.connection.db.admin().ping();
    return mongoose.connection.readyState === 1;
  } catch (error) {
    console.error("MongoDB health check failed:", error);
    return false;
  }
}
