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

  console.log("🔥 /api/games ROUTE ENTERED");

  const { game, cashierId, soldCartelas } = req.body;

  console.log("🔥 BODY RECEIVED");
  console.log("game:", game);
  console.log("cashierId:", cashierId);
  console.log("soldCartelas count:", soldCartelas?.length);

  const client = await pool.connect();

  try {
    console.log("🔥 ENTERED TRY");

    const cartelaIds = (soldCartelas || []).map((cartela) =>
      String(
        typeof cartela === "object"
          ? cartela.id
          : cartela
      )
    );

    console.log(
      "🔥 CARTELA IDS PREPARED:",
      cartelaIds.length
    );

    const houseCommission =
      (
        Number(game.bet) *
        Number(game.cardsSold) *
        Number(game.commission)
      ) / 100;

    console.log(
      "🔥 HOUSE COMMISSION CALCULATED:",
      houseCommission
    );

    // =====================================================
    // START TRANSACTION
    // =====================================================

    await client.query("BEGIN");

    console.log("🔥 TRANSACTION STARTED");

    // =====================================================
    // 1. DEDUCT HOUSE PACKAGE FIRST
    // =====================================================

    console.time("HOUSE UPDATE");

    const houseResult = await client.query(
      `
      UPDATE houses
      SET remaining_package =
          remaining_package - $1
      WHERE id = $2::integer
        AND remaining_package >= $1
      RETURNING id, remaining_package
      `,
      [
        Number(game.commissionDeducted),
        Number(game.house)
      ]
    );

    console.timeEnd("HOUSE UPDATE");

    if (houseResult.rows.length === 0) {
      throw new Error(
        "Not enough remaining package"
      );
    }

    console.log(
      "✅ HOUSE PACKAGE UPDATED:",
      houseResult.rows[0]
    );

    // =====================================================
    // 2. INSERT GAME
    // =====================================================

    console.time("GAME INSERT");

    const gameResult = await client.query(
      `
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
      RETURNING
        id,
        game_id,
        house_id,
        cashier_id,
        bet,
        prize,
        commission,
        cards_sold,
        house_commission,
        voice_mode,
        status
      `,
      [
        String(game.id),
        String(game.house),
        String(game.cashier),
        Number(game.bet),
        Number(game.prize),
        Number(game.commission),
        Number(game.cardsSold),
        Number(houseCommission),
        game.voiceMode || "recorded"
      ]
    );

    console.timeEnd("GAME INSERT");

    const savedGame = gameResult.rows[0];

    console.log(
      "✅ GAME INSERTED:",
      savedGame.game_id
    );

    // =====================================================
    // 3. INSERT SOLD CARTELAS
    // =====================================================

    if (cartelaIds.length > 0) {

      console.time("CARTELA INSERT");

      await client.query(
        `
        INSERT INTO sold_cartelas
        (
          game_id,
          cartela_id
        )
        SELECT
          $1,
          unnest($2::text[])
        `,
        [
          String(game.id),
          cartelaIds
        ]
      );

      console.timeEnd("CARTELA INSERT");

      console.log(
        "✅ CARTELAS INSERTED:",
        cartelaIds.length
      );
    }

    // =====================================================
    // COMMIT
    // =====================================================

    await client.query("COMMIT");

    console.log("✅ TRANSACTION COMMITTED");

    console.log(
      "✅ GAME SAVED:",
      savedGame.game_id
    );

    res.json({
      success: true,
      game: savedGame
    });

  } catch (err) {

    // =====================================================
    // ROLLBACK
    // =====================================================

    try {
      await client.query("ROLLBACK");
      console.log("↩️ TRANSACTION ROLLED BACK");
    } catch (rollbackErr) {
      console.error(
        "❌ ROLLBACK ERROR:",
        rollbackErr.message
      );
    }

    console.error(
      "❌ ERROR SAVING GAME:",
      err
    );

    res.status(500).json({
      success: false,
      error: err.message
    });

  } finally {

    client.release();

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
// GET ACTIVE GAME BY GAME ID (Lightweight)
// =======================
router.get("/active/:gameId", async (req, res) => {
  try {
    const { gameId } = req.params;

    console.log("🔥 ACTIVE GAME REQUEST:", gameId);

    // ✅ SAFE: Use SELECT * so we don't break on column name mismatches
    const result = await pool.query(
      `SELECT * FROM games WHERE game_id = $1 LIMIT 1`,
      [gameId]
    );

    if (result.rows.length === 0) {
      console.log("❌ GAME NOT FOUND:", gameId);
      return res.status(404).json({ error: "Game not found", gameId });
    }

    const game = result.rows[0];

    console.log("✅ EXACT GAME FOUND:", game.game_id);

    // ✅ STRIP heavy fields here (JavaScript side) — prevents sending cartela matrices
    delete game.sold_cartelas;   // snake_case version
    delete game.soldCartelas;    // camelCase version
    delete game.called_numbers;  // if this also grows large

    const calledResult = await pool.query(
      `SELECT ball FROM called_balls WHERE game_id = $1 ORDER BY id ASC`,
      [game.id]
    );

    const calledNumbers = calledResult.rows.map(row => row.ball);

    console.log("🎱 CALLED BALLS FOR:", game.game_id, calledNumbers);

    res.json({
      ...game,
      calledNumbers
    });

  } catch (err) {
    console.error("ACTIVE GAME ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/:gameId/call-number", async (req, res) => {
  const requestStart = performance.now();

  try {
    const { gameId } = req.params;
    const { ball } = req.body;

    if (!gameId || !ball) {
      return res.status(400).json({
        success: false,
        error: "gameId and ball are required"
      });
    }

    console.log("➡️ REQUEST: POST /call-number", {
      gameId,
      ball
    });

    // =========================================================
    // FIND GAME + INSERT BALL — ONE DATABASE QUERY
    // =========================================================

    const dbStart = performance.now();

    const result = await pool.query(
      `
      WITH target_game AS (
        SELECT id
        FROM games
        WHERE game_id = $1
        LIMIT 1
      ),

      inserted AS (
        INSERT INTO called_balls (game_id, ball)
        SELECT id, $2
        FROM target_game
        ON CONFLICT (game_id, ball)
        DO NOTHING
        RETURNING id, game_id, ball
      )

      SELECT
        target_game.id AS database_game_id,
        inserted.id AS called_ball_id,
        inserted.game_id,
        inserted.ball
      FROM target_game
      LEFT JOIN inserted ON true
      `,
      [gameId, ball]
    );

    const dbTime = performance.now() - dbStart;

    // =========================================================
    // GAME NOT FOUND
    // =========================================================

    if (result.rows.length === 0) {
      console.error("❌ GAME NOT FOUND:", gameId);

      return res.status(404).json({
        success: false,
        error: "Game not found",
        gameId
      });
    }

    const row = result.rows[0];

    // =========================================================
    // DUPLICATE BALL
    // =========================================================

    if (!row.called_ball_id) {
      console.log(
        `⚠️ DUPLICATE BALL: ${ball} | GAME: ${gameId}`
      );

      return res.json({
        success: true,
        duplicate: true,
        gameId,
        ball
      });
    }

    // =========================================================
    // DATABASE SUCCESS
    // =========================================================

    console.log(
      `✅ BALL SAVED: ${ball} | GAME: ${gameId} | DB: ${dbTime.toFixed(2)}ms`
    );

    // =========================================================
    // BROADCAST TO EVERY CLIENT IN THIS GAME
    // =========================================================

   io.to(`game:${gameId}`).emit("number-called", {
  gameId,
  ball: row.ball
});

    console.log(
      `📡 NUMBER BROADCAST: ${ball} | GAME: ${gameId}`
    );

    // =========================================================
    // RESPONSE TO CALLER
    // =========================================================

    const totalTime = (
      performance.now() - requestStart
    ).toFixed(2);

    console.log(
      `🚀 CALL-NUMBER COMPLETE: ${ball} | ${totalTime}ms`
    );

    return res.json({
      success: true,
      duplicate: false,
      gameId,
      ball: row.ball,
      calledBallId: row.called_ball_id
    });

  } catch (err) {

    console.error(
      "❌ CALL-NUMBER ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
router.post("/:gameId/verify-cartela", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { cartelaId } = req.body;

    console.log("=================================");
    console.log("VERIFY CARTELA");
    console.log("GAME ID:", gameId);
    console.log("CARTELA ID:", cartelaId);
    console.log("CARTELA ID TYPE:", typeof cartelaId);
    console.log("=================================");

    if (!gameId) {
      return res.status(400).json({
        sold: false,
        isWinner: false,
        error: "Game ID is required",
      });
    }

    if (
      cartelaId === undefined ||
      cartelaId === null ||
      String(cartelaId).trim() === ""
    ) {
      return res.status(400).json({
        sold: false,
        isWinner: false,
        error: "Cartela ID is required",
      });
    }

    // ============================================================
    // 1. FIND GAME
    // ============================================================

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
        sold: false,
        isWinner: false,
        error: "Game not found",
        gameId,
      });
    }

    const gameDbId = gameResult.rows[0].id;

    console.log("GAME STRING ID:", gameResult.rows[0].game_id);
    console.log("GAME DATABASE ID:", gameDbId);

    // ============================================================
    // 2. CHECK THAT CARTELA WAS SOLD IN THIS GAME
    // ============================================================

    const soldResult = await pool.query(
      `
      SELECT *
      FROM sold_cartelas
      WHERE game_id = $1
      AND cartela_id = $2
      `,
      [gameId, cartelaId]
    );

    console.log("SOLD ROWS:", soldResult.rows.length);

    if (soldResult.rows.length === 0) {
      console.log("❌ CARTELA WAS NOT SOLD IN THIS GAME");

      return res.json({
        sold: false,
        isWinner: false,
      });
    }

    console.log("✅ CARTELA IS SOLD");

    // ============================================================
    // 3. LOAD CARTELA
    // ============================================================

    const cartelaResult = await pool.query(
      `
      SELECT *
      FROM cartelas
      WHERE id = $1
      `,
      [cartelaId]
    );

    if (cartelaResult.rows.length === 0) {
      console.log("❌ CARTELA NOT FOUND:", cartelaId);

      return res.status(404).json({
        sold: true,
        isWinner: false,
        error: "Cartela not found",
      });
    }

    const cartela = cartelaResult.rows[0];

    console.log("CARTELA ID:", cartela.id);
    console.log("CARTELA SERIAL:", cartela.serial);

    // ============================================================
    // 4. READ PDF CARTELA FORMAT
    //
    // Database format:
    //
    // {
    //   B: [5 values],
    //   I: [5 values],
    //   N: [5 values],
    //   G: [5 values],
    //   O: [5 values]
    // }
    //
    // The center N[2] is ★ / FREE.
    // ============================================================

    const numbers =
      typeof cartela.numbers === "string"
        ? JSON.parse(cartela.numbers)
        : cartela.numbers;

    if (!numbers || typeof numbers !== "object") {
      return res.status(500).json({
        sold: true,
        isWinner: false,
        error: "Invalid cartela numbers format",
      });
    }

    const letters = ["B", "I", "N", "G", "O"];

    for (const letter of letters) {
      if (!Array.isArray(numbers[letter])) {
        return res.status(500).json({
          sold: true,
          isWinner: false,
          error: `Invalid cartela format: missing ${letter} column`,
        });
      }

      if (numbers[letter].length !== 5) {
        return res.status(500).json({
          sold: true,
          isWinner: false,
          error: `Invalid cartela format: ${letter} must contain 5 values`,
        });
      }
    }

    // ============================================================
    // 5. BUILD 5x5 BOARD FROM B/I/N/G/O COLUMNS
    // ============================================================

    const board = [];

    for (let row = 0; row < 5; row++) {
      const boardRow = [];

      for (let col = 0; col < 5; col++) {
        const letter = letters[col];
        const value = numbers[letter][row];

        // Center position is FREE
        if (row === 2 && col === 2) {
          boardRow.push("FREE");
        } else {
          boardRow.push(`${letter} ${value}`);
        }
      }

      board.push(boardRow);
    }

    console.log("=================================");
    console.log("CARTELA BOARD");
    console.log(JSON.stringify(board, null, 2));
    console.log("=================================");

    // ============================================================
    // 6. LOAD CALLED BALLS
    // ============================================================

    const calledResult = await pool.query(
      `
      SELECT ball
      FROM called_balls
      WHERE game_id = $1
      ORDER BY id ASC
      `,
      [gameDbId]
    );

    const calledBalls = calledResult.rows.map((row) => row.ball);

    const calledSet = new Set();

    for (const ball of calledBalls) {
      const number = parseInt(
        String(ball).trim().split(/\s+/).pop(),
        10
      );

      if (!Number.isNaN(number)) {
        calledSet.add(number);
      }
    }

    console.log("CALLED BALLS:", calledBalls);
    console.log(
      "CALLED NUMBERS:",
      Array.from(calledSet)
    );

    // ============================================================
    // 7. CHECK WHETHER A CELL IS MARKED
    // ============================================================

    function marked(cell) {
      if (cell === "FREE") {
        return true;
      }

      const cellNumber = parseInt(
        String(cell).trim().split(/\s+/).pop(),
        10
      );

      if (Number.isNaN(cellNumber)) {
        return false;
      }

      const result = calledSet.has(cellNumber);

      if (process.env.DEBUG_BINGO === "true") {
        console.log(
          `MARK CHECK | ${cell} | number=${cellNumber} | marked=${result}`
        );
      }

      return result;
    }

    // ============================================================
    // 8. HORIZONTAL LINES
    // ============================================================

    let horizontalWinner = false;

    for (let row = 0; row < 5; row++) {
      let complete = true;

      for (let col = 0; col < 5; col++) {
        if (!marked(board[row][col])) {
          complete = false;
          break;
        }
      }

      if (complete) {
        horizontalWinner = true;
        break;
      }
    }

    // ============================================================
    // 9. VERTICAL LINES
    // ============================================================

    let verticalWinner = false;

    for (let col = 0; col < 5; col++) {
      let complete = true;

      for (let row = 0; row < 5; row++) {
        if (!marked(board[row][col])) {
          complete = false;
          break;
        }
      }

      if (complete) {
        verticalWinner = true;
        break;
      }
    }

    // ============================================================
    // 10. DIAGONALS
    // ============================================================

    let diag1Winner = true;

    for (let i = 0; i < 5; i++) {
      if (!marked(board[i][i])) {
        diag1Winner = false;
        break;
      }
    }

    let diag2Winner = true;

    for (let i = 0; i < 5; i++) {
      if (!marked(board[i][4 - i])) {
        diag2Winner = false;
        break;
      }
    }

    const diagonalWinner =
      diag1Winner || diag2Winner;

    // ============================================================
    // 11. FOUR CORNERS
    // ============================================================

    const fourCornersWinner =
      marked(board[0][0]) &&
      marked(board[0][4]) &&
      marked(board[4][0]) &&
      marked(board[4][4]);

    // ============================================================
    // 12. FULL HOUSE
    // ============================================================

    let fullHouseWinner = true;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (!marked(board[row][col])) {
          fullHouseWinner = false;
          break;
        }
      }

      if (!fullHouseWinner) {
        break;
      }
    }

    // ============================================================
    // 13. FINAL WINNER
    // ============================================================

    const lineWinner =
      horizontalWinner ||
      verticalWinner ||
      diagonalWinner;

    const isWinner =
      lineWinner ||
      fourCornersWinner ||
      fullHouseWinner;

    // ============================================================
    // 14. LOG RESULT
    // ============================================================

    console.log("=================================");
    console.log("BINGO VERIFICATION RESULT");
    console.log("Cartela:", cartelaId);
    console.log("Horizontal:", horizontalWinner);
    console.log("Vertical:", verticalWinner);
    console.log("Diagonal:", diagonalWinner);
    console.log("Four Corners:", fourCornersWinner);
    console.log("Full House:", fullHouseWinner);
    console.log("FINAL WINNER:", isWinner);
    console.log("=================================");

    // ============================================================
    // 15. RESPONSE
    // ============================================================

    return res.json({
      sold: true,

      isWinner,

      isLine: lineWinner,

      isHorizontal: horizontalWinner,

      isVertical: verticalWinner,

      isDiagonal: diagonalWinner,

      isFourCorners: fourCornersWinner,

      isFullHouse: fullHouseWinner,

      cartela: {
        ...cartela,
        matrix: board,
      },
    });

  } catch (err) {
    console.error("❌ VERIFY CARTELA ERROR:", err);

    return res.status(500).json({
      sold: false,
      isWinner: false,
      error: err.message,
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