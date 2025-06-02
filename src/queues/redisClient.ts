import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  //   password: process.env.REDIS_PASSWORD,
});

redisClient.on("connect", () => {
  console.log("Redis client connected", process.env.REDIS_HOST);
});

redisClient.on("error", (err) => {
  console.log("Redis error", err);
  process.exit(1);
});

redisClient.on("end", () => {
  console.log("Redis client disconnected");
  process.exit(0);
});

export default redisClient;
