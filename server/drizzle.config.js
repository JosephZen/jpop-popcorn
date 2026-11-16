/** @type { import("drizzle-kit").Config } */
export default {
  schema: "./src/models/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/db",
  }
};
