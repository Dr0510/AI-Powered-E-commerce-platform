import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: String,
    image: String,
    price: Number,
    priceInPaise: Number,
    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clerkId: {
      type: String,
      index: true,
    },
    customer: {
      name: String,
      email: String,
    },
    items: [orderItemSchema],
    totalInPaise: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      default: undefined,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "payment_pending", "paid", "payment_failed", "cancelled"],
      default: "pending",
    },
    fulfillmentStatus: {
      type: String,
      enum: ["unfulfilled", "packed", "shipped", "delivered", "cancelled"],
      default: "unfulfilled",
    },
    stockAdjusted: {
      type: Boolean,
      default: false,
    },
    payment: {
      provider: {
        type: String,
        default: "razorpay",
      },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      currency: {
        type: String,
        default: "INR",
      },
      amountInPaise: Number,
      status: {
        type: String,
        default: "created",
      },
    },
    shippingAddress: {
      name: String,
      line1: String,
      city: String,
      country: String,
      phone: String,
      pincode: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
