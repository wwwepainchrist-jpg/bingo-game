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

router.post("/replace-200-patterns", async (req, res) => {
  const client = await pool.connect();

  try {
    console.log("=================================");
    console.log("STARTING 200 CARTELA REPLACEMENT");
    console.log("=================================");

    const filePath = path.join(
      __dirname,
      "..",
      "data",
      "cartela_patterns_1_to_200.json"
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

    // ============================================================
    // EXPECT EXACTLY 200 CARTELAS
    // ============================================================

    if (patternIds.length !== 200) {
      return res.status(400).json({
        success: false,
        error: `Expected 200 patterns but found ${patternIds.length}`,
      });
    }

    // ============================================================
    // MAKE SURE EVERY CARD 1-200 EXISTS IN JSON
    // ============================================================

    for (let id = 1; id <= 200; id++) {
      if (!patterns[String(id)]) {
        return res.status(400).json({
          success: false,
          error: `Missing pattern for Card #${id}`,
        });
      }
    }

    await client.query("BEGIN");

    let updated = 0;
    let inserted = 0;

    // ============================================================
    // UPDATE EXISTING / INSERT MISSING CARTELAS
    // ============================================================

    for (let id = 1; id <= 200; id++) {
      const pattern = patterns[String(id)];

      const columns = ["B", "I", "N", "G", "O"];

      // ----------------------------------------------------------
      // Validate pattern
      // ----------------------------------------------------------

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

      const numbers = JSON.stringify(pattern);

      // ----------------------------------------------------------
      // Check whether cartela already exists
      // ----------------------------------------------------------

      const existing = await client.query(
        `
        SELECT id, serial, status
        FROM cartelas
        WHERE id = $1
        `,
        [id]
      );

      if (existing.rows.length > 0) {
        // ========================================================
        // EXISTING CARTELA → UPDATE ONLY NUMBERS
        // ========================================================

        await client.query(
          `
          UPDATE cartelas
          SET numbers = $1
          WHERE id = $2
          `,
          [numbers, id]
        );

        updated++;

      } else {
        // ========================================================
        // MISSING CARTELA → CREATE IT
        // ========================================================

        const serial =
          `C${id}-${Math.floor(
            100000 + Math.random() * 900000
          )}`;

        await client.query(
          `
          INSERT INTO cartelas
            (id, serial, numbers, status)
          VALUES
            ($1, $2, $3, $4)
          `,
          [
            id,
            serial,
            numbers,
            "available",
          ]
        );

        inserted++;

        console.log(
          `✅ INSERTED CARTELA ${id} → ${serial}`
        );
      }
    }

    await client.query("COMMIT");

    console.log("=================================");
    console.log("REPLACEMENT FINISHED");
    console.log("UPDATED:", updated);
    console.log("INSERTED:", inserted);
    console.log("=================================");

    res.json({
      success: true,
      total: 200,
      updated,
      inserted,
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error(
      "REPLACEMENT ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    client.release();
  }
});
module.exports = router;