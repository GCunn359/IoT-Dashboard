import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data/iot-dashboard.sqlite",
  },
  out: "./drizzle",
  schema: "./src/db/schema.ts",
});
