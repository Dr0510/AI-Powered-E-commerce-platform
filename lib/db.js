import { neon } from "@neondatabase/serverless";

let cached = global.neonSql;

if (!cached) {
  cached = global.neonSql = { sql: null };
}

export function databaseUrl() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for Neon PostgreSQL");
  }

  return url;
}

export function db() {
  if (!cached.sql) {
    cached.sql = neon(databaseUrl());
  }

  return cached.sql;
}

export default async function connectDB() {
  return db();
}
