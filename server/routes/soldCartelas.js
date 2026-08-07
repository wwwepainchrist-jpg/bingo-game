const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/", async (req, res) => {
  try {
    const gameId = req.body.gameId || req.body.game_id;
    const { soldCartelas } = req.body;

    console.log("--- DEBUG SOLD CARTELAS ---");
    console.log("Extracted gameId:", gameId);
    console.log("Sold Cartelas Array:", soldCartelas);

    if (!gameId) {
      return res.status(400).json({ success: false, error: "gameId is missing in request body!" });
    }

    for (const cartela of soldCartelas) {
      const cartelaId = typeof cartela === "object" ? cartela.id : cartela;

      console.log("INSERTING into database -> game_id:", gameId, "cartela_id:", cartelaId);

      await pool.query(
        `INSERT INTO sold_cartelas (game_id, cartela_id)
         VALUES ($1, $2)`,
        [gameId, String(cartelaId)]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error inserting sold cartelas:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
module.exports = router;