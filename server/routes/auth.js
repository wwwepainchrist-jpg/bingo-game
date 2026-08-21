const express = require("express");

const router = express.Router();
const pool = require("../db");

// =======================
// REGISTER USER & HOUSE
// =======================
router.post("/register", async (req, res) => {
  try {
    const {
      full_name,
      username,
      password,
      role,
      house_id,
      branch,
      phone,
    } = req.body;
    
    console.log("Role received:", role);
    console.log("Full name:", full_name);

    const exists = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const parsedHouseId = house_id ? parseInt(house_id, 10) : null;
    const parsedBranch = branch ? parseInt(branch, 10) : null;

    const result = await pool.query(
      `INSERT INTO users
      (full_name, username, password, role, house_id, branch, phone, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')
      RETURNING *`,
      [
        full_name || null,
        username,
        password,
        role || "Cashier",
        isNaN(parsedHouseId) ? null : parsedHouseId,
        isNaN(parsedBranch) ? null : parsedBranch,
        phone || null,
      ]
    );

    if (role === "House Admin") {
      console.log("Creating house...");

      const houseResult = await pool.query(
        `INSERT INTO houses
        (
          house_name,
          owner_name,
          phone,
          address,
          status,
          remaining_package,
          total_package
        )
        VALUES ($1, $2, $3, $4, 'Active', 0, 0)
        RETURNING id`,
        [
          full_name,
          full_name,
          phone || "",
          branch || "",
        ]
      );

      const newHouseId = houseResult.rows[0].id;

      await pool.query(
        `UPDATE users
         SET house_id = $1
         WHERE id = $2`,
        [
          newHouseId,
          result.rows[0].id,
        ]
      );

      result.rows[0].house_id = newHouseId;

      console.log("House created successfully. House ID =", newHouseId);
    }
    
    res.json({
      success: true,
      user: result.rows[0],
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// =======================
// LOGIN USER
// =======================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1 AND password=$2",
      [username, password]
    );
    
    console.log(result.rows[0]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Wrong username or password",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// =======================
// GET ALL USERS
// =======================
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        full_name,
        username,
        password,
        role,
        branch,
        phone,
        status,
        created_at
      FROM users
      ORDER BY id ASC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});
// =======================
// DELETE USER
// =======================
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM users WHERE id = $1",
      [id]
    );

    res.json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// =======================
// UPDATE USER
// =======================
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      full_name,
      username,
      password,
      role,
      branch,
      house_id,
      phone,
      status,
    } = req.body;

    const parsedHouseId = house_id ? parseInt(house_id, 10) : null;
    const parsedBranch = branch ? parseInt(branch, 10) : null;

    const result = await pool.query(
      `UPDATE users
       SET
         full_name=$1,
         username=$2,
         password=$3,
         role=$4,
         branch=$5,
         house_id=$6,
         phone=$7,
         status=$8
       WHERE id=$9
       RETURNING *`,
      [
        full_name || null,
        username,
        password,
        role,
        isNaN(parsedBranch) ? null : parsedBranch,
        isNaN(parsedHouseId) ? null : parsedHouseId,
        phone || null,
        status || "Active",
        id,
      ]
    );

    res.json({
      success: true,
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// =======================
// GET ALL HOUSES
// =======================
router.get("/houses", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM houses ORDER BY id"
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
// CASHIER DASHBOARD (PLACED AT THE TOP OF PARAMETERIZED GETS)
// =======================
router.get("/cashier-dashboard/:id", async (req, res) => {
  try {
    const { id } = req.params;
const cashier = await pool.query(
  "SELECT * FROM users WHERE username = $1",
  [id]
);
   
    

    if (cashier.rows.length === 0) {
      return res.status(404).json({
        error: "Cashier not found"
      });
    }

    const packageResult = await pool.query(
      `SELECT total_package, remaining_package
       FROM houses
       WHERE id = $1`,
      [cashier.rows[0].house_id]
    );

    res.json({
      cashier: cashier.rows[0],
      packageInfo: packageResult.rows[0] || {},
      bet: 50,
      commission: 15,
      soldCartelas: [],
      voiceMode: "recorded"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

// =======================
// GET HOUSE PACKAGE INFO
// =======================
router.get("/houses/:id/package", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT total_package AS \"totalAmount\", remaining_package AS \"remainingAmount\" FROM houses WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "House not found" });
    }

    res.json({
      totalAmount: Number(result.rows[0].totalAmount || 0),
      remainingAmount: Number(result.rows[0].remainingAmount || 0),
    });

  } catch (err) {
    console.error("Get Package Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// RECHARGE HOUSE PACKAGE
// =======================
router.post("/houses/:id/package", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Enter a valid package amount." });
    }

    const houseCheck = await pool.query(
      "SELECT * FROM houses WHERE id = $1",
      [id]
    );

    if (houseCheck.rows.length === 0) {
      return res.status(404).json({ error: "No house found" });
    }

    const updatedHouse = await pool.query(
      `UPDATE houses 
       SET remaining_package = remaining_package + $1,
           total_package = total_package + $1
       WHERE id = $2
       RETURNING *`,
      [Number(amount), id]
    );

    res.json({
      success: true,
      remainingAmount: updatedHouse.rows[0].remaining_package,
      house: updatedHouse.rows[0],
    });

  } catch (err) {
    console.error("Package Recharge Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// =======================
// GET TIER PACKAGES
// =======================
router.get("/superadmin/tiers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT silver, gold, diamond FROM tier_packages LIMIT 1"
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// UPDATE TIER PACKAGES
// =======================
router.put("/superadmin/tiers", async (req, res) => {
  try {
    const { silver, gold, diamond } = req.body;

    await pool.query(
      `UPDATE tier_packages
       SET silver = $1,
           gold = $2,
           diamond = $3
       WHERE id = 1`,
      [silver, gold, diamond]
    );

    res.json({
      success: true,
      message: "Tier packages updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// PUT /api/change-password
router.put("/change-password", async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    // 1. Find the user in your database
    const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = userResult.rows.json ? userResult.rows[0] : userResult.rows[0];

    // 2. Verify current password matches (if you store plain text, or use bcrypt.compare if hashed)
    if (user.password !== currentPassword) {
      return res.status(400).json({ success: false, message: "Incorrect current password." });
    }

    // 3. Update to the new password
    await pool.query("UPDATE users SET password = $1 WHERE username = $2", [newPassword, username]);

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});
module.exports = router;