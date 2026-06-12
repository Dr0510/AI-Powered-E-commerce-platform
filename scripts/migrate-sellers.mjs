/**
 * One-time migration script to add missing seller columns.
 * Run with: node scripts/migrate-sellers.mjs
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(url);

const migrations = [
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS full_name text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS profile_photo_url text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS business_type text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS business_description text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS country text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS aadhaar_number text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS pan_number text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS gst_number text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS id_upload_url text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS bank_details jsonb NOT NULL DEFAULT '{}'::jsonb`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS shipping_options text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS return_policy text`,
  `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS store_policies text`,
];

async function run() {
  for (const m of migrations) {
    try {
      await sql.query(m);
      console.log(`✓ ${m}`);
    } catch (err) {
      console.error(`✕ ${m}: ${err.message}`);
    }
  }
  console.log("Migration complete");
}

run();