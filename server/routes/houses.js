const express = require("express");
const router = express.Router();
const pool = require("../db");

// ==========================================================================
// GET SUPER ADMIN TIER CONFIG
// ==========================================================================
router.get("/superadmin/tiers", async (req, res) => {
  try {
    res.json({ silver: "8000", gold: "15000", diamond: "30000" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// GET ALL HOUSES
// ==========================================================================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM houses ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// GET SINGLE HOUSE
// ==========================================================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM houses WHERE id = $1",
      [Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "House not found",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ==========================================================================
// RECHARGE HOUSE PACKAGE
// ==========================================================================
router.post("/:id/package", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid package amount provided." });
    }

    const result = await pool.query(
      `UPDATE houses
       SET
         remaining_package = COALESCE(remaining_package, 0) + $1,
         total_package = COALESCE(total_package, 0) + $1
       WHERE id = $2
       RETURNING *`,
      [numericAmount, Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "House not found" });
    }

    res.json({
      success: true,
      remainingAmount: result.rows[0].remaining_package,
      totalAmount: result.rows[0].total_package,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// UPDATE HOUSE REMAINING PACKAGE ONLY
// ==========================================================================
router.put("/:id/remaining-package", async (req, res) => {
  try {
    const { id } = req.params;
    const { remaining_package } = req.body;

    const result = await pool.query(
      `UPDATE houses
       SET remaining_package = $1
       WHERE id = $2
       RETURNING *`,
      [Number(remaining_package), Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "House not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// UPDATE HOUSE PACKAGE (PUT)
// ==========================================================================
router.put("/:id/package", async (req, res) => {
  try {
    const { id } = req.params;
    const { remaining_package } = req.body;

    const result = await pool.query(
      `UPDATE houses
       SET remaining_package = $1
       WHERE id = $2
       RETURNING *`,
      [Number(remaining_package), Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "House not found" });
    }

    res.json({
      success: true,
      remainingAmount: result.rows[0].remaining_package,
      totalAmount: result.rows[0].total_package,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// GET HOUSE PERFORMANCE & LOGS (WITH REFRESH DATA)
// ==========================================================================
router.get("/:id/performance", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM game_logs WHERE house_id = $1 ORDER BY created_at DESC`,
      [Number(id)]
    );

    const rows = result.rows;

    const summary = rows.reduce(
      (acc, row) => {
        acc.cartelasSold += Number(row.cartelas_sold || 0);
        acc.netCommission += Number(row.commission || 0);
        acc.gamesPlayed += 1;
        return acc;
      },
      { cartelasSold: 0, netCommission: 0, gamesPlayed: 0 }
    );

    res.json({
      success: true,
      summary,
      logs: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// DELETE RECORDS BY PERIOD TYPE (DAILY, WEEKLY, MONTHLY, YEARLY)
// ==========================================================================
router.delete("/:id/records", async (req, res) => {
  try {
    const { id } = req.params;
    const type = String(req.query.type || "").toUpperCase(); 

    let timeInterval = "24 hours";
    if (type === "WEEKLY") timeInterval = "7 days";
    if (type === "MONTHLY") timeInterval = "30 days";
    if (type === "YEARLY") timeInterval = "365 days";

    const deleteQuery = `
      DELETE FROM game_logs 
      WHERE house_id = $1 
      AND created_at < NOW() - $2::INTERVAL
    `;

    const result = await pool.query(deleteQuery, [Number(id), timeInterval]);

    res.json({
      success: true,
      deletedCount: result.rowCount,
      message: `Successfully deleted expired ${type} records.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// GET CASHIERS FOR A SPECIFIC HOUSE
// ==========================================================================
// GET CASHIERS FOR A SPECIFIC HOUSE (UNIVERSAL ALIASING)
// ==========================================================================
// ==========================================================================
// GET CASHIERS FOR A SPECIFIC HOUSE (UNIVERSAL MAPPING ROUTE)
// ==========================================================================
router.get("/:id/cashiers", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM cashiers WHERE house_id = $1 ORDER BY id DESC`,
      [Number(id)]
    );

    // Map database columns explicitly to prevent mismatch with frontend expectations
    const formattedCashiers = result.rows.map(row => ({
      id: row.id,
      house_id: row.house_id,
      username: row.username || row.name || row.cashier_name || row.col1 || "N/A",
      password: row.password || row.pass || row.cashier_password || row.col2 || "N/A",
      phone: row.phone || row.telephone || row.mobile || row.col3 || "",
      status: row.status || "Active"
    }));

    res.json({
      success: true,
      cashiers: formattedCashiers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// ==========================================================================
// CREATE A NEW CASHIER FOR A HOUSE
// ==========================================================================
router.post("/:id/cashiers", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Username and password are required." 
      });
    }

    const result = await pool.query(
      `INSERT INTO cashiers (house_id, username, password, phone, status)
       VALUES ($1, $2, $3, $4, 'Active')
       RETURNING *`,
      [Number(id), username, password, phone || null]
    );

    res.json({
      success: true,
      cashier: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;