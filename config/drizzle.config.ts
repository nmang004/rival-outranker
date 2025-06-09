import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const drizzleFileName = fileURLToPath(import.meta.url);
const drizzleDirName = path.dirname(drizzleFileName);

export default defineConfig({
  out: path.resolve(drizzleDirName, "../migrations"),
  schema: path.resolve(drizzleDirName, "../shared/schema.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
