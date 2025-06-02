import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ["email", "sms", "whatsapp"], required: true },
  to: { type: String, required: true },
  from: String,
  payload: mongoose.Schema.Types.Mixed,

  status: {
    type: String,
    enum: ["queued", "processing", "sent", "failed"],
    default: "queued",
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
