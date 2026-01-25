import { Router } from "express";
import mongoose from "mongoose";
import kafka from "../../kafka/kafka";
import { emailQueue, otpQueue, smsQueue } from "../queues/notificationQueue";
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

healthCheck.get("metrics/", async (req, res) => {
  try {
    const [emailQueueSize, smsQueueSize, otpQueueSize] = await Promise.all([
      emailQueue.getlength(),
      smsQueue.getlength(),
      otpQueue.getlength(),
      // getNotificationStats(),
    ]);

    const emailProcessingKeys = await redisClient.keys(
      "processingQueue:email:*",
    );
    const smsProcessingKeys = await redisClient.keys("processingQueue:sms:*");
    const otpProcessingKeys = await redisClient.keys("processingQueue:otp:*");

    const emailDlQSize = await redisClient.llen("deadLetterQueue:email");
    const smsDlQSize = await redisClient.llen("deadLetterQueue:sms");
    const otpDlQSize = await redisClient.llen("deadLetterQueue:otp");

    res.json({
      timeStamp: new Date().toISOString,
      email: {
        pending: emailQueue,
        processing: emailProcessingKeys,
        deadLetter: emailDlQSize,
      },
      sms: {
        pending: smsQueueSize,
        processing: smsProcessingKeys.length,
        deadLetter: smsDlQSize,
      },
      otp: {
        pending: otpQueueSize,
        processing: otpProcessingKeys.length,
        deadLetter: otpDlQSize,
      },
      // performance: {
      //   totalProcessed: stats.total,
      //   successRate: stats.successRate,
      //   avgProcessingTime: stats.avgProcessingTime,
      // },
      // stats: {
      //   last24h: stats.last24h,
      //   byStatus: stats.byStatus,
      //   byType: stats.byType,
      // },
    });
  } catch (error) {}
});

// async function getNotificationStats() {
//   const now = new Date();
//   const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

//   const [total, last24h, byStatus, byType, avgTime] = await Promise.all([
//     Notification.countDocuments(),
//     Notification.countDocuments({ createdAt: { $gte: oneDayAgo } }),
//     Notification.aggregate([
//       { $group: { _id: "$status", count: { $sum: 1 } } },
//     ]),
//     Notification.aggregate([
//       { $group: { _id: "$type", count: { $sum: 1 } } },
//     ]),
//     Notification.aggregate([
//       {
//         $match: {
//           status: "sent",
//           updatedAt: { $exists: true },
//           createdAt: { $exists: true },
//         },
//       },
//       {
//         $project: {
//           processingTime: {
//             $subtract: ["$updatedAt", "$createdAt"],
//           },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           avgTime: { $avg: "$processingTime" },
//         },
//       },
//     ]),
//   ]);

//   const statusMap = byStatus.reduce((acc, item) => {
//     acc[item._id] = item.count;
//     return acc;
//   }, {} as Record<string, number>);

//   const typeMap = byType.reduce((acc, item) => {
//     acc[item._id] = item.count;
//     return acc;
//   }, {} as Record<string, number>);

//   const successCount = statusMap.sent || 0;
//   const successRate = total > 0 ? ((successCount / total) * 100).toFixed(2) : "0.00";

//   return {
//     total,
//     last24h,
//     successRate: parseFloat(successRate),
//     avgProcessingTime: avgTime[0]?.avgTime || 0,
//     byStatus: statusMap,
//     byType: typeMap,
//   };
// }

export default healthCheck;
