const express = require("express");
const router = express.Router();
const pool = require("../db");

// ===========================
// IMPORT ALL CARTELAS
// ===========================
router.post("/import", async (req, res) => {
  console.log("IMPORT ROUTE HIT");
  try {
    const { cartelas } = req.body;

    for (const cartela of cartelas) {
      await pool.query(
        `INSERT INTO cartelas
        (id, serial, numbers, status)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (id) DO NOTHING`,
        [
          cartela.id,
          cartela.serial,
          JSON.stringify(cartela.numbers),
          cartela.status || "available",
        ]
      );
    }

    res.json({
      success: true,
      imported: cartelas.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// GET ALL CARTELAS
// ===========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM cartelas ORDER BY id ASC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;