import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    description: String,
    priceInPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      default: undefined,
    },
    category: {
      type: String,
      default: "General",
    },
    image: {
      type: String,
      default: "",
    },
    images: [
      {
        url: String,
        publicId: String,
        width: Number,
        height: Number,
        alt: String,
      },
    ],
    stock: {
      type: Number,
      default: 10,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    tags: [String],
    embedding: [Number],
  },
  {
    timestamps: true,
  },
);

productSchema.index({ title: "text", description: "text", category: "text", tags: "text" });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
