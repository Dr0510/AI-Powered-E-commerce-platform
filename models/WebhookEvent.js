import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: "razorpay",
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    event: String,
    processedAt: Date,
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.WebhookEvent ||
  mongoose.model("WebhookEvent", webhookEventSchema);
