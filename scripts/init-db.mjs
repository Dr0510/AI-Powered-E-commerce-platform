import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to initialize Neon tables.");
  process.exit(1);
}

const schemaPath = join(process.cwd(), "db", "schema.sql");
const schemaSql = await readFile(schemaPath, "utf8");
const statements = schemaSql
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

const sql = neon(databaseUrl);

for (const statement of statements) {
  await sql.query(statement, []);
}

console.log(`Database schema initialized: ${statements.length} statements applied.`);
