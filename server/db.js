
const path = require("path");
const { Pool } = require("pg");

// Load the project-root .env file explicitly.
// Existing environment variables are not overwritten.
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing from the project-root .env file."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },

  max: 20,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  console.error(
    "⚠️ PostgreSQL idle connection error:",
    err.message
  );
});

(async () => {
  try {
    const result = await pool.query("SELECT NOW()");

    console.log(
      "✅ PostgreSQL database connected:",
      result.rows[0].now
    );
  } catch (err) {
    console.error(
      "❌ PostgreSQL connection failed:",
      err.message
    );
  }
})();

module.exports = pool;
