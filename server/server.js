const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cron = require("node-cron");

const pool = require("./db");

// Import all route modules
const authRoutes = require("./routes/auth");
const houseRoutes = require("./routes/houses");
const gameRoutes = require("./routes/games");
const cashierRoutes = require("./routes/cashiers");
const soldCartelasRoutes = require("./routes/soldCartelas");
const cartelasRoutes = require("./routes/cartelas");
const settingsRoutes = require("./routes/settings");
const salesRoutes = require("./routes/sales");
const notificationRoutes = require("./routes/notifications");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================================================
// 1. AUTOMATED BACKGROUND DATA CLEARANCE (Cron Job)
// ==========================================================================
// Runs every day at midnight (00:00) automatically to clear out very old data
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running automated background data clearance...");
    
    // Automatically delete logs older than 365 days
    const result = await pool.query(`
      DELETE FROM game_logs 
      WHERE created_at < NOW() - INTERVAL '365 days'
    `);

    console.log(`Automatic background cleanup complete: Removed ${result.rowCount} expired records.`);
  } catch (err) {
    console.error("Error during automated background clearance:", err);
  }
});

// ==========================================================================
// 2. API ROUTES
// ==========================================================================
app.use("/api", authRoutes);
app.use("/api/houses", houseRoutes);       // Handles manual period deletions like DELETE /api/houses/:id/period
app.use("/api/games", gameRoutes);
app.use("/api/cashiers", cashierRoutes);
app.use("/api/sold-cartelas", soldCartelasRoutes);
app.use("/api/cartelas", cartelasRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check route
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "🎉 Bingo Backend Connected!",
      databaseTime: result.rows[0].now,
    });
 } catch (err) {
  console.error("DATABASE ERROR:", err);
  res.status(500).json({
    error: "Database connection failed",
    details: err.message,
  });
}
});

// ==========================================================================
// 3. START SERVER
// ==========================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});