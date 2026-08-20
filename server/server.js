const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
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
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

console.log("GAME ROUTES EXPORT:", gameRoutes);
console.log("SET SOCKET IO TYPE:", typeof gameRoutes.setSocketIO);

gameRoutes.setSocketIO(io);
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join-game", (gameId) => {
    if (!gameId) return;

    socket.join(`game:${gameId}`);

    console.log(
      `🎱 Socket ${socket.id} joined game ${gameId}`
    );
  });

  socket.on("leave-game", (gameId) => {
    if (!gameId) return;

    socket.leave(`game:${gameId}`);

    console.log(
      `🚪 Socket ${socket.id} left game ${gameId}`
    );
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
  });
});
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
app.use((req, res, next) => {
  console.log("➡️ REQUEST:", req.method, req.url);
  next();
});
// ==========================================================================
// 2. API ROUTES
// ==========================================================================
app.use("/api", authRoutes);
app.use("/api/houses", houseRoutes); 
 // In your main server file where other routes are defined

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
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});