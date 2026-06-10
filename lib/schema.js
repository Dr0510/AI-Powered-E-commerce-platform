import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "./db.js";

let schemaInitialized = false;
let schemaPromise = null;

function splitSqlStatements(sqlText) {
  return sqlText
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

export async function ensureDatabaseSchema() {
  if (schemaInitialized) return;
  if (process.env.SKIP_AUTO_SCHEMA_INIT === "true") return;

  if (!schemaPromise) {
    schemaPromise = (async () => {
      try {
        const schemaPath = join(process.cwd(), "db", "schema.sql");
        const schemaSql = await readFile(schemaPath, "utf8");
        const sql = db();
        const statements = splitSqlStatements(schemaSql);

        for (const statement of statements) {
          try {
            await sql.query(statement, []);
          } catch (err) {
            if (!err.message?.includes("already exists")) {
              console.error("Schema statement failed:", err.message, statement.substring(0, 80));
            }
          }
        }
        schemaInitialized = true;
      } catch (err) {
        console.error("Schema initialization failed:", err.message);
        schemaPromise = null;
      }
    })();
  }

  return schemaPromise;
}