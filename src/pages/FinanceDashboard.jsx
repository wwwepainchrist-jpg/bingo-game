import { useState } from "react";
import { useParams } from "react-router-dom";

export default function FinanceDashboard() {
  const { id } = useParams();

  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [filter, setFilter] = useState("TODAY");

  // State to track if user wants to switch between Login and Create Account mode manually
  const existingPassword = localStorage.getItem("financePassword_" + id);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(!existingPassword);

  const history = JSON.parse(localStorage.getItem("gameHistory")) || [];

  const totalGames = history.length;
  const totalSold = history.reduce((sum, game) => sum + Number(game.sold || 0), 0);
  const totalBet = history.reduce((sum, game) => sum + (Number(game.bet || 0) * Number(game.sold || 0)), 0);
  const totalPrize = history.reduce((sum, game) => sum + Number(game.prize || 0), 0);
  const totalCommission = history.reduce((sum, game) => sum + Number(game.commissionAmount || 0), 0);
  const totalNet = history.reduce((sum, game) => sum + Number(game.netIncome || 0), 0);

  function unlockFinance() {
    const financePassword = localStorage.getItem("financePassword_" + id) || "1234";
    if (password === financePassword) {
      setAuthorized(true);
    } else {
      alert("Incorrect Password");
    }
  }

  function createInitialPassword() {
    if (!password.trim()) {
      alert("Please enter a password to setup your account.");
      return;
    }
    localStorage.setItem("financePassword_" + id, password);
    alert("Finance Password Created Successfully!");
    setAuthorized(true);
  }

  function changePassword() {
    if (!newPassword) {
      alert("Enter New Password");
      return;
    }

    localStorage.setItem("financePassword_" + id, newPassword);

    const notifications = JSON.parse(localStorage.getItem("adminNotifications")) || [];
    notifications.unshift({
      house: id,
      password: newPassword,
      changedBy: id,
      date: new Date().toLocaleString()
    });
    localStorage.setItem("adminNotifications", JSON.stringify(notifications));

    alert("Password Updated");
    setNewPassword("");
  }

  // --- THEME PALETTE (Blue-Black Lighten) ---
  const colors = {
    background: "linear-gradient(135deg, #0b0f19, #111827, #1e293b)", // Deep Black-Blue gradient
    cardBg: "rgba(30, 41, 59, 0.7)", // Lightened translucent slate-blue
    cardBorder: "rgba(56, 189, 248, 0.2)", // Sky blue tint outline
    textMain: "#f8fafc", // Crisp off-white
    textMuted: "#94a3b8", // Soft slate gray
    accentBlue: "#38bdf8", // Sky blue highlights
    accentCyan: "#2dd4bf", // Teal accents
    successGreen: "#10b981", // For green actions
  };

  if (!authorized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: colors.background,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}
      >
        <div
          style={{
            width: "450px",
            background: colors.cardBg,
            backdropFilter: "blur(24px)",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: "20px",
            padding: "40px",
            color: colors.textMain,
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.60)"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0284c7, #38bdf8)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "auto",
                fontSize: "40px",
                boxShadow: "0 0 20px rgba(56, 189, 248, 0.4)"
              }}
            >
              {isFirstTimeUser ? "🆕" : "🔒"}
            </div>

            <h1 style={{ marginTop: "20px", fontSize: "28px", fontWeight: "700", letterSpacing: "-0.5px" }}>
              {isFirstTimeUser ? "Setup Finance" : "Finance Login"}
            </h1>

            <p style={{ color: colors.textMuted, fontSize: "15px", marginTop: "5px" }}>
              {isFirstTimeUser 
                ? "Create a password to secure your analytics dashboard." 
                : "Enter your password to view reports."}
            </p>
          </div>

          <label style={{ fontWeight: "600", fontSize: "14px", color: colors.accentBlue, display: "block", marginBottom: "8px" }}>
            {isFirstTimeUser ? "Create Finance Password" : "Finance Password"}
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isFirstTimeUser ? "Choose a secure password" : "••••••••"}
            style={{
              width: "100%",
              padding: "15px",
              marginBottom: "25px",
              borderRadius: "12px",
              border: `1px solid rgba(255,255,255,0.1)`,
              background: "rgba(15, 23, 42, 0.6)",
              fontSize: "16px",
              boxSizing: "border-box",
              color: colors.textMain,
              outline: "none",
              transition: "border 0.2s"
            }}
          />

          {isFirstTimeUser ? (
            <button
              onClick={createInitialPassword}
              style={{
                width: "100%",
                padding: "15px",
                background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
                color: "#0f172a",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(56, 189, 248, 0.3)"
              }}
            >
              ✨ CREATE ACCOUNT
            </button>
          ) : (
            <button
              onClick={unlockFinance}
              style={{
                width: "100%",
                padding: "15px",
                background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(14, 165, 233, 0.3)"
              }}
            >
              🔓 LOGIN
            </button>
          )}

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <span 
              onClick={() => setIsFirstTimeUser(!isFirstTimeUser)} 
              style={{ 
                color: colors.accentBlue, 
                textDecoration: "none", 
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              {isFirstTimeUser ? "Already configured? Log In" : "First time user? Setup password"}
            </span>
          </div>

          <div style={{ marginTop: "25px", textAlign: "center", color: colors.textMuted, fontSize: "13px" }}>
            © finance dashboard
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxHeight: "100vh",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        padding: "35px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: colors.background,
        boxSizing: "border-box",
        color: colors.textMain
      }}
    >
      {/* Header Panel */}
      <div
        style={{
          background: colors.cardBg,
          backdropFilter: "blur(20px)",
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: "20px",
          padding: "30px",
          marginBottom: "30px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
        }}
      >
        <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "700", letterSpacing: "-0.5px", color: colors.accentBlue }}>
          💰 FINANCE DASHBOARD
        </h1>
        <p style={{ margin: "5px 0 0 0", color: colors.textMuted, fontSize: "15px" }}>
          Financial Reports & Revenue Analytics
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "25px" }}>
        {["TODAY", "WEEK", "MONTH", "YEAR", "ALL"].map(item => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            style={{
              background: filter === item ? "linear-gradient(135deg, #0ea5e9, #38bdf8)" : "rgba(30, 41, 59, 0.5)",
              color: filter === item ? "#0f172a" : colors.textMain,
              border: filter === item ? "none" : "1px solid rgba(255,255,255,0.1)",
              padding: "10px 24px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s"
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Analytics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "35px"
        }}
      >
        <FinanceCard title="Games Played" value={totalGames} color="linear-gradient(135deg, #1e293b, #334155)" border={colors.cardBorder} />
        <FinanceCard title="Cards Sold" value={totalSold} color="linear-gradient(135deg, #1e293b, #334155)" border={colors.cardBorder} />
        <FinanceCard title="Gross Income" value={totalBet + " ETB"} color="linear-gradient(135deg, #0f172a, #1e293b)" border="rgba(56,189,248,0.4)" labelColor={colors.accentBlue} />
        <FinanceCard title="Total Prize" value={totalPrize + " ETB"} color="linear-gradient(135deg, #1e293b, #334155)" border={colors.cardBorder} />
        <FinanceCard title="Commission" value={totalCommission.toFixed(2) + " ETB"} color="linear-gradient(135deg, #1e293b, #334155)" border={colors.cardBorder} />
        <FinanceCard title="Net Income" value={totalNet.toFixed(2) + " ETB"} color="linear-gradient(135deg, #0f172a, #192742)" border="rgba(45,212,191,0.4)" labelColor={colors.accentCyan} />
      </div>

      {/* Control Configuration (Password Update) */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.6)",
          padding: "25px",
          borderRadius: "16px",
          border: `1px solid rgba(255,255,255,0.08)`,
          marginBottom: "35px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
        }}
      >
        <h2 style={{ fontSize: "18px", marginTop: 0, marginBottom: "15px", fontWeight: "600", color: colors.accentBlue }}>
          🔒 Security Management
        </h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="password"
            value={newPassword}
            placeholder="Configure New Password"
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              padding: "12px 15px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(30, 41, 59, 0.8)",
              fontSize: "15px",
              color: colors.textMain,
              outline: "none",
              minWidth: "260px"
            }}
          />
          <button
            onClick={changePassword}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px"
            }}
          >
            Save Password
          </button>
        </div>
      </div>

      {/* Main Responsive Logs Table */}
      <div style={{ overflowX: "auto", width: "100%", borderRadius: "16px", boxShadow: "0 15px 40px rgba(0,0,0,0.4)", border: `1px solid ${colors.cardBorder}`, marginBottom: "50px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "rgba(22, 30, 49, 0.85)",
            color: colors.textMain,
            fontSize: "14px"
          }}
        >
          <thead style={{ background: "rgba(15, 23, 42, 0.95)", color: colors.accentBlue }}>
            <tr>
              <th style={{ padding: "16px", textAlign: "center" }}>Date</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Games</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Sold</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Bet</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Gross</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Prize</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Commission %</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Commission</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Net Income</th>
            </tr>
          </thead>
          <tbody>
            {history.map((game, index) => (
              <tr key={index} style={{ textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }}>
                <td style={{ padding: "14px", color: colors.textMuted }}>{game.finishedAt}</td>
                <td>1</td>
                <td style={{ fontWeight: "600" }}>{game.sold}</td>
                <td>{game.bet} ETB</td>
                <td>{(game.bet * game.sold).toFixed(2)} ETB</td>
                <td style={{ color: "#f43f5e" }}>{game.prize} ETB</td>
                <td>{game.commission}%</td>
                <td>{Number(game.commissionAmount).toFixed(2)} ETB</td>
                <td style={{ fontWeight: "700", color: colors.accentCyan }}>{Number(game.netIncome).toFixed(2)} ETB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinanceCard({ title, value, color, border, labelColor }) {
  return (
    <div
      style={{
        background: color,
        color: "white",
        borderRadius: "16px",
        padding: "25px",
        textAlign: "center",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        border: `1px solid ${border || "rgba(255,255,255,0.05)"}`
      }}
    >
      <h3 style={{ margin: 0, fontSize: "14px", color: "#94a3b8", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </h3>
      <h1 style={{ marginTop: "15px", marginBottom: 0, fontSize: "30px", fontWeight: "700", color: labelColor || "#f8fafc" }}>
        {value}
      </h1>
    </div>
  );
}