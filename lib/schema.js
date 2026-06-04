import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "./db.js";

let schemaPromise = global.schemaInitPromise;

function splitSqlStatements(sqlText) {
  return sqlText
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

export async function ensureDatabaseSchema() {
  if (process.env.SKIP_AUTO_SCHEMA_INIT === "true") {
    return;
  }

  if (!schemaPromise) {
    schemaPromise = global.schemaInitPromise = (async () => {
      const schemaPath = join(process.cwd(), "db", "schema.sql");
      const schemaSql = await readFile(schemaPath, "utf8");
      const sql = db();

      for (const statement of splitSqlStatements(schemaSql)) {
        await sql.query(statement, []);
      }
    })();
  }

  return schemaPromise;
}
