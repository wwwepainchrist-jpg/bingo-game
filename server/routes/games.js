const express = require("express");
const router = express.Router();
const pool = require("../db");

// =======================
// SAVE NEW GAME & SOLD CARTELAS
// =======================
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { game, cashierId, soldCartelas } = req.body;
    console.log("Received game:", game);

    // 1. Insert Game
    const gameResult = await client.query(
      `INSERT INTO games
      (
        game_id,
        house_id,
        cashier_id,
        bet,
        prize,
        commission,
        cards_sold,
        voice_mode
      )
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        game.id,
        game.house,
        game.cashier,
        game.bet,
        game.prize,
        game.commission,
        game.cardsSold,
        game.voiceMode,
      ]
    );

    // 2. Deduct House Package
    await client.query(
      `UPDATE houses
       SET remaining_package = remaining_package - $1
       WHERE id = $2`,
      [game.commissionDeducted, game.house]
    );

    // 3. Insert Sold Cartelas securely within the same transaction
    if (soldCartelas && soldCartelas.length > 0) {
      for (const cartela of soldCartelas) {
        const cartelaId = typeof cartela === 'object' ? cartela.id : cartela;
        await client.query(
          `INSERT INTO sold_cartelas (game_id, cashier_id, cartela_id)
           VALUES ($1, $2, $3)`,
          [game.id, cashierId || game.cashier, cartelaId]
        );
      }
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      game: gameResult.rows[0],
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error saving game and cartelas:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    client.release();
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
// =======================
// GET ACTIVE GAME + CALLED NUMBERS
// =======================
router.get("/active/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Your existing frontend passes the cashier ID here.
    const gameResult = await pool.query(
      `
      SELECT *
      FROM games
      WHERE cashier_id = $1
      ORDER BY id DESC
      LIMIT 1
      `,
      [id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        error: "No active game found"
      });
    }

    const game = gameResult.rows[0];

    // Get all numbers already called for this game.
    const calledResult = await pool.query(
      `
      SELECT ball
      FROM called_balls
      WHERE game_id = $1
      ORDER BY id ASC
      `,
      [game.game_id]
    );

    const calledNumbers = calledResult.rows.map(row => row.ball);

    res.json({
      ...game,
      calledNumbers
    });

  } catch (err) {
    console.error("Error fetching active game:", err);

    res.status(500).json({
      error: err.message
    });
  }
});


// =======================
// CALL NEW BINGO NUMBER
// =======================
router.post("/:gameId/call-number", async (req, res) => {
  const client = await pool.connect();

  try {
    const { gameId } = req.params;
    const { ball } = req.body;

    if (!gameId || !ball) {
      return res.status(400).json({
        success: false,
        error: "gameId and ball are required"
      });
    }

    await client.query("BEGIN");

    /*
     * Lock this game's called-ball rows while we check.
     *
     * This prevents two browsers from successfully inserting
     * the exact same ball at the same time.
     */
    const existingResult = await client.query(
      `
      SELECT id, ball
      FROM called_balls
      WHERE game_id = $1
      ORDER BY id ASC
      FOR UPDATE
      `,
      [gameId]
    );

    const existingBalls = existingResult.rows.map(row => row.ball);

    // Never allow the same Bingo ball twice.
    if (existingBalls.includes(ball)) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        duplicate: true,
        error: "This Bingo number has already been called",
        ball,
        calledNumbers: existingBalls
      });
    }

    /*
     * Validate the Bingo ball format.
     */
    const match = /^([BINGO])\s+(\d+)$/.exec(ball.trim());

    if (!match) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        error: "Invalid Bingo ball format"
      });
    }

    const letter = match[1];
    const number = parseInt(match[2], 10);

    /*
     * Validate BINGO ranges.
     */
    const validRange =
      (letter === "B" && number >= 1 && number <= 15) ||
      (letter === "I" && number >= 16 && number <= 30) ||
      (letter === "N" && number >= 31 && number <= 45) ||
      (letter === "G" && number >= 46 && number <= 60) ||
      (letter === "O" && number >= 61 && number <= 75);

    if (!validRange) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        error: `Invalid Bingo number for ${letter}`
      });
    }

    /*
     * Insert the new number.
     */
    const insertResult = await client.query(
      `
      INSERT INTO called_balls (game_id, ball)
      VALUES ($1, $2)
      RETURNING id, ball
      `,
      [gameId, ball.trim()]
    );

    const newCalledNumbers = [
      ...existingBalls,
      insertResult.rows[0].ball
    ];

    await client.query("COMMIT");

    console.log(
      `CALL NUMBER | Game: ${gameId} | Ball: ${ball}`
    );

    res.json({
      success: true,
      duplicate: false,
      ball: insertResult.rows[0].ball,
      calledNumbers: newCalledNumbers
    });

  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    console.error("Error calling Bingo number:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  } finally {
    client.release();
  }
});

router.post("/:gameId/call-number", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { ball } = req.body;
    console.log("CALL NUMBER");
    console.log("Game ID:", gameId);
    console.log("Ball:", ball);
    
    await pool.query(
      `
      INSERT INTO called_balls (game_id, ball)
      VALUES ($1, $2)
      `,
      [gameId, ball]
    );

    res.json({
      success: true,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

router.post("/:gameId/verify-cartela", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { cartelaId } = req.body;
    console.log("Game ID:", gameId);
    console.log("Cartela ID:", cartelaId);
    console.log("Cartela ID type =", typeof cartelaId);   

    // ============================
    // 1. CHECK IF CARTELA WAS SOLD
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
    console.log("Sold rows:", soldResult.rows);
    if (soldResult.rows.length === 0) {
      return res.json({
        sold: false,
        isWinner: false
      });
    }

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
      `,
      [gameId]
    );

    const calledBalls = calledResult.rows.map(r => r.ball);
    const calledSet = new Set(calledBalls);

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

      const result = [...calledSet].some(ball => ball.trim() === cell.trim());

      console.log(
        "Checking:",
        cell,
        "Called:",
        [...calledSet],
        "Result:",
        result
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
        COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE THEN cards_sold ELSE 0 END), 0) AS daily_cards,
        COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE THEN (prize * commission / 100) ELSE 0 END), 0) AS daily_commission,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) AS daily_games,

        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN cards_sold ELSE 0 END), 0) AS weekly_cards,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN (prize * commission / 100) ELSE 0 END), 0) AS weekly_commission,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) AS weekly_games,

        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN cards_sold ELSE 0 END), 0) AS monthly_cards,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN (prize * commission / 100) ELSE 0 END), 0) AS monthly_commission,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS monthly_games,

        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '365 days' THEN cards_sold ELSE 0 END), 0) AS yearly_cards,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '365 days' THEN (prize * commission / 100) ELSE 0 END), 0) AS yearly_commission,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '365 days' THEN 1 END) AS yearly_games

      FROM games
      WHERE house_id = $1::text;
    `;

    const result = await pool.query(query, [id]);

    res.json({
      success: true,
      performance: result.rows[0]
    });

  } catch (err) {
    console.error("Error fetching house performance summary:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;