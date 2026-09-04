const express = require("express");
const router = express.Router();
const pool = require("../db");

// Create table automatically if it doesn't exist
router.put("/", async (req, res) => {
  try {
    const { key, value } = req.body;

    console.log("💾 SETTINGS PUT RECEIVED:", {
      key,
      value,
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    const result = await pool.query(
      `
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value
      RETURNING key, value
      `,
      [key, String(value)]
    );

    console.log(
      "✅ SETTINGS SAVED TO DATABASE:",
      result.rows[0]
    );

    res.json({
      success: true,
      setting: result.rows[0],
    });

  } catch (err) {
    console.error("❌ SETTINGS PUT ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
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
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;

    console.log("🔎 SETTINGS GET REQUEST:", key);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    const result = await pool.query(
      "SELECT key, value FROM settings WHERE key = $1",
      [key]
    );

    console.log(
      "🔎 SETTINGS DATABASE RESULT:",
      result.rows
    );

    if (result.rows.length === 0) {
      console.log(
        "❌ SETTING NOT FOUND:",
        key
      );

      return res.status(404).json({
        error: "Setting not found",
        key,
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(
      "❌ ERROR FETCHING SETTING:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});
module.exports = router;