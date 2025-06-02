import { Request, Response, NextFunction } from "express";

const notificationPayload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, message, type } = req.body;
  if (!userId || !type) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  next();
};

export default notificationPayload;
