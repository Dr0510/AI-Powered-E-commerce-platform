import { db } from "@/lib/db";
import { createEmbedding, productText } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { productPayload } from "@/lib/catalog";

const products = [
  {
    title: "DR One 5G Smartphone",
    description: "AMOLED display, 128GB storage, long battery life, and a camera built for night shots.",
    price: 19099,
    category: "Mobiles",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
    stock: 34,
    tags: ["mobile", "smartphone", "5g", "camera"],
  },
  {
    title: "Galaxy Max Power Bank",
    description: "Compact 20000mAh fast-charging power bank for phones, earbuds, and tablets.",
    price: 2499,
    category: "Mobiles",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80",
    stock: 50,
    tags: ["mobile", "charging", "power bank", "travel"],
  },
  {
    title: "DR Mini 4G Smartphone",
    description: "Budget Android phone with 64GB storage, dual SIM support, and all-day battery for basic daily use.",
    price: 4599,
    category: "Mobiles",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
    stock: 38,
    tags: ["mobile", "smartphone", "phone", "android", "budget", "4g"],
  },
  {
    title: "Urban Denim Jacket",
    description: "Classic blue denim jacket with a relaxed fit for everyday streetwear styling.",
    price: 4599,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80",
    stock: 26,
    tags: ["fashion", "jacket", "denim", "casual"],
  },
  {
    title: "Premium Cotton Kurta Set",
    description: "Soft festive kurta set with breathable fabric and clean modern detailing.",
    price: 3699,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=900&q=80",
    stock: 32,
    tags: ["fashion", "ethnic", "cotton", "festive"],
  },
  {
    title: "Noise Canceling Headphones",
    description: "Wireless over-ear headphones tuned for deep focus, travel, and rich bass.",
    price: 10799,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    stock: 15,
    tags: ["audio", "wireless", "music", "travel"],
  },
  {
    title: "DR Vision 4K Smart TV",
    description: "Ultra HD smart TV with vivid color, Dolby audio, and built-in streaming apps.",
    price: 33199,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80",
    stock: 12,
    tags: ["tv", "4k", "entertainment", "electronics"],
  },
  {
    title: "Smart Desk Lamp",
    description: "Dimmable LED lamp with warm and cool modes for reading and late-night work.",
    price: 3299,
    category: "Home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    stock: 30,
    tags: ["desk", "lighting", "study", "home"],
  },
  {
    title: "Ceramic Coffee Set",
    description: "Two handmade ceramic mugs with a matte glaze for slow mornings and gifting.",
    price: 2699,
    category: "Home",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
    stock: 40,
    tags: ["coffee", "kitchen", "gift", "ceramic"],
  },
  {
    title: "Blue Running Sneakers",
    description: "Comfortable everyday sneakers with breathable mesh and cushioned soles.",
    price: 4999,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    stock: 24,
    tags: ["shoes", "running", "casual", "blue"],
  },
  {
    title: "Leather Formal Shoes",
    description: "Polished lace-up shoes with cushioned insoles for office and occasion wear.",
    price: 5699,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=80",
    stock: 20,
    tags: ["shoes", "formal", "leather", "office"],
  },
  {
    title: "FrostCool Double Door Refrigerator",
    description: "Energy-efficient refrigerator with convertible freezer and fresh-zone storage.",
    price: 38199,
    category: "Appliances",
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80",
    stock: 18,
    tags: ["appliance", "refrigerator", "kitchen", "cooling"],
  },
  {
    title: "AeroWash Front Load Washer",
    description: "Quiet washing machine with quick wash, steam clean, and fabric care modes.",
    price: 29099,
    category: "Appliances",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80",
    stock: 10,
    tags: ["appliance", "washing machine", "laundry", "home"],
  },
  {
    title: "GlowCare Skincare Kit",
    description: "Daily cleanser, serum, and moisturizer set for a simple bright-skin routine.",
    price: 3099,
    category: "Beauty",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
    stock: 22,
    tags: ["beauty", "skincare", "routine", "gift"],
  },
  {
    title: "Salon Pro Hair Dryer",
    description: "Fast-dry hair dryer with cool shot, ionic care, and foldable travel design.",
    price: 2099,
    category: "Beauty",
    image: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=900&q=80",
    stock: 28,
    tags: ["beauty", "hair", "dryer", "styling"],
  },
  {
    title: "STEM Builder Blocks",
    description: "Colorful construction set for creative building, problem solving, and play.",
    price: 2299,
    category: "Toys",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=900&q=80",
    stock: 36,
    tags: ["toys", "kids", "blocks", "learning"],
  },
  {
    title: "Remote Control Racing Car",
    description: "Rechargeable RC car with rugged tires, fast steering, and indoor-outdoor play.",
    price: 3599,
    category: "Toys",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=900&q=80",
    stock: 19,
    tags: ["toys", "car", "remote control", "kids"],
  },
  {
    title: "Minimal Laptop Backpack",
    description: "Water-resistant daypack with laptop storage and clean city styling.",
    price: 6199,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    stock: 18,
    tags: ["bag", "laptop", "travel", "daily"],
  },
  {
    title: "Campus Laptop Backpack",
    description: "Affordable college backpack with padded laptop sleeve, bottle pocket, and rain-resistant fabric.",
    price: 3299,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=80",
    stock: 42,
    tags: ["college", "laptop", "backpack", "bag", "student", "gift"],
  },
  {
    title: "Smart Fitness Watch",
    description: "Health tracking smartwatch with sleep insights, sport modes, and long battery life.",
    price: 7499,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    stock: 25,
    tags: ["watch", "fitness", "accessory", "smart"],
  },
];

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) {
      return response;
    }

    const sql = db();
    await sql`TRUNCATE products RESTART IDENTITY CASCADE`;

    const seededProducts = await Promise.all(
      products.map(async (product) => {
        const payload = productPayload(product);
        return {
          ...payload,
          embedding: (await createEmbedding(productText(payload))) || [],
        };
      }),
    );

    for (const product of seededProducts) {
      await sql`
        INSERT INTO products (title, slug, description, price_in_paise, category, image, images, stock, active, tags, embedding)
        VALUES (
          ${product.title},
          ${product.slug},
          ${product.description},
          ${product.priceInPaise},
          ${product.category},
          ${product.image},
          ${JSON.stringify(product.images)}::jsonb,
          ${product.stock},
          ${product.active},
          ${product.tags},
          ${JSON.stringify(product.embedding)}::jsonb
        )
      `;
    }

    return Response.json({
      message: "Database seeded successfully",
      count: seededProducts.length,
      vectorReady: seededProducts.some((product) => product.embedding.length > 0),
    });
  } catch (error) {
    return Response.json(
      {
        message: "Error seeding database",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
