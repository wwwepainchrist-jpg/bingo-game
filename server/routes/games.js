const express = require("express");
const router = express.Router();
const pool = require("../db");

let io;

function setSocketIO(socketIO) {
  io = socketIO;
}
// =======================
// SAVE NEW GAME & SOLD CARTELAS
// =======================
// =======================
// SAVE NEW GAME & SOLD CARTELAS
// =======================
// =======================
// SAVE NEW GAME & SOLD CARTELAS
// =======================
router.post("/", async (req, res) => {
  console.time("TOTAL GAME SAVE");

  const { game, cashierId, soldCartelas } = req.body;

  try {
    // -----------------------
    // Prepare cartela IDs
    // -----------------------
    const cartelaIds = (soldCartelas || []).map((cartela) =>
      String(
        typeof cartela === "object"
          ? cartela.id
          : cartela
      )
    );

    // -----------------------
    // Calculate house commission
    // -----------------------
    const houseCommission =
      (Number(game.bet) *
        Number(game.cardsSold) *
        Number(game.commission)) /
      100;

    console.time("GAME SAVE QUERY");

    // -----------------------
    // ONE DATABASE QUERY
    // -----------------------
    const result = await pool.query(
      `
      WITH inserted_game AS (

        INSERT INTO games
        (
          game_id,
          house_id,
          cashier_id,
          bet,
          prize,
          commission,
          cards_sold,
          house_commission,
          voice_mode
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9
        )
        RETURNING *

      ),

      updated_house AS (

        UPDATE houses
        SET remaining_package =
            remaining_package - $10

        WHERE id = $2::integer
          AND remaining_package >= $10

        RETURNING remaining_package

      ),

      inserted_cartelas AS (

        INSERT INTO sold_cartelas
        (
          game_id,
          cartela_id
        )

        SELECT
          $1,
          unnest($11::text[])

        WHERE EXISTS (
          SELECT 1
          FROM updated_house
        )

      )

      SELECT *
      FROM inserted_game
      WHERE EXISTS (
        SELECT 1
        FROM updated_house
      );
      `,
      [
        String(game.id),                    // $1 game_id
        String(game.house),                 // $2 house_id
        String(game.cashier),               // $3 cashier_id
        Number(game.bet),                   // $4 bet
        Number(game.prize),                 // $5 prize
        Number(game.commission),             // $6 commission
        Number(game.cardsSold),              // $7 cards_sold
        Number(houseCommission),             // $8 house_commission
        game.voiceMode || "recorded",        // $9 voice_mode
        Number(game.commissionDeducted),     // $10 package deduction
        cartelaIds                           // $11 cartela IDs
      ]
    );

    console.timeEnd("GAME SAVE QUERY");

    // -----------------------
    // Check transaction result
    // -----------------------
    if (result.rows.length === 0) {
      throw new Error("Not enough remaining package");
    }

    console.log(
      "✅ GAME SAVED:",
      result.rows[0].game_id
    );

    // -----------------------
    // Send response
    // -----------------------
    res.json({
      success: true,
      game: result.rows[0]
    });

  } catch (err) {

    console.error(
      "❌ ERROR SAVING GAME:",
      err
    );

    res.status(500).json({
      success: false,
      error: err.message
    });

  } finally {

    console.timeEnd("TOTAL GAME SAVE");

  }
});
// =======================
// GET ALL GAMES
// =======================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM games ORDER BY game_date DESC"
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// =======================
// GET GAMES BY HOUSE
// =======================
router.get("/house/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM games
       WHERE house_id = $1
       ORDER BY game_date DESC`,
      [id]
    );
    console.log(result.rows);
    res.json(result.rows);

  } catch (err) {
    console.error("Error fetching house games:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// =======================
// GET ACTIVE GAME BY CASHIER
// =======================
router.get("/active/:gameId", async (req, res) => {
  try {
    const { gameId } = req.params;

    console.log("🔥 ACTIVE GAME REQUEST:", gameId);

    const result = await pool.query(
      `
      SELECT *
      FROM games
      WHERE game_id = $1
      LIMIT 1
      `,
      [gameId]
    );

    if (result.rows.length === 0) {
      console.log("❌ GAME NOT FOUND:", gameId);

      return res.status(404).json({
        error: "Game not found",
        gameId
      });
    }

    const game = result.rows[0];

    console.log("✅ EXACT GAME FOUND:", game.game_id);

    const calledResult = await pool.query(
      `
      SELECT ball
      FROM called_balls
      WHERE game_id = $1
      ORDER BY id ASC
      `,
    [game.id]
    );

    const calledNumbers = calledResult.rows.map(row => row.ball);

    console.log(
      "🎱 CALLED BALLS FOR:",
      game.game_id,
      calledNumbers
    );

    res.json({
      ...game,
      calledNumbers
    });

  } catch (err) {
    console.error("ACTIVE GAME ERROR:", err);

    res.status(500).json({
      error: err.message
    });
  }
});
router.post("/:gameId/call-number", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { ball } = req.body;

    console.log("BACKEND CALL NUMBER:", gameId);
    console.log("BACKEND BALL:", ball);

    // Find the database game ID
    const gameResult = await pool.query(
      `
      SELECT id
      FROM games
      WHERE game_id = $1
      `,
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        error: "Game not found",
        gameId
      });
    }

    const gameDbId = gameResult.rows[0].id;

    console.log("DATABASE GAME ID:", gameDbId);

    await pool.query(
      `
      INSERT INTO called_balls (game_id, ball)
      VALUES ($1, $2)
      ON CONFLICT (game_id, ball) DO NOTHING
      `,
      [gameDbId, ball]
    );

    // 🔥 SEND NEW BALL TO EVERY PLAYER IN THIS GAME
    if (io) {
      io.to(`game:${gameId}`).emit("number-called", {
        gameId,
        ball
      });

      console.log(
        "📡 SOCKET SENT:",
        `game:${gameId}`,
        ball
      );
    }

    res.json({
      success: true
    });

  } catch (err) {
    console.error("CALL NUMBER ERROR:", err);

    res.status(500).json({
      error: err.message
    });
  }
});
router.post("/:gameId/verify-cartela", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { cartelaId } = req.body;

    console.log("VERIFY GAME ID:", gameId);
    console.log("CARTELA ID:", cartelaId);
    console.log("CARTELA ID TYPE:", typeof cartelaId);

    // ============================
    // 1. FIND GAME DATABASE ID
    // ============================

    const gameResult = await pool.query(
      `
      SELECT id, game_id
      FROM games
      WHERE game_id = $1
      `,
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      console.log("❌ GAME NOT FOUND:", gameId);

      return res.status(404).json({
        error: "Game not found",
        gameId
      });
    }

    const gameDbId = gameResult.rows[0].id;

    console.log("GAME STRING ID:", gameResult.rows[0].game_id);
    console.log("GAME DATABASE ID:", gameDbId);
   // ============================
    // 2. CHECK IF CARTELA WAS SOLD
    // ============================

 const soldResult = await pool.query(
  `
  SELECT *
  FROM sold_cartelas
  WHERE game_id = $1
  AND cartela_id = $2
  `,
  [gameId, cartelaId]
);

    console.log("SOLD ROWS:", soldResult.rows);

    if (soldResult.rows.length === 0) {
      return res.json({
        sold: false,
        isWinner: false
      });
    }

    console.log("✅ CARTELA IS SOLD");

    // ============================
    // 2. LOAD CARTELA
    // ============================
    const cartelaResult = await pool.query(
      `
      SELECT *
      FROM cartelas
      WHERE id = $1
      `,
      [cartelaId]
    );

    if (cartelaResult.rows.length === 0) {
      return res.status(404).json({
        error: "Cartela not found"
      });
    }

    const cartela = cartelaResult.rows[0];
    console.log("Checking cartela:", cartelaId);
    console.log("Cartela from database:", cartela);

    // numbers is stored as JSON text
    const numbers =
      typeof cartela.numbers === "string"
        ? JSON.parse(cartela.numbers)
        : cartela.numbers;

    // ============================
    // 3. LOAD CALLED BALLS
    // ============================
  const calledResult = await pool.query(
  `
  SELECT ball
  FROM called_balls
  WHERE game_id = $1
  ORDER BY id ASC
  `,
  [gameDbId]
);

const calledBalls = calledResult.rows.map(r => r.ball);

const calledSet = new Set(
  calledBalls.map(ball =>
    parseInt(String(ball).trim().split(/\s+/).pop(), 10)
  )
);

console.log("DATABASE GAME ID FOR VERIFICATION:", gameDbId);
console.log("CALLED BALLS FOR VERIFICATION:", calledBalls);
    // ============================
    // 4. BUILD CARD MATRIX (FIXED)
    // ============================
    const matrixRows = numbers.rows || numbers; 

    const board = matrixRows.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === 2 && colIndex === 2) return "FREE";
        const letters = ["B", "I", "N", "G", "O"];
        return `${letters[colIndex]} ${cell}`;
      })
    );

    // ============================
    // 5. HELPER
    // ============================
 function marked(cell) {
  if (cell === "FREE") return true;

  const cellNumber = parseInt(
    String(cell).trim().split(/\s+/).pop(),
    10
  );

  if (Number.isNaN(cellNumber)) {
    return false;
  }

  const result = calledSet.has(cellNumber);

  console.log(
    `MARK CHECK | Cell: ${cell} | Number: ${cellNumber} | Marked: ${result}`
  );

  return result;
}
    // ============================
    // 6. CHECK HORIZONTAL LINES
    // ============================
    let horizontalWinner = false;

    for (let r = 0; r < 5; r++) {
      let complete = true;
      for (let c = 0; c < 5; c++) {
        if (!marked(board[r][c])) {
          complete = false;
          break;
        }
      }
      if (complete) {
        horizontalWinner = true;
        break;
      }
    }
   // ============================
    // 7. CHECK VERTICAL LINES
    // ============================
    let verticalWinner = false;

    for (let c = 0; c < 5; c++) {
      let complete = true;
      for (let r = 0; r < 5; r++) {
        if (!marked(board[r][c])) {
          complete = false;
          break;
        }
      }
      if (complete) {
        verticalWinner = true;
        break;
      }
    }

    // ============================
    // 8. CHECK DIAGONALS
    // ============================
    let diag1Winner = true;
    let diag2Winner = true;

    for (let i = 0; i < 5; i++) {
      if (!marked(board[i][i])) {
        diag1Winner = false;
        break;
      }
    }

    for (let i = 0; i < 5; i++) {
      if (!marked(board[i][4 - i])) {
        diag2Winner = false;
        break;
      }
    }

    const diagonalWinner = diag1Winner || diag2Winner;

    // ============================
    // 9. CHECK FOUR CORNERS
    // ============================
    const fourCornersWinner =
      marked(board[0][0]) &&
      marked(board[0][4]) &&
      marked(board[4][0]) &&
      marked(board[4][4]);

    // ============================
    // 10. CHECK FULL HOUSE
    // ============================
    let fullHouseWinner = true;

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!marked(board[r][c])) {
          fullHouseWinner = false;
          break;
        }
      }
      if (!fullHouseWinner) break;
    }

    const lineWinner =
      horizontalWinner ||
      verticalWinner ||
      diagonalWinner;

    console.log("=================================");
    console.log("Called Balls:", calledBalls);
    console.log("Board:", board);
    console.log("Horizontal Winner:", horizontalWinner);
    console.log("Vertical Winner:", verticalWinner);
    console.log("Diagonal Winner:", diagonalWinner);
    console.log("Four Corners Winner:", fourCornersWinner);
    console.log("Full House Winner:", fullHouseWinner);
    console.log("=================================");

    return res.json({
      sold: true,
      isWinner:
        lineWinner ||
        fourCornersWinner ||
        fullHouseWinner,
      isLine: lineWinner,
      isFourCorners: fourCornersWinner,
      isFullHouse: fullHouseWinner,
      cartela: {
        ...cartela,
        matrix: board
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

router.post("/:id/reset", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Reset requested for game:", id);

    const result = await pool.query(
      `
      DELETE FROM called_balls
      WHERE game_id = $1
      `,
      [id]
    );

    console.log("Deleted rows:", result.rowCount);

    res.json({
      success: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

// ==========================================================================
// MANUAL DELETE ROUTE FOR HOUSE PERIOD RECORDS (Daily, Weekly, Monthly, Yearly)
// ==========================================================================
router.delete("/house/:id/period", async (req, res) => {
  try {
    const { id } = req.params;
    const { period } = req.body;

    let deleteQuery;
    let queryParams = [id];

    if (period === "daily") {
      deleteQuery = `
        DELETE FROM games 
        WHERE house_id = $1::text 
        AND game_date::timestamp < NOW() - INTERVAL '24 hours'
      `;
    } else if (period === "weekly") {
      deleteQuery = `
        DELETE FROM games 
        WHERE house_id = $1::text 
        AND game_date::timestamp < NOW() - INTERVAL '7 days'
      `;
    } else if (period === "monthly") {
      deleteQuery = `
        DELETE FROM games 
        WHERE house_id = $1::text 
        AND game_date::timestamp < NOW() - INTERVAL '30 days'
      `;
    } else if (period === "yearly") {
      deleteQuery = `
        DELETE FROM games 
        WHERE house_id = $1::text 
        AND game_date::timestamp < NOW() - INTERVAL '365 days'
      `;
    } else {
      return res.status(400).json({ success: false, error: "Invalid period specified" });
    }

    const result = await pool.query(deleteQuery, queryParams);

    res.json({
      success: true,
      deletedCount: result.rowCount,
      message: `Successfully deleted ${period} records manually.`,
    });
  } catch (err) {
    console.error("Error deleting house records by period:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================
// GET DAILY PERFORMANCE REPORT FOR THE PAST YEAR
// ==========================================================================
router.get("/house/:id/yearly-daily-report", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        TO_CHAR(game_date::timestamp, 'YYYY-MM-DD') as report_date,
        COUNT(*) as games_played,
        SUM(cards_sold) as total_cartelas_sold,
        SUM(commission) as total_commission
      FROM games
      WHERE house_id = $1::text
      AND game_date::timestamp >= NOW() - INTERVAL '365 days'
      GROUP BY TO_CHAR(game_date::timestamp, 'YYYY-MM-DD')
      ORDER BY report_date DESC;
    `;

    const result = await pool.query(query, [id]);

    res.json({
      success: true,
      dailyReport: result.rows,
    });
  } catch (err) {
    console.error("Error fetching yearly daily report:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/house/:id/performance", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        COALESCE(SUM(CASE
          WHEN created_at::date = CURRENT_DATE
          THEN cards_sold ELSE 0
        END), 0) AS daily_cards,

        COALESCE(SUM(CASE
          WHEN created_at::date = CURRENT_DATE
          THEN house_commission ELSE 0
        END), 0) AS daily_commission,

        COUNT(CASE
          WHEN created_at::date = CURRENT_DATE THEN 1
        END) AS daily_games,

        COALESCE(SUM(CASE
          WHEN created_at >= CURRENT_DATE - INTERVAL '6 days'
          THEN cards_sold ELSE 0
        END), 0) AS weekly_cards,

        COALESCE(SUM(CASE
          WHEN created_at >= CURRENT_DATE - INTERVAL '6 days'
          THEN house_commission ELSE 0
        END), 0) AS weekly_commission,

        COUNT(CASE
          WHEN created_at >= CURRENT_DATE - INTERVAL '6 days' THEN 1
        END) AS weekly_games,

        COALESCE(SUM(CASE
          WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE)
          THEN cards_sold ELSE 0
        END), 0) AS monthly_cards,

        COALESCE(SUM(CASE
          WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE)
          THEN house_commission ELSE 0
        END), 0) AS monthly_commission,

        COUNT(CASE
          WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1
        END) AS monthly_games,

        COALESCE(SUM(CASE
          WHEN created_at >= DATE_TRUNC('year', CURRENT_DATE)
          THEN cards_sold ELSE 0
        END), 0) AS yearly_cards,

        COALESCE(SUM(CASE
          WHEN created_at >= DATE_TRUNC('year', CURRENT_DATE)
          THEN house_commission ELSE 0
        END), 0) AS yearly_commission,

        COUNT(CASE
          WHEN created_at >= DATE_TRUNC('year', CURRENT_DATE) THEN 1
        END) AS yearly_games

      FROM games
      WHERE house_id = $1::text;
    `;

    const result = await pool.query(query, [id]);

    res.json({
      success: true,
      performance: result.rows[0],
    });

  } catch (err) {
    console.error("Error fetching house performance:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
router.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_games,
        COALESCE(SUM(cards_sold), 0) AS total_cards,
        COALESCE(SUM(house_commission), 0) AS total_commission
      FROM games
    `);

    res.json({
      success: true,
      database: result.rows[0],
    });
  } catch (err) {
    console.error("TEST DB ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
module.exports = router;
module.exports.setSocketIO = setSocketIO;