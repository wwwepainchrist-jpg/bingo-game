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
// ============================================================
// LOCAL TEST - REPLACE CARTELA PATTERNS 1-152
// ============================================================

const fs = require("fs");
const path = require("path");

router.post("/replace-152-patterns", async (req, res) => {
  const client = await pool.connect();

  try {
    console.log("=================================");
    console.log("STARTING 152 CARTELA REPLACEMENT");
    console.log("=================================");

    const filePath = path.join(
      __dirname,
      "..",
      "data",
      "cartela_patterns_1_to_152.json"
    );

    console.log("PATTERN FILE:", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "Pattern file not found",
        filePath,
      });
    }

    const patterns = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    const patternIds = Object.keys(patterns);

    console.log("PATTERNS FOUND:", patternIds.length);

    if (patternIds.length !== 152) {
      return res.status(400).json({
        success: false,
        error: `Expected 152 patterns but found ${patternIds.length}`,
      });
    }

    // Make sure every card 1-152 exists
    for (let id = 1; id <= 152; id++) {
      if (!patterns[String(id)]) {
        return res.status(400).json({
          success: false,
          error: `Missing pattern for Card #${id}`,
        });
      }
    }

    await client.query("BEGIN");

    let updated = 0;
    const missing = [];

    for (let id = 1; id <= 152; id++) {
      const pattern = patterns[String(id)];

      const columns = ["B", "I", "N", "G", "O"];

      for (const column of columns) {
        if (
          !Array.isArray(pattern[column]) ||
          pattern[column].length !== 5
        ) {
          throw new Error(
            `Card #${id} has invalid ${column} column`
          );
        }
      }

      const result = await client.query(
        `
        UPDATE cartelas
        SET numbers = $1
        WHERE id = $2
        `,
        [
          JSON.stringify(pattern),
          id,
        ]
      );

      if (result.rowCount === 0) {
        missing.push(id);
      } else {
        updated++;
      }
    }

    await client.query("COMMIT");

    console.log("=================================");
    console.log("REPLACEMENT FINISHED");
    console.log("UPDATED:", updated);
    console.log("MISSING:", missing);
    console.log("=================================");

    res.json({
      success: true,
      updated,
      missing,
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error("REPLACEMENT ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    client.release();
  }
});
module.exports = router;