import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

export default function HouseDashboard() {
  const { id } = useParams(); // Identifier passed in the URL (e.g., house id or username)
  console.log("House Dashboard ID:", id);
  
  // State handles for inline cashier creation
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  console.log("CURRENT FORM:", username, password, phone);

  // Show More state for detailed game logs
  const [visibleGameLogsCount, setVisibleGameLogsCount] = useState(5);

  // Selected period tab state ('daily' | 'weekly' | 'monthly' | 'yearly')
  const [selectedPeriod, setSelectedPeriod] = useState("daily");

  // Reactive state holders connected to backend / database
  const [houseGames, setHouseGames] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [currentHouseUser, setCurrentHouseUser] = useState({ username: id, id: id, name: id });
  const [packageInfo, setPackageInfo] = useState({ totalAmount: 0, remainingAmount: 0 });
  const [editingCashierId, setEditingCashierId] = useState(null);
  
  // Periodic stats state fetched directly from the backend API
  const [periodicStats, setPeriodicStats] = useState({
    daily: { cards: 0, commission: 0, games: 0 },
    weekly: { cards: 0, commission: 0, games: 0 },
    monthly: { cards: 0, commission: 0, games: 0 },
    yearly: { cards: 0, commission: 0, games: 0 },
  });
  
  // Tier package counts managed by Super Admin
  const [tierPackages, setTierPackages] = useState({
    silver: 0,
    gold: 0,
    diamond: 0,
  });

  // Load and synchronize data dynamically from PostgreSQL Backend API
  const refreshDashboardData = async () => {
    try {
      // 1. Fetch house profile and details
      const houseRes = await fetch(`https://bingo-backend-ccn6.onrender.com/api/houses/${id}`);
      if (houseRes.ok) {
        const houseData = await houseRes.json();
        setCurrentHouseUser(houseData);
      }

      // 2. Fetch cashiers belonging to this house
      const cashiersRes = await fetch(`https://bingo-backend-ccn6.onrender.com/api/cashiers/${id}`);
      if (cashiersRes.ok) {
        const cashiersData = await cashiersRes.json();
        if (Array.isArray(cashiersData)) setCashiers(cashiersData);
      }

      // 3. Fetch games related to this house
      const gamesRes = await fetch(`https://bingo-backend-ccn6.onrender.com/api/games/house/${id}`);
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        if (Array.isArray(gamesData)) setHouseGames(gamesData);
      }

      // 4. Fetch house package information (Robustly parses both naming conventions)
      const packageRes = await fetch(`https://bingo-backend-ccn6.onrender.com/api/houses/${id}/package`);
      if (packageRes.ok) {
        const pkgData = await packageRes.json();
        console.log("Package Data:", pkgData);
        setPackageInfo({
          totalAmount: Number(pkgData.total_package ?? pkgData.totalAmount ?? 0),
          remainingAmount: Number(pkgData.remaining_package ?? pkgData.remainingAmount ?? 0),
        });
      }

      // 5. Fetch Super Admin tier packages config
      const tiersRes = await fetch(`https://bingo-backend-ccn6.onrender.com/api/superadmin/tiers`);
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTierPackages({
          silver: tiersData.silver,
          gold: tiersData.gold,
          diamond: tiersData.diamond,
        });
      }
    } catch (err) {
      console.error("Error fetching dashboard data from server:", err);
    }
  };

  useEffect(() => {
    refreshDashboardData();

    // Listen for window focus to resync data
    window.addEventListener("focus", refreshDashboardData);
    return () => {
      window.removeEventListener("focus", refreshDashboardData);
    };
  }, [id]);

  // ==========================================================================
  // FETCH PERIODIC STATS FROM BACKEND PERFORMANCE API
  // ==========================================================================
  useEffect(() => {
    async function loadPerformance() {
      try {
        const response = await fetch(`https://bingo-backend-ccn6.onrender.com/api/games/house/${id}/performance`);
        const data = await response.json();

        if (data.success && data.performance) {
          setPeriodicStats({
            daily: {
              cards: Number(data.performance.daily_cards || 0),
              commission: Number(data.performance.daily_commission || 0),
              games: Number(data.performance.daily_games || 0),
            },
            weekly: {
              cards: Number(data.performance.weekly_cards || 0),
              commission: Number(data.performance.weekly_commission || 0),
              games: Number(data.performance.weekly_games || 0),
            },
            monthly: {
              cards: Number(data.performance.monthly_cards || 0),
              commission: Number(data.performance.monthly_commission || 0),
              games: Number(data.performance.monthly_games || 0),
            },
            yearly: {
              cards: Number(data.performance.yearly_cards || 0),
              commission: Number(data.performance.yearly_commission || 0),
              games: Number(data.performance.yearly_games || 0),
            },
          });
        }
      } catch (err) {
        console.error("Failed to load performance stats:", err);
      }
    }

    if (id) {
      loadPerformance();
    }
  }, [id, houseGames]);

  // SORT GAMES: From Current/Newest Date & Time to Oldest
  const sortedHouseGames = [...houseGames].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  // ==========================================================================
  // ISOLATED DELETE FUNCTION FOR THE SELECTED PERIOD ONLY (VIA BACKEND)
  // ==========================================================================
  const handleDeletePeriodData = async () => {
    let label = "Daily (Past 24 Hours)";
    let minDays = 0;
    let maxDays = 1;

    if (selectedPeriod === "weekly") {
      label = "Weekly (Days 2 to 7)";
      minDays = 1;
      maxDays = 7;
    } else if (selectedPeriod === "monthly") {
      label = "Monthly (Days 8 to 30)";
      minDays = 7;
      maxDays = 30;
    } else if (selectedPeriod === "yearly") {
      label = "Yearly (Days 31 to 365)";
      minDays = 30;
      maxDays = 365;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ONLY the ${label} game records from the database? This will preserve your other performance periods.`
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`https://bingo-backend-ccn6.onrender.com/api/games/house/${id}/period`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: selectedPeriod, minDays, maxDays }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to delete period records");
        return;
      }

      refreshDashboardData();
      alert(`Successfully deleted ${label} records from database!`);
    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  };

  // ==========================================================================
  // XY GRAPH LOGIC: DAILY PERFORMANCE AGGREGATION
  // ==========================================================================
  const dailyGraphData = houseGames.reduce((acc, game) => {
    const dateKey = game.date ? new Date(game.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    
    const cartelasCount = Number(game.cards_sold ?? game.cardsSold ?? game.soldCartelas?.length ?? 0);
    const betAmount = Number(game.bet) || 50;
    const grossPool = betAmount * cartelasCount;
    const commissionRate = Number(game.commission) || 15;
    const calculatedCommission = grossPool * (commissionRate / 100);

    if (!acc[dateKey]) {
      acc[dateKey] = { date: dateKey, totalCardsSold: 0, totalCommission: 0, totalRoundsPlayed: 0 };
    }

    acc[dateKey].totalCardsSold += cartelasCount;
    acc[dateKey].totalCommission += calculatedCommission;
    acc[dateKey].totalRoundsPlayed += 1;

    return acc;
  }, {});

  // Chronological order for XY Graph plot (Old to New)
  const sortedDailyGraph = Object.values(dailyGraphData).sort((a, b) => new Date(a.date) - new Date(b.date));

  function editCashier(cashier) {
    const cashierUsername = cashier.username || cashier.name || cashier.cashier_name || "";
    const cashierPhone = cashier.phone || cashier.telephone || cashier.mobile || "";

    console.log("Before:", username, password, phone);

    setEditingCashierId(cashier.id);
    setUsername(cashierUsername);
    setPassword(""); // keep password empty for safety
    setPhone(cashierPhone);

    setTimeout(() => {
      console.log("After click:", cashierUsername, cashierPhone);
    }, 100);
  }

  async function handleCreateCashier(e) {
    e.preventDefault();

    if (!username || !password) {
      alert("Please fill in the required fields.");
      return;
    }

    try {
      let response;

      if (editingCashierId) {
        // UPDATE CASHIER
        response = await fetch(
          `https://bingo-backend-ccn6.onrender.com/api/cashiers/${editingCashierId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username,
              password,
              phone,
              house_id: id,
            }),
          }
        );
      } else {
        // CREATE CASHIER
        response = await fetch("https://bingo-backend-ccn6.onrender.com/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            phone: phone || "N/A",
            role: "Cashier",
            house_id: id,
            status: "Active",
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Operation failed");
        return;
      }

      alert(editingCashierId
        ? "Cashier updated successfully!"
        : "Cashier created successfully!");

      setEditingCashierId(null);
      setUsername("");
      setPassword("");
      setPhone("");

      refreshDashboardData();

    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  // Modern UI Inline Styles - Blue Black Lightened (Midnight Dark Theme)
  const colors = {
    background: "#0b0f19",
    cardBg: "rgba(30, 41, 59, 0.45)",
    cardBorder: "rgba(56, 189, 248, 0.15)",
    activeCardBorder: "#0ea5e9",
    activeCardBg: "rgba(14, 165, 233, 0.18)",
    textMain: "#f8fafc",
    textMuted: "#94a3b8",
    accentBlue: "#0ea5e9",
    accentSky: "#38bdf8",
    accentCyan: "#2dd4bf",
    accentRed: "#f43f5e",
    accentPurple: "#a855f7",
  };

  const styles = {
    container: {
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      color: colors.textMain,
      background: colors.background,
      padding: "30px",
      minHeight: "100vh",
      maxHeight: "100vh",
      overflowY: "auto", 
      WebkitOverflowScrolling: "touch",
      boxSizing: "border-box",
    },
    headerSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
      flexWrap: "wrap",
      gap: "15px",
    },
    mainTitle: {
      color: colors.textMain,
      margin: 0,
      fontSize: "30px",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "-0.5px",
    },
    houseBadge: {
      backgroundColor: "rgba(30, 41, 59, 0.8)",
      border: `1px solid ${colors.cardBorder}`,
      color: colors.textMuted,
      padding: "8px 16px",
      borderRadius: "20px",
      fontSize: "14px",
      fontWeight: "600",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "24px",
      marginBottom: "30px",
    },
    card: {
      backgroundColor: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      backdropFilter: "blur(16px)",
      padding: "24px",
      borderRadius: "16px",
    },
    packageCard: {
      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
      color: "white",
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(2, 132, 199, 0.25)",
      border: "1px solid rgba(255,255,255,0.1)",
    },
    buyPackageBtn: {
      width: "100%",
      padding: "10px 16px",
      marginTop: "16px",
      backgroundColor: "#ffffff",
      color: "#0284c7",
      border: "none",
      borderRadius: "10px",
      fontWeight: "700",
      fontSize: "14px",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      transition: "all 0.2s ease",
    },
    tierDisplayContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "10px",
      marginTop: "16px",
      paddingTop: "14px",
      borderTop: "1px solid rgba(255, 255, 255, 0.2)",
    },
    tierBadge: {
      backgroundColor: "rgba(0, 0, 0, 0.25)",
      borderRadius: "10px",
      padding: "8px 6px",
      textAlign: "center",
      border: "1px solid rgba(255, 255, 255, 0.15)",
    },
    cardTitle: {
      margin: "0 0 20px 0",
      fontSize: "18px",
      color: colors.textMain,
      fontWeight: "600",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      paddingBottom: "8px",
    },
    sectionTitle: {
      fontSize: "20px",
      color: colors.accentSky,
      marginBottom: "15px",
      marginTop: "45px",
      fontWeight: "600",
      letterSpacing: "0.5px",
    },
    linkButton: {
      display: "inline-block",
      padding: "12px 24px",
      backgroundColor: colors.accentBlue,
      color: "#ffffff",
      textDecoration: "none",
      borderRadius: "10px",
      fontWeight: "600",
      fontSize: "15px",
      boxShadow: "0 4px 15px rgba(14, 165, 233, 0.3)",
    },
    tableWrapper: {
      overflowX: "auto", 
      width: "100%",
      borderRadius: "16px",
      border: `1px solid ${colors.cardBorder}`,
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      marginBottom: "10px",
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
    showMoreBtn: {
      width: "100%",
      padding: "14px",
      background: "rgba(14, 165, 233, 0.15)",
      border: `1px solid ${colors.accentSky}`,
      color: colors.accentSky,
      borderRadius: "12px",
      fontWeight: "600",
      fontSize: "15px",
      cursor: "pointer",
      marginTop: "12px",
      transition: "all 0.2s ease-in-out",
      textAlign: "center",
    },
    deleteBtn: {
      padding: "12px 24px",
      backgroundColor: "rgba(244, 63, 94, 0.2)",
      color: colors.accentRed,
      border: `1px solid ${colors.accentRed}`,
      borderRadius: "10px",
      fontWeight: "700",
      fontSize: "14px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 12px rgba(244, 63, 94, 0.2)",
    }
  };

  // SVG XY Plot Calculation Helper
  const renderXYGraph = () => {
    if (sortedDailyGraph.length === 0) {
      return (
        <div style={{ textAlign: "center", color: colors.textMuted, padding: "40px" }}>
          No performance records available to render XY plot.
        </div>
      );
    }

    const svgWidth = 700;
    const svgHeight = 260;
    const padding = 40;

    const maxCards = Math.max(...sortedDailyGraph.map(d => d.totalCardsSold), 1);
    const maxComm = Math.max(...sortedDailyGraph.map(d => d.totalCommission), 1);
    const maxRounds = Math.max(...sortedDailyGraph.map(d => d.totalRoundsPlayed), 1);

    const getX = (index) => {
      if (sortedDailyGraph.length === 1) return svgWidth / 2;
      return padding + (index * (svgWidth - 2 * padding)) / (sortedDailyGraph.length - 1);
    };

    const getYCards = (val) => svgHeight - padding - (val / maxCards) * (svgHeight - 2 * padding);
    const getYComm = (val) => svgHeight - padding - (val / maxComm) * (svgHeight - 2 * padding);
    const getYRounds = (val) => svgHeight - padding - (val / maxRounds) * (svgHeight - 2 * padding);

    const cardsPoints = sortedDailyGraph.map((d, i) => `${getX(i)},${getYCards(d.totalCardsSold)}`).join(" ");
    const commPoints = sortedDailyGraph.map((d, i) => `${getX(i)},${getYComm(d.totalCommission)}`).join(" ");
    const roundsPoints = sortedDailyGraph.map((d, i) => `${getX(i)},${getYRounds(d.totalRoundsPlayed)}`).join(" ");

    return (
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "260px", overflow: "visible" }}>
          {/* Axis lines */}
          <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = svgHeight - padding - ratio * (svgHeight - 2 * padding);
            return (
              <line key={idx} x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
            );
          })}

          {/* Lines */}
          <polyline fill="none" stroke={colors.accentSky} strokeWidth="3" points={cardsPoints} />
          <polyline fill="none" stroke={colors.accentCyan} strokeWidth="3" points={commPoints} />
          <polyline fill="none" stroke={colors.accentPurple} strokeWidth="3" points={roundsPoints} />

          {/* XY Data Points */}
          {sortedDailyGraph.map((d, i) => {
            const x = getX(i);
            return (
              <g key={i}>
                {/* Cards point */}
                <circle cx={x} cy={getYCards(d.totalCardsSold)} r="5" fill={colors.accentSky} />
                {/* Commission point */}
                <circle cx={x} cy={getYComm(d.totalCommission)} r="5" fill={colors.accentCyan} />
                {/* Rounds point */}
                <circle cx={x} cy={getYRounds(d.totalRoundsPlayed)} r="5" fill={colors.accentPurple} />
                
                {/* Date Label on X Axis */}
                <text x={x} y={svgHeight - 12} fill={colors.textMuted} fontSize="11" textAnchor="middle">
                  {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.headerSection}>
        <h1 style={styles.mainTitle}>HOUSE DASHBOARD ({currentHouseUser.name || id})</h1>
        <span style={styles.houseBadge}>House ID: {id}</span>
      </div>

      {/* Top Overview Cards Grid */}
      <div style={styles.grid}>
        {/* Package Card */}
        <div style={styles.packageCard}>
          <h2 style={{ margin: "0 0 15px 0", fontSize: "19px", fontWeight: "600" }}>House Packages</h2>
          <div style={{ marginBottom: "15px" }}>
            <span style={{ fontSize: "11px", opacity: 0.7, fontWeight: "700", letterSpacing: "0.5px" }}>TOTAL PACKAGES ADDED</span>
            <h2 style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}>{packageInfo.totalAmount} ETB</h2>
          </div>
          <div>
            <span style={{ fontSize: "11px", opacity: 0.7, fontWeight: "700", letterSpacing: "0.5px" }}>REMAINING BALANCE</span>
            <h2 style={{ margin: 0, fontSize: "28px", color: colors.accentCyan, fontWeight: "700" }}>{packageInfo.remainingAmount.toFixed(2)} ETB</h2>
          </div>

          {/* BUY PACKAGE BUTTON */}
          <button 
            style={styles.buyPackageBtn}
            onClick={() => alert("Redirecting to Buy Package requested from Super Admin...")}
          >
            Buy Package
          </button>

          {/* SILVER, GOLD, DIAMOND DISPLAY (SET BY SUPER ADMIN) */}
          <div style={styles.tierDisplayContainer}>
            <div style={styles.tierBadge}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#e2e8f0", textTransform: "uppercase" }}>Silver</div>
              <div style={{ fontSize: "16px", fontWeight: "800", marginTop: "2px" }}>{tierPackages.silver}</div>
            </div>
            <div style={styles.tierBadge}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#fde047", textTransform: "uppercase" }}>Gold</div>
              <div style={{ fontSize: "16px", fontWeight: "800", marginTop: "2px" }}>{tierPackages.gold}</div>
            </div>
            <div style={styles.tierBadge}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#67e8f9", textTransform: "uppercase" }}>Diamond</div>
              <div style={{ fontSize: "16px", fontWeight: "800", marginTop: "2px" }}>{tierPackages.diamond}</div>
            </div>
          </div>
        </div>

        {/* Navigation / Actions Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>House Actions</h2>
          <p style={{ color: colors.textMuted, marginBottom: "20px" }}>Manage and oversee house cashier accounts and credentials.</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link to={`/manage-cashiers/${id}`} style={styles.linkButton}>Manage Cashiers</Link>
          </div>
        </div>
      </div>

      {/* DETAILED HOUSE GAME HISTORY LOG (VISIBLE FROM NEWEST TO OLDEST) */}
      <h2 style={styles.sectionTitle}>Detailed Game History Logs</h2>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date & Time</th>
              <th style={styles.th}>Game ID</th>
              <th style={styles.th}>Cashier</th>
              <th style={styles.th}>Cartelas Sold</th>
              <th style={styles.th}>Total Bet Pool</th>
              <th style={styles.th}>House Commission Earned</th>
            </tr>
          </thead>
          <tbody>
            {sortedHouseGames.length > 0 ? (
              sortedHouseGames.slice(0, visibleGameLogsCount).map((game, index) => {
                const cartelasCount = Number(game.cards_sold ?? game.cardsSold ?? game.soldCartelas?.length ?? 0);
                const betAmount = Number(game.bet) || 50;
                const grossPool = betAmount * cartelasCount;
                const commissionRate = Number(game.commission) || 15; 
                const houseEarned = (grossPool * (commissionRate / 100)).toFixed(2);

                const formattedDate = new Date(
                  game.created_at || game.finished_at || game.started_at || game.date
                ).toLocaleString();

                return (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td style={{ ...styles.td, color: colors.textMuted }}>
                      {formattedDate}
                    </td>
                    <td style={styles.td}><strong>#{game.game_id || game.id || index + 1}</strong></td>
                    <td style={styles.td}>
                      {game.cashier || game.cashier_id || "System"}
                    </td>
                    <td style={{ ...styles.td, color: colors.accentSky, fontWeight: "600" }}>{cartelasCount} Cards</td>
                    <td style={styles.td}>{grossPool} ETB</td>
                    <td style={{ ...styles.td, fontWeight: "700", color: colors.accentCyan }}>
                      {houseEarned} ETB <span style={{ fontSize: '12px', fontWeight: 'normal', color: colors.textMuted }}>({commissionRate}%)</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ ...styles.td, textAlign: "center", color: colors.textMuted, padding: "30px" }}>
                  No historical house game records available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SHOW MORE / SHOW LESS BAR */}
      {sortedHouseGames.length > 5 && (
        <button 
          style={styles.showMoreBtn}
          onClick={() => {
            if (visibleGameLogsCount >= sortedHouseGames.length) {
              setVisibleGameLogsCount(5);
            } else {
              setVisibleGameLogsCount(prev => prev + 10);
            }
          }}
        >
          {visibleGameLogsCount >= sortedHouseGames.length 
            ? "Show Less Logs" 
            : `Show More Logs (${sortedHouseGames.length - visibleGameLogsCount} remaining)`}
        </button>
      )}

      {/* Cashier Passwords and Details Section */}
      <h2 style={styles.sectionTitle}>Cashier Passwords & Roster</h2>
      
      {/* Compact Creating Cashier Form */}
      <form onSubmit={handleCreateCashier} style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        marginBottom: "24px",
        flexWrap: "wrap",
        background: "rgba(30, 41, 59, 0.25)",
        padding: "14px 16px",
        borderRadius: "12px",
        border: `1px solid ${colors.cardBorder}`
      }}>
        <input
          type="text"
          value={username}
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(15, 23, 42, 0.6)", color: "#fff", fontSize: "14px", flex: "1", minWidth: "140px", outline: "none" }}
        />

        <input
          type="password"
          value={password}
          placeholder="Password"
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(15, 23, 42, 0.6)", color: "#fff", fontSize: "14px", flex: "1", minWidth: "140px", outline: "none" }}
        />

        <input
          type="text"
          value={phone}
          placeholder="Phone (Optional)"
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(15, 23, 42, 0.6)", color: "#fff", fontSize: "14px", flex: "1", minWidth: "140px", outline: "none" }}
        />

        <button type="submit" style={{ padding: "10px 20px", background: `linear-gradient(135deg, ${colors.accentBlue}, #0284c7)`, color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(14, 165, 233, 0.2)" }}>
          {editingCashierId ? "Update Cashier" : "Create Cashier"}
        </button>

        {/* CANCEL / RESET BUTTON */}
        <button
          type="button"
          onClick={() => {
            setEditingCashierId(null);
            setUsername("");
            setPassword("");
            setPhone("");
          }}
          style={{
            padding: "10px 16px",
            background: "rgba(148, 163, 184, 0.15)",
            color: colors.textMuted,
            border: "1px solid rgba(148, 163, 184, 0.3)",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Cancel
        </button>
      </form>

      {/* Roster Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Password</th>
              <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cashiers.length > 0 ? (
              cashiers.map((cashier, index) => {
                const rowUsername = cashier.username || cashier.name || cashier.cashier_name || "N/A";
                const rowPassword = cashier.password || cashier.plain_password || cashier.pwd || "N/A";

                return (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "transparent" }}>
                    <td style={styles.td}><strong>{rowUsername}</strong></td>
                    <td style={styles.td}>
                      <code style={{ color: colors.accentSky }}>
                        {rowPassword}
                      </code>
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          console.log("Edit clicked");
                          console.log(cashier);
                          editCashier(cashier);
                        }}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: "rgba(56, 189, 248, 0.15)",
                          color: colors.accentSky,
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer",
                          marginRight: "8px",
                          fontSize: "13px"
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete ${rowUsername}?`)) {
                            try {
                              const res = await fetch(`https://bingo-backend-ccn6.onrender.com/api/users/${cashier.id || rowUsername}`, {
                                method: "DELETE",
                              });
                              if (res.ok) {
                                refreshDashboardData();
                              } else {
                                alert("Failed to delete cashier.");
                              }
                            } catch (err) {
                              console.error(err);
                              alert("Cannot connect to server.");
                            }
                          }
                        }}
                        style={{ padding: "6px 14px", backgroundColor: "rgba(244, 63, 94, 0.15)", color: colors.accentRed, border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" style={{ ...styles.td, textAlign: "center", color: colors.textMuted, padding: "30px" }}>
                  No cashiers tied to this house profile.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================== */}
      {/* PERIODIC PERFORMANCE SUMMARY CARDS & DELETE BUTTON */}
      {/* ========================================================================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginTop: "45px", marginBottom: "15px" }}>
        <h2 style={{ ...styles.sectionTitle, marginTop: 0, marginBottom: 0 }}>
          Performance Summary (Select Tab to Filter/Delete)
        </h2>
        <button 
          onClick={handleDeletePeriodData}
          style={styles.deleteBtn}
        >
          🗑️ Delete {selectedPeriod.toUpperCase()} Records
        </button>
      </div>

      <div style={{ ...styles.grid, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {/* Daily Summary Card */}
        <div 
          onClick={() => setSelectedPeriod("daily")}
          style={{
            ...styles.card,
            cursor: "pointer",
            border: `2px solid ${selectedPeriod === "daily" ? colors.activeCardBorder : colors.cardBorder}`,
            backgroundColor: selectedPeriod === "daily" ? colors.activeCardBg : colors.cardBg,
            boxShadow: selectedPeriod === "daily" ? "0 0 15px rgba(14, 165, 233, 0.3)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: colors.accentSky }}>Daily Performance</h3>
            {selectedPeriod === "daily" && <span style={{ fontSize: "11px", color: colors.accentSky, fontWeight: "bold" }}>● ACTIVE</span>}
          </div>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Cartelas Sold: <strong style={{ color: colors.textMain }}>{periodicStats.daily.cards}</strong>
          </p>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Net Commission: <strong style={{ color: colors.accentCyan }}>{periodicStats.daily.commission.toFixed(2)} ETB</strong>
          </p>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Games Played: <strong style={{ color: colors.accentPurple }}>{periodicStats.daily.games}</strong>
          </p>
        </div>

        {/* Weekly Summary Card */}
        <div 
          onClick={() => setSelectedPeriod("weekly")}
          style={{
            ...styles.card,
            cursor: "pointer",
            border: `2px solid ${selectedPeriod === "weekly" ? colors.activeCardBorder : colors.cardBorder}`,
            backgroundColor: selectedPeriod === "weekly" ? colors.activeCardBg : colors.cardBg,
            boxShadow: selectedPeriod === "weekly" ? "0 0 15px rgba(14, 165, 233, 0.3)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: colors.accentSky }}>Weekly Performance</h3>
            {selectedPeriod === "weekly" && <span style={{ fontSize: "11px", color: colors.accentSky, fontWeight: "bold" }}>● ACTIVE</span>}
          </div>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Cartelas Sold: <strong style={{ color: colors.textMain }}>{periodicStats.weekly.cards}</strong>
          </p>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Net Commission: <strong style={{ color: colors.accentCyan }}>{periodicStats.weekly.commission.toFixed(2)} ETB</strong>
          </p>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Games Played: <strong style={{ color: colors.accentPurple }}>{periodicStats.weekly.games}</strong>
          </p>
        </div>

        {/* Monthly Summary Card */}
        <div 
          onClick={() => setSelectedPeriod("monthly")}
          style={{
            ...styles.card,
            cursor: "pointer",
            border: `2px solid ${selectedPeriod === "monthly" ? colors.activeCardBorder : colors.cardBorder}`,
            backgroundColor: selectedPeriod === "monthly" ? colors.activeCardBg : colors.cardBg,
            boxShadow: selectedPeriod === "monthly" ? "0 0 15px rgba(14, 165, 233, 0.3)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: colors.accentSky }}>Monthly Performance</h3>
            {selectedPeriod === "monthly" && <span style={{ fontSize: "11px", color: colors.accentSky, fontWeight: "bold" }}>● ACTIVE</span>}
          </div>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Cartelas Sold: <strong style={{ color: colors.textMain }}>{periodicStats.monthly.cards}</strong>
          </p>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Net Commission: <strong style={{ color: colors.accentCyan }}>{periodicStats.monthly.commission.toFixed(2)} ETB</strong>
          </p>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Games Played: <strong style={{ color: colors.accentPurple }}>{periodicStats.monthly.games}</strong>
          </p>
        </div>

        {/* Yearly Summary Card */}
        <div 
          onClick={() => setSelectedPeriod("yearly")}
          style={{
            ...styles.card,
            cursor: "pointer",
            border: `2px solid ${selectedPeriod === "yearly" ? colors.activeCardBorder : colors.cardBorder}`,
            backgroundColor: selectedPeriod === "yearly" ? colors.activeCardBg : colors.cardBg,
            boxShadow: selectedPeriod === "yearly" ? "0 0 15px rgba(14, 165, 233, 0.3)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: colors.accentSky }}>Yearly Performance</h3>
            {selectedPeriod === "yearly" && <span style={{ fontSize: "11px", color: colors.accentSky, fontWeight: "bold" }}>● ACTIVE</span>}
          </div>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Cartelas Sold: <strong style={{ color: colors.textMain }}>{periodicStats.yearly.cards}</strong>
          </p>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Net Commission: <strong style={{ color: colors.accentCyan }}>{periodicStats.yearly.commission.toFixed(2)} ETB</strong>
          </p>
          <p style={{ margin: "6px 0", color: colors.textMuted, fontSize: "14px" }}>
            Games Played: <strong style={{ color: colors.accentPurple }}>{periodicStats.yearly.games}</strong>
          </p>
        </div>
      </div>

      {/* DAILY PERFORMANCE XY GRAPH COMPONENT */}
      <h2 style={{ ...styles.sectionTitle, marginTop: "25px" }}>Daily Performance Analytics (XY Plot)</h2>
      <div style={{ ...styles.card, marginBottom: "40px" }}>
        {/* Legend */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px", fontSize: "13px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: colors.accentSky, borderRadius: "50%" }}></div>
            <span style={{ color: colors.textMuted }}>Cartelas Sold Count</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: colors.accentCyan, borderRadius: "50%" }}></div>
            <span style={{ color: colors.textMuted }}>House Commission (ETB)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: colors.accentPurple, borderRadius: "50%" }}></div>
            <span style={{ color: colors.textMuted }}>Rounds Played</span>
          </div>
        </div>

        {renderXYGraph()}
      </div>
    </div>
  );
}