import { Request, Response, NextFunction } from "express";

const userRequests: { [key: string]: number[] } = {};
const window_time = Number(process.env.WINDOW_TIME) || 60000; // default 1 minute
const max_requests = Number(process.env.MAX_REQUESTS) || 500; // default 5 requests

const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const userId = String(req.body.userId);
  if (!userId) {
    res.status(400).json({ error: "Missing userId in request body" });
    return;
  }
  const now = Date.now();
  if (!userRequests[userId]) {
    userRequests[userId] = [];
  }
  userRequests[userId] = userRequests[userId].filter(
    (ts: number) => now - ts < window_time
  );

  if (userRequests[userId].length >= max_requests) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  userRequests[userId].push(now);
  next();
};

export default rateLimiter;
