const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function fixCartelas() {
  const filePath = path.join(
    __dirname,
    "data",
    "cartela_patterns_1_to_152.json"
  );

  const patterns = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (let id = 151; id <= 200; id++) {
      const pattern = patterns[String(id)];

      if (!pattern) {
        throw new Error(`Missing pattern for cartela ${id}`);
      }

      // Check if it already exists
      const existing = await client.query(
        "SELECT id, serial FROM cartelas WHERE id = $1",
        [id]
      );

      if (existing.rows.length > 0) {
        console.log(
          `⚠️ CARTELA ${id} ALREADY EXISTS: ${existing.rows[0].serial}`
        );
        continue;
      }

      const serial =
        `C${String(id).padStart(3, "0")}-${Math.floor(
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
          JSON.stringify(pattern),
          "available",
        ]
      );

      console.log(
        `✅ INSERTED CARTELA ${id}: ${serial}`
      );
    }

    await client.query("COMMIT");

    console.log("");
    console.log("=================================");
    console.log("✅ CARTELAS 151-200 FIXED");
    console.log("=================================");

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("❌ ERROR:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCartelas();
