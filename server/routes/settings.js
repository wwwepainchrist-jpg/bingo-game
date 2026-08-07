const express = require("express");
const router = express.Router();
const pool = require("../db");

// Create table automatically if it doesn't exist
router.put("/", async (req, res) => {
  try {
    const { key, value } = req.body;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    await pool.query(
      `
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value
      `,
      [key, String(value)]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value FROM settings"
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;