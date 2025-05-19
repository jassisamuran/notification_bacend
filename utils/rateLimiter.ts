import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
const redisClient=new Redis({
    host:process.env.REDIS_HOST,
    port:6370,
})

const rateLimiter=new RateLimiterRedis({
    storeClient:redisClient,
    points:5, 
    duration:1,
    keyPrefix:"rateLimiter",
    blockDuration:60,
})

export const checkRateLimiter=async(userId:string)=>{
    try {
        await rateLimiter.consume(userId);
        return true;
    } catch (error) {
        return false;
    }
}