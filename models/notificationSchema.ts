import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["email", "sms", "whatsapp"],
    required: true,
  },
  to: { type: String, required: true },
  from: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  priority: { type: Number, default: 10 },
  message: { type: String, required: true },

  status: {
    type: String,
    enum: ["pending", "queued", "processing", "sent", "failed", "dead-letter"],
    default: "pending",
  },

  deliveryResult: {
    statusCode: Number,
    providerMessageId: String,
    rawResponse: mongoose.Schema.Types.Mixed,
    errorMessage: String,
  },

  retries: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

export default mongoose.model("Notification", notificationSchema);
