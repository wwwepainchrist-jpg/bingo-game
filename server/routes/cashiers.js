const express = require("express");
const router = express.Router();
const pool = require("../db");

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