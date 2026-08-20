const { Pool } = require("pg");

require("dotenv").config({
  path: "../.env"
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },

  // Shared pool for all houses/cashiers
  max: 20,

  // Keep idle connections reusable
  idleTimeoutMillis: 300000,

  // Maximum time waiting for an available pool connection
  connectionTimeoutMillis: 5000,

  // Keep PostgreSQL connections alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Prevent idle connection errors from crashing Node
pool.on("error", (err) => {
  console.error(
    "⚠️ PostgreSQL idle connection error:",
    err.message
  );
});

// Test connection when server starts
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