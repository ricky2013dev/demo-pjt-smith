import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

// Build DATABASE_URL from individual PG vars if not set directly
if (!process.env.DATABASE_URL) {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || "5432";
  const user = process.env.PUSER || process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const db = process.env.POSTGRES_DB || process.env.PGDATABASE;

  if (host && user && password && db) {
    process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${db}?sslmode=require`;
  }
}
