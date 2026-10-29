const express = require("express");
const router = express.Router();
const pool = require("../db");
const crypto = require("crypto");
function hashNetPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return `${salt}:${hash}`;
}

function verifyNetPassword(password, storedHash) {
  if (!password || !storedHash) return false;

  const parts = String(storedHash).split(":");

  if (parts.length !== 2) {
    return false;
  }

  const [salt, storedKey] = parts;

  const derivedKey = crypto.scryptSync(
    password,
    salt,
    64
  );

  const storedKeyBuffer = Buffer.from(
    storedKey,
    "hex"
  );

  if (
    derivedKey.length !==
    storedKeyBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    derivedKey,
    storedKeyBuffer
  );
}

// ============================================================
// CASHIER NET PASSWORD STATUS
// ============================================================

router.get(
  "/cashier-net-password/status/:id",
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        SELECT net_password_hash
        FROM users
        WHERE username = $1
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Cashier not found",
        });
      }

      res.json({
        success: true,
        hasPassword:
          !!result.rows[0].net_password_hash,
      });

    } catch (error) {
      console.error(
        "NET PASSWORD STATUS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// ============================================================
// CREATE CASHIER NET PASSWORD
// ============================================================

router.post(
  "/cashier-net-password/create",
  async (req, res) => {
    try {
      const {
        cashierId,
        password,
        confirmPassword,
      } = req.body;

      if (!cashierId || !password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "All fields are required",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "Passwords do not match",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters",
        });
      }

      const existing = await pool.query(
        `
        SELECT net_password_hash
        FROM users
        WHERE username = $1
        `,
        [cashierId]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Cashier not found",
        });
      }

      if (existing.rows[0].net_password_hash) {
        return res.status(400).json({
          success: false,
          error: "Password already exists",
        });
      }

      const passwordHash =
        hashNetPassword(password);

      await pool.query(
        `
        UPDATE users
        SET net_password_hash = $1
        WHERE username = $2
        `,
        [
          passwordHash,
          cashierId,
        ]
      );

      res.json({
        success: true,
        message: "NET password created",
      });

    } catch (error) {
      console.error(
        "CREATE NET PASSWORD ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// ============================================================
// LOGIN TO CASHIER NET
// ============================================================

router.post(
  "/cashier-net-password/login",
  async (req, res) => {
    try {
      const {
        cashierId,
        password,
      } = req.body;

      const result = await pool.query(
        `
        SELECT net_password_hash
        FROM users
        WHERE username = $1
        `,
        [cashierId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Cashier not found",
        });
      }

      const storedHash =
        result.rows[0].net_password_hash;

      if (!storedHash) {
        return res.status(400).json({
          success: false,
          error: "NET password has not been created",
        });
      }

      const valid =
        verifyNetPassword(
          password,
          storedHash
        );

      if (!valid) {
        return res.status(401).json({
          success: false,
          error: "Incorrect password",
        });
      }

      res.json({
        success: true,
      });

    } catch (error) {
      console.error(
        "NET LOGIN ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// ============================================================
// CHANGE CASHIER NET PASSWORD
// ============================================================

router.post(
  "/cashier-net-password/change",
  async (req, res) => {
    try {
      const {
        cashierId,
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body;

      if (
        !cashierId ||
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          error: "All fields are required",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: "New passwords do not match",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters",
        });
      }

      const result = await pool.query(
        `
        SELECT net_password_hash
        FROM users
        WHERE username = $1
        `,
        [cashierId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Cashier not found",
        });
      }

      const storedHash =
        result.rows[0].net_password_hash;

      if (
        !verifyNetPassword(
          currentPassword,
          storedHash
        )
      ) {
        return res.status(401).json({
          success: false,
          error: "Current password is incorrect",
        });
      }

      const newHash =
        hashNetPassword(newPassword);

      await pool.query(
        `
        UPDATE users
        SET net_password_hash = $1
        WHERE username = $2
        `,
        [
          newHash,
          cashierId,
        ]
      );

      res.json({
        success: true,
        message: "NET password changed",
      });

    } catch (error) {
      console.error(
        "CHANGE NET PASSWORD ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
);

// GET cashiers by House ID
router.get("/:houseId", async (req, res) => {
  try {
    const { houseId } = req.params;

   const result = await pool.query(
  `SELECT
      id,
      username,
      password,
      full_name,
      phone,
      role,
      house_id,
      created_at,
      branch,
      COALESCE(status, 'Active') AS status
   FROM users
   WHERE house_id = $1
   AND role = 'Cashier'`,
  [houseId]
);
    res.json(result.rows);

  } catch (err) {
    console.error("Error fetching cashiers:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE CASHIER (PUT /api/cashiers/:id)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, phone, house_id, branch, status, full_name } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET username = COALESCE(NULLIF($1, ''), username),
           password = COALESCE(NULLIF($2, ''), password),
           phone = COALESCE(NULLIF($3, ''), phone),
           house_id = COALESCE($4, house_id),
           branch = COALESCE($5, branch),
           status = COALESCE(NULLIF($6, ''), status),
           full_name = COALESCE(NULLIF($7, ''), full_name)
       WHERE id = $8 
       RETURNING *`,
      [username, password, phone, house_id, branch, status, full_name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Cashier not found in database" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Error updating cashier:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE CASHIER (DELETE /api/cashiers/:id)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Cashier not found" });
    }

    res.json({ success: true, message: "Cashier deleted successfully" });
  } catch (err) {
    console.error("Error deleting cashier:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;