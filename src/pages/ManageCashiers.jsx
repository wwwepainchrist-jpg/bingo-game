import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function ManageCashiers() {
  const { id } = useParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [editId, setEditId] = useState(null);

  const [cashiers, setCashiers] = useState([]);

  // Fetch cashiers belonging to this house from the backend PostgreSQL API
  const fetchCashiers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/cashiers/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setCashiers(data);
      }
    } catch (err) {
      console.error("Error fetching cashiers:", err);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, [id]);

  // Save or Update Cashier via PostgreSQL API
  async function saveCashier() {
    if (!username || !password) {
      alert("Enter username and password");
      return;
    }

    try {
      if (editId !== null) {
        // UPDATE EXISTING CASHIER
        const response = await fetch(`http://localhost:5000/api/cashiers/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: username,
            username,
            password,
            phone,
            role: "Cashier",
            house_id: id,
            branch: id,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          alert(data.error || "Failed to update cashier");
          return;
        }

        alert("Cashier Updated Successfully!");
      } else {
        // CREATE NEW CASHIER
        const response = await fetch("http://localhost:5000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: username,
            username,
            password,
            phone,
            role: "Cashier",
            house_id: id,
            branch: id,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          alert(data.error || "Failed to create cashier");
          return;
        }

        alert("Cashier Created Successfully!");
      }

      // Reset Form State & Refresh List
      setUsername("");
      setPassword("");
      setPhone("");
      setEditId(null);
      fetchCashiers();
    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  function editCashier(cashier) {
    const cashierId = cashier.id || cashier.user_id || cashier._id;
    setUsername(cashier.username || "");
    setPassword(cashier.password || "");
    setPhone(cashier.phone || "");
    setEditId(cashierId);
  }

  async function deleteCashier(cashierId) {
    if (!window.confirm("Are you sure you want to delete this cashier?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/cashiers/${cashierId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete cashier.");
        return;
      }

      alert("Cashier Deleted");
      fetchCashiers();
    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  // Modern UI Inline Styles - Midnight Dark Theme
  const colors = {
    background: "#0b0f19",
    cardBg: "rgba(30, 41, 59, 0.45)",
    cardBorder: "rgba(56, 189, 248, 0.15)",
    textMain: "#f8fafc",
    textMuted: "#94a3b8",
    accentBlue: "#0ea5e9",
    accentSky: "#38bdf8",
    accentCyan: "#2dd4bf",
    accentRed: "#f43f5e",
  };

  const styles = {
    container: {
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      color: colors.textMain,
      background: colors.background,
      padding: "30px",
      minHeight: "100vh",
      boxSizing: "border-box",
    },
    mainTitle: {
      color: colors.textMain,
      margin: "0 0 5px 0",
      fontSize: "28px",
      fontWeight: "700",
      textTransform: "uppercase",
    },
    subtitle: {
      color: colors.textMuted,
      margin: "0 0 20px 0",
      fontSize: "15px",
    },
    formBox: {
      backgroundColor: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      backdropFilter: "blur(16px)",
      padding: "24px",
      borderRadius: "16px",
      marginBottom: "30px",
      maxWidth: "500px",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "10px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      background: "rgba(15, 23, 42, 0.6)",
      color: "#fff",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
      marginBottom: "16px",
    },
    button: {
      padding: "12px 24px",
      background: `linear-gradient(135deg, ${colors.accentBlue}, #0284c7)`,
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      fontWeight: "600",
      fontSize: "14px",
      cursor: "pointer",
      boxShadow: "0 4px 15px rgba(14, 165, 233, 0.3)",
    },
    secondaryButton: {
      padding: "12px 20px",
      background: "rgba(255, 255, 255, 0.05)",
      color: colors.textMuted,
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "10px",
      fontWeight: "600",
      fontSize: "14px",
      cursor: "pointer",
    },
    tableWrapper: {
      overflowX: "auto",
      width: "100%",
      borderRadius: "16px",
      border: `1px solid ${colors.cardBorder}`,
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      backgroundColor: "rgba(22, 30, 49, 0.7)",
      color: colors.textMain,
    },
    th: {
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      color: colors.accentSky,
      textAlign: "left",
      padding: "16px 20px",
      fontWeight: "600",
      fontSize: "14px",
      borderBottom: `1px solid ${colors.cardBorder}`,
    },
    td: {
      padding: "14px 20px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
      color: colors.textMain,
      fontSize: "15px",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>Manage Cashiers</h1>
      <h3 style={styles.subtitle}>House Identifier: {id}</h3>

      {/* Form Section */}
      <div style={styles.formBox}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", color: colors.accentSky }}>
          {editId !== null ? "Edit Cashier Account" : "Create New Cashier"}
        </h2>

        <input
          style={styles.input}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          name="new-username"
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          name="new-password"
        />

        <input
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="off"
          name="new-phone"
        />

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button style={styles.button} onClick={saveCashier}>
            {editId !== null ? "Update Cashier" : "Create Cashier"}
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
              setUsername("");
              setPassword("");
              setPhone("");
              setEditId(null);
            }}
          >
            Clear Form
          </button>
        </div>
      </div>

      {/* Cashier List Table */}
      <h2 style={{ fontSize: "20px", color: colors.accentSky, marginBottom: "15px" }}>Cashier Roster</h2>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>House ID</th>
              <th style={styles.th}>Status</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cashiers.length > 0 ? (
              cashiers.map((cashier, index) => (
                <tr key={cashier.id || index} style={{ backgroundColor: index % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <td style={styles.td}><strong>{cashier.username}</strong></td>
                  <td style={{ ...styles.td, color: colors.textMuted }}>{cashier.phone || "N/A"}</td>
                  <td style={styles.td}>{cashier.house_id || cashier.house || id}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: "rgba(45,212,191,0.15)",
                        color: colors.accentCyan,
                      }}
                    >
                      {cashier.status || "Active"}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <button
                      onClick={() => editCashier(cashier)}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        color: colors.accentSky,
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        marginRight: "8px",
                        fontSize: "13px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCashier(cashier.id || cashier.user_id)}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: "rgba(244, 63, 94, 0.15)",
                        color: colors.accentRed,
                        border: "1px solid rgba(244, 63, 94, 0.3)",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ ...styles.td, textAlign: "center", color: colors.textMuted, padding: "30px" }}>
                  No cashiers found for this house.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}