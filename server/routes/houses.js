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
// GET HOUSE PERFORMANCE & LOGS
// DAILY / WEEKLY / MONTHLY / YEARLY
// ==========================================================================
// ==========================================================
// 📊 HOUSE PERFORMANCE
// 🇪🇹 ETHIOPIAN TIME — AFRICA/ADDIS_ABABA
// ==========================================================
router.get("/:id/performance", async (req, res) => {  console.log("🚨🚨🚨 NEW PERFORMANCE ROUTE IS RUNNING 🚨🚨🚨");
  try {
    const { id } = req.params;
    const houseId = String(id);

    console.log("🔥 PERFORMANCE ROUTE HIT - NEW CODE");
    console.log("🏠 HOUSE ID:", houseId);

    const result = await pool.query(
      `
      WITH ethiopia_now AS (
        SELECT
          CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa' AS now
      ),

      periods AS (
        SELECT
          now,

          /* =========================
             DAILY
             Ethiopia calendar day
             ========================= */
          date_trunc('day', now) AS daily_start,
          date_trunc('day', now) + INTERVAL '1 day' AS daily_end,

          /* =========================
             WEEKLY
             Monday -> Sunday
             ========================= */
          date_trunc('week', now) AS weekly_start,
          date_trunc('week', now) + INTERVAL '7 days' AS weekly_end,

          /* =========================
             MONTHLY
             ========================= */
          date_trunc('month', now) AS monthly_start,
          date_trunc('month', now) + INTERVAL '1 month' AS monthly_end,

          /* =========================
             YEARLY
             ========================= */
          date_trunc('year', now) AS yearly_start,
          date_trunc('year', now) + INTERVAL '1 year' AS yearly_end

        FROM ethiopia_now
      )

      SELECT

        /* =====================================================
           DAILY
           ===================================================== */

        COALESCE(
          SUM(
            CASE
              WHEN g.created_at >= p.daily_start
               AND g.created_at < p.daily_end
              THEN COALESCE(g.cards_sold, 0)
              ELSE 0
            END
          ),
          0
        ) AS daily_cards,

        COALESCE(
          SUM(
            CASE
              WHEN g.created_at >= p.daily_start
               AND g.created_at < p.daily_end
              THEN COALESCE(g.house_commission, 0)
              ELSE 0
            END
          ),
          0
        ) AS daily_commission,

        COUNT(*) FILTER (
          WHERE g.created_at >= p.daily_start
            AND g.created_at < p.daily_end
        ) AS daily_games,


        /* =====================================================
           WEEKLY
           ===================================================== */

        COALESCE(
          SUM(
            CASE
              WHEN g.created_at >= p.weekly_start
               AND g.created_at < p.weekly_end
              THEN COALESCE(g.cards_sold, 0)
              ELSE 0
            END
          ),
          0
        ) AS weekly_cards,

        COALESCE(
          SUM(
            CASE
              WHEN g.created_at >= p.weekly_start
               AND g.created_at < p.weekly_end
              THEN COALESCE(g.house_commission, 0)
              ELSE 0
            END
          ),
          0
        ) AS weekly_commission,

        COUNT(*) FILTER (
          WHERE g.created_at >= p.weekly_start
            AND g.created_at < p.weekly_end
        ) AS weekly_games,


        /* =====================================================
           MONTHLY
           ===================================================== */

        COALESCE(
          SUM(
            CASE
              WHEN g.created_at >= p.monthly_start
               AND g.created_at < p.monthly_end
              THEN COALESCE(g.cards_sold, 0)
              ELSE 0
            END
          ),
          0
        ) AS monthly_cards,

        COALESCE(
          SUM(
            CASE
              WHEN g.created_at >= p.monthly_start
               AND g.created_at < p.monthly_end
              THEN COALESCE(g.house_commission, 0)
              ELSE 0
            END
          ),
          0
        ) AS monthly_commission,

        COUNT(*) FILTER (
          WHERE g.created_at >= p.monthly_start
            AND g.created_at < p.monthly_end
        ) AS monthly_games,


        /* =====================================================
           YEARLY
           ===================================================== */

        COALESCE(
          SUM(
            CASE
              WHEN g.created_at >= p.yearly_start
               AND g.created_at < p.yearly_end
              THEN COALESCE(g.cards_sold, 0)
              ELSE 0
            END
          ),
          0
        ) AS yearly_cards,

        COALESCE(
          SUM(
            CASE
              WHEN g.created_at >= p.yearly_start
               AND g.created_at < p.yearly_end
              THEN COALESCE(g.house_commission, 0)
              ELSE 0
            END
          ),
          0
        ) AS yearly_commission,

        COUNT(*) FILTER (
          WHERE g.created_at >= p.yearly_start
            AND g.created_at < p.yearly_end
        ) AS yearly_games

      FROM public.games g
      CROSS JOIN periods p

      WHERE g.house_id = $1
      `,
      [houseId]
    );

    const stats = result.rows[0];

    console.log("🔥 PERFORMANCE RESULT FOR HOUSE:", houseId);

    console.log("📅 DAILY:", {
      cards: stats.daily_cards,
      commission: stats.daily_commission,
      games: stats.daily_games,
    });

    console.log("📅 WEEKLY:", {
      cards: stats.weekly_cards,
      commission: stats.weekly_commission,
      games: stats.weekly_games,
    });

    console.log("📅 MONTHLY:", {
      cards: stats.monthly_cards,
      commission: stats.monthly_commission,
      games: stats.monthly_games,
    });

    console.log("📅 YEARLY:", {
      cards: stats.yearly_cards,
      commission: stats.yearly_commission,
      games: stats.yearly_games,
    });

  res.json({
  success: true,
  TEST: "NEW PERFORMANCE CODE 12345",
  performance: {
    daily_cards: Number(stats.daily_cards || 0),
    daily_commission: Number(stats.daily_commission || 0),
    daily_games: Number(stats.daily_games || 0),

    weekly_cards: Number(stats.weekly_cards || 0),
    weekly_commission: Number(stats.weekly_commission || 0),
    weekly_games: Number(stats.weekly_games || 0),

    monthly_cards: Number(stats.monthly_cards || 0),
    monthly_commission: Number(stats.monthly_commission || 0),
    monthly_games: Number(stats.monthly_games || 0),

    yearly_cards: Number(stats.yearly_cards || 0),
    yearly_commission: Number(stats.yearly_commission || 0),
    yearly_games: Number(stats.yearly_games || 0),
  },
});
  } catch (err) {
    console.error("❌ HOUSE PERFORMANCE ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
// ==========================================================================
// DELETE RECORDS BY PERIOD TYPE (DAILY, WEEKLY, MONTHLY, YEARLY)
// ==========================================================================
// ==========================================================================
// DELETE HOUSE RECORDS BY PERIOD
// 🇪🇹 ETHIOPIAN TIME
// ==========================================================================

router.delete("/:id/records", async (req, res) => {
  try {
    const { id } = req.params;
    const type = String(req.query.type || "").toUpperCase();

    let condition;

    if (type === "DAILY") {
      condition = `
        created_at >=
        date_trunc(
          'day',
          CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa'
        ) AT TIME ZONE 'Africa/Addis_Ababa'
      `;
    } else if (type === "WEEKLY") {
      condition = `
        created_at >=
        date_trunc(
          'week',
          CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa'
        ) AT TIME ZONE 'Africa/Addis_Ababa'
      `;
    } else if (type === "MONTHLY") {
      condition = `
        created_at >=
        date_trunc(
          'month',
          CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa'
        ) AT TIME ZONE 'Africa/Addis_Ababa'
      `;
    } else if (type === "YEARLY") {
      condition = `
        created_at >=
        date_trunc(
          'year',
          CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Addis_Ababa'
        ) AT TIME ZONE 'Africa/Addis_Ababa'
      `;
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid period type",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM game_logs
      WHERE house_id = $1
      AND ${condition}
      `,
      [Number(id)]
    );

    console.log(
      `🗑️ DELETED ${result.rowCount} ${type} RECORDS FOR HOUSE ${id}`
    );

    res.json({
      success: true,
      deletedCount: result.rowCount,
      message: `Successfully deleted ${type} records.`,
    });

  } catch (err) {
    console.error("❌ DELETE PERIOD ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
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