import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./SuperAdminDashboard.css";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  // Reactive state holders connected to backend database tables
  const [sales, setSales] = useState([]);
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [housesList, setHousesList] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [showCashierPasswords, setShowCashierPasswords] = useState(false);
  const [showHousePasswords, setShowHousePasswords] = useState(false);
  const [showFinanceDashboard, setShowFinanceDashboard] = useState(false);
  const [showHouseLoginPasswords, setShowHouseLoginPasswords] = useState(false);

  const [selectedHouse, setSelectedHouse] = useState("");
  const [packageAmount, setPackageAmount] = useState("");

  const [silverTier, setSilverTier] = useState("8000");
  const [goldTier, setGoldTier] = useState("15000");
  const [diamondTier, setDiamondTier] = useState("30000");

  // State for editing individual house remaining packages inline
  const [editingHouseId, setEditingHouseId] = useState(null);
  const [editedRemainingPackage, setEditedRemainingPackage] = useState("");

  // Fetch all Super Admin system data from backend API
  const fetchSuperAdminData = async () => {
    try {
      const usersRes = await fetch("https://bingo-backend-ccn6.onrender.com/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (Array.isArray(usersData)) setUsers(usersData);
      }

      const housesRes = await fetch("https://bingo-backend-ccn6.onrender.com/api/houses");

if (housesRes.ok) {
  const housesData = await housesRes.json();

 console.log("All houses:", housesData);

const house6 = housesData.find(h => h.id === 6);

console.log("HOUSE 6 JSON");
console.log(JSON.stringify(house6, null, 2));

  if (Array.isArray(housesData)) {
    setHousesList(housesData);
  }
}

      const gamesRes = await fetch("https://bingo-backend-ccn6.onrender.com/api/games");
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        if (Array.isArray(gamesData)) setGames(gamesData);
      }

      const salesRes = await fetch("https://bingo-backend-ccn6.onrender.com/api/sales");
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        if (Array.isArray(salesData)) setSales(salesData);
      }

      const notifRes = await fetch("https://bingo-backend-ccn6.onrender.com/api/notifications");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (Array.isArray(notifData)) setNotifications(notifData);
      }

      const tiersRes = await fetch("https://bingo-backend-ccn6.onrender.com/api/superadmin/tiers");
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setSilverTier(tiersData.silver ?? "8000");
        setGoldTier(tiersData.gold ?? "15000");
        setDiamondTier(tiersData.diamond ?? "30000");
      }
    } catch (err) {
      console.error("Error fetching super admin data from server:", err);
    }
  };

  useEffect(() => {
  fetchSuperAdminData();

  window.addEventListener("focus", fetchSuperAdminData);

  return () => {
    window.removeEventListener("focus", fetchSuperAdminData);
  };
}, []);

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const cashiers = users.filter((user) => user.role === "Cashier");
  const houseAdmins = users.filter((user) => user.role === "House Admin");

  const totalCashiers = cashiers.length;
  const totalHouses = housesList.length;

  async function addPackage() {
    if (!selectedHouse) {
      alert("Select a house.");
      return;
    }

    if (!packageAmount || Number(packageAmount) <= 0) {
      alert("Enter a valid package amount.");
      return;
    }

    try {
      const response = await fetch(`https://bingo-backend-ccn6.onrender.com/api/houses/${selectedHouse}/package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(packageAmount) }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to add package");
        return;
      }

      alert(`Package added successfully!\n\nRemaining Package: ${data.remainingAmount} ETB`);
      setSelectedHouse("");
      setPackageAmount("");
      fetchSuperAdminData();
    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  async function saveTierPackages() {
    try {
      const response = await fetch("https://bingo-backend-ccn6.onrender.com/api/superadmin/tiers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          silver: silverTier,
          gold: goldTier,
          diamond: diamondTier,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to update tiers");
        return;
      }

      alert("Tier Packages updated successfully! Changes are now reflected on House Dashboards.");
      fetchSuperAdminData();
    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  async function updateRemainingPackage(houseId) {
    try {
      const response = await fetch(`https://bingo-backend-ccn6.onrender.com/api/houses/${houseId}/remaining-package`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remaining_package: Number(editedRemainingPackage) }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to update remaining package");
        return;
      }

      alert("Remaining package updated successfully!");
      setEditingHouseId(null);
      setEditedRemainingPackage("");
      fetchSuperAdminData();
    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  return (
    <div 
      className="super-admin-container" 
      style={{ 
        maxHeight: "100vh", 
        overflowY: "auto", 
        WebkitOverflowScrolling: "touch",
        paddingBottom: "100px" 
      }}
    >
      <div className="admin-header">
        <h1>BINGO SUPER ADMIN DASHBOARD</h1>
      </div>

      <div className="admin-menu">
        <h2>Menu</h2>
        <nav>
          <Link to="/register">Register User</Link>
          <Link to="/users">User List</Link>
          <Link to="/houses">House List</Link>
          <Link to="/agent-list">Agent List</Link>
          <Link to="/agent-recharge">Agent Recharge History</Link>
          <Link to="/house-recharge">House Recharge History</Link>
          <Link to="/print-cartelas">🖨️ Print Cartelas</Link>
          <Link to="/">Logout</Link>
        </nav>
      </div>

      {/* PRINT CARTELAS SECTION WITH SCROLLBAR */}
      <div 
        className="section" 
        style={{ 
          background: "rgba(30, 41, 59, 0.7)", 
          borderRadius: "12px", 
          padding: "16px", 
          marginBottom: "20px",
          maxHeight: "220px",
          overflowY: "auto"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px" }}>🖨️ PRINT CARTELAS</h2>
            <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "13px" }}>
              Generate and print bingo cartela cards (1–150) for players.
            </p>
          </div>
          <button 
            onClick={() => navigate("/print-cartelas")} 
            className="btn-large-print"
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            🖨️ PRINT CARTELAS
          </button>
        </div>
      </div>

      <div className="admin-summary">
        <h2>System Summary</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <h3>Total Houses</h3>
            <p className="summary-value">{totalHouses}</p>
          </div>
          <div className="summary-card">
            <h3>Total Cashiers</h3>
            <p className="summary-value">{totalCashiers}</p>
          </div>
          <div className="summary-card">
            <h3>Total Users</h3>
            <p className="summary-value">{users.length}</p>
          </div>
          <div className="summary-card">
            <h3>Total Games</h3>
            <p className="summary-value">{games.length}</p>
          </div>
          <div className="summary-card">
            <h3>Cards Sold</h3>
            <p className="summary-value">{sales.length}</p>
          </div>
          <div className="summary-card">
            <h3>Total Sales Income</h3>
            <p className="summary-value">{totalSales} ETB</p>
          </div>
        </div>
      </div>

      {/* CASHIER PASSWORDS SECTION */}
      <div className="section">
        <div className="section-header">
          <h2>All Cashier Passwords (Super Admin Managed)</h2>
          <button
            className="toggle-btn"
            onClick={() => setShowCashierPasswords(!showCashierPasswords)}
          >
            {showCashierPasswords ? "▼ Hide" : "▶ Show"}
          </button>
        </div>
        {showCashierPasswords && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cashier ID</th>
                <th>Name</th>
                <th>Assigned House</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              {cashiers.map((cashier, index) => {
                const assignedHouse = cashier.house_id || cashier.house || cashier.branch;
                return (
                  <tr key={index}>
                    <td>{cashier.id || cashier.username}</td>
                    <td>{cashier.name || cashier.username}</td>
                    <td>
                      {assignedHouse ? (
                        assignedHouse
                      ) : (
                        <span style={{ color: "#38bdf8", fontWeight: "bold" }}>
                          👑 Super Admin Only
                        </span>
                      )}
                    </td>
                    <td className="password-cell">
                      <code>{cashier.password || "••••••"}</code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* HOUSE PASSWORDS SECTION */}
      <div className="section">
        <div className="section-header">
          <h2>House Passwords & History</h2>
          <button
            className="toggle-btn"
            onClick={() => setShowHousePasswords(!showHousePasswords)}
          >
            {showHousePasswords ? "▼ Hide" : "▶ Show"}
          </button>
        </div>
        {showHousePasswords && (
          <div className="houses-grid">
            {housesList.map((house, index) => (
              <div key={index} className="house-card">
                <h3>{house.house_name || `House ID: ${house.id}`}</h3>
                <div className="house-info">
                  <div className="info-item">
                    <label>Owner:</label>
                    <span>{house.owner_name || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <label>Total Package:</label>
                    <span>{house.total_package || 0} ETB</span>
                  </div>
                  <div className="info-item">
                    <label>Remaining Package:</label>
                    <span>{house.remaining_package || 0} ETB</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span>{house.status || "Active"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HOUSE LOGIN PASSWORDS FOR FINANCIAL DASHBOARD */}
      <div className="section">
        <div className="section-header">
          <h2>House Login Passwords (Financial Dashboard Access)</h2>
          <button
            className="toggle-btn"
            onClick={() => setShowHouseLoginPasswords(!showHouseLoginPasswords)}
          >
            {showHouseLoginPasswords ? "▼ Hide" : "▶ Show"}
          </button>
        </div>
        {showHouseLoginPasswords && (
          <table className="data-table">
            <thead>
              <tr>
                <th>House ID</th>
                <th>House Name</th>
                <th>Username</th>
                <th>Login Password</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {houseAdmins.map((house, index) => (
                <tr key={index}>
                  <td>{house.id || house.username}</td>
                  <td>{house.name || "N/A"}</td>
                  <td>{house.username}</td>
                  <td className="password-cell">
                    <code>{house.password || "••••••"}</code>
                  </td>
                  <td>{house.email || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* HOUSE FINANCIAL DASHBOARD */}
      <div className="section">
        <div className="section-header">
          <h2>House Financial Dashboard</h2>
          <button
            className="toggle-btn"
            onClick={() => setShowFinanceDashboard(!showFinanceDashboard)}
          >
            {showFinanceDashboard ? "▼ Hide" : "▶ Show"}
          </button>
        </div>
        {showFinanceDashboard && (
          <div className="finance-grid">
            {housesList.map((house, index) => {
              const houseCashiers = cashiers.filter(
                (c) =>
                  String(c.house_id) === String(c.id) ||
                  c.house === house.house_name
              );

              const houseSales = sales.filter(
                (sale) =>
                  String(sale.house) === String(house.id) ||
                  sale.house === house.house_name
              );

              const houseIncome = houseSales.reduce(
                (sum, sale) => sum + Number(sale.amount || 0),
                0
              );

              return (
                <div key={index} className="finance-card">
                  <h3>{house.house_name || `House ID: ${house.id}`}</h3>
                  <div className="finance-info">
                    <div className="info-row">
                      <span>Assigned Cashiers:</span>
                      <strong>{houseCashiers.length}</strong>
                    </div>
                    <div className="info-row">
                      <span>Cards Sold:</span>
                      <strong>{houseSales.length}</strong>
                    </div>
                    <div className="info-row">
                      <span>Total Income:</span>
                      <strong className="income">{houseIncome} ETB</strong>
                    </div>
                    <div className="info-row">
                      <span>Owner Name:</span>
                      <strong>{house.owner_name || "N/A"}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PASSWORD CHANGES NOTIFICATION */}
      <div className="section">
        <h2>Finance Password Changes By House</h2>
        <div className="password-changes-grid">
          {housesList.length > 0 ? (
            housesList.map((house, houseIndex) => {
              const houseChanges = notifications.filter(
                (item) => String(item.house) === String(house.id) || item.house === house.house_name
              );
              return (
                <div key={houseIndex} className="password-change-card">
                  <div className="change-card-header">
                    <h3>🏠 {house.house_name || `House ID: ${house.id}`}</h3>
                    <span className="change-count">{houseChanges.length} changes</span>
                  </div>
                  {houseChanges.length > 0 ? (
                    <table className="change-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>New Password</th>
                          <th>Changed By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {houseChanges.map((item, index) => (
                          <tr key={index}>
                            <td>{item.date}</td>
                            <td>
                              <code>{item.password}</code>
                            </td>
                            <td>{item.changedBy || "System"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-changes">No password changes recorded</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="no-houses">No houses available</p>
          )}
        </div>
      </div>

      {/* HOUSE PACKAGE MANAGEMENT SECTION WITH EDITABLE REMAINING PACKAGE */}
      <div className="section">
        <h2>HOUSE PACKAGE MANAGEMENT</h2>
        <div
          style={{
            display: "flex",
            gap: "15px",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "15px",
          }}
        >
          <select
            value={selectedHouse}
            onChange={(e) => setSelectedHouse(e.target.value)}
          >
            <option value="">Select House</option>
            {housesList.map((house) => (
              <option key={house.id} value={house.id}>
                {house.house_name ? `${house.house_name} (ID: ${house.id})` : `House ID: ${house.id}`}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Package Amount (ETB)"
            value={packageAmount}
            onChange={(e) => setPackageAmount(e.target.value)}
          />

          <button onClick={addPackage}>Recharge Package</button>
        </div>

        <div 
          style={{
            marginTop: "25px",
            padding: "16px",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#38bdf8" }}>
            ⚙️ C O N F I G U R E  H O U S E  T I E R  P A C K A G E S
          </h3>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>💠 S I L V E R  P A C K A G E S</label>
              <input
                type="text"
                value={silverTier}
                onChange={(e) => setSilverTier(e.target.value)}
                placeholder="e.g. 8000"
                style={{ width: "130px", padding: "8px", borderRadius: "6px", border: "1px solid #334155", background: "#0f172a", color: "#fff" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>🪙 G O L D  P A C K A G E S</label>
              <input
                type="text"
                value={goldTier}
                onChange={(e) => setGoldTier(e.target.value)}
                placeholder="e.g. 15000"
                style={{ width: "130px", padding: "8px", borderRadius: "6px", border: "1px solid #334155", background: "#0f172a", color: "#fff" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>💎 D I A M O N D  P A C K A G E S</label>
              <input
                type="text"
                value={diamondTier}
                onChange={(e) => setDiamondTier(e.target.value)}
                placeholder="e.g. 30000"
                style={{ width: "130px", padding: "8px", borderRadius: "6px", border: "1px solid #334155", background: "#0f172a", color: "#fff" }}
              />
            </div>
            <button 
              onClick={saveTierPackages}
              style={{
                marginTop: "18px",
                padding: "9px 18px",
                background: "#0284c7",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Save Tier Config
            </button>
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          {housesList.map((house) => (
            <div
              key={house.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
                borderBottom: "1px solid #ddd",
              }}
            >
              <b>{house.house_name ? `${house.house_name} (ID: ${house.id})` : `House ID: ${house.id}`}</b>
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>Remaining Package:</span>
                {editingHouseId === house.id ? (
                  <>
                    <input
                      type="number"
                      value={editedRemainingPackage}
                      onChange={(e) => setEditedRemainingPackage(e.target.value)}
                      style={{ width: "90px", padding: "4px" }}
                    />
                    <button 
                      onClick={() => updateRemainingPackage(house.id)}
                      style={{ background: "#16a34a", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingHouseId(null)}
                      style={{ background: "#dc2626", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <b>{house.remaining_package || 0} ETB</b>
                    <button 
                      onClick={() => {
                        setEditingHouseId(house.id);
                        setEditedRemainingPackage(house.remaining_package || 0);
                      }}
                      style={{ background: "#2563eb", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", marginLeft: "10px" }}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CASHIER SALES HISTORY */}
      <div className="section">
        <h2>Cashier Sales History</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Cashier</th>
              <th>Player</th>
              <th>Card ID</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map((sale, index) => (
                <tr key={index}>
                  <td>{sale.date}</td>
                  <td>{sale.cashier}</td>
                  <td>{sale.player}</td>
                  <td>{sale.card}</td>
                  <td>{sale.amount} ETB</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "10px", color: "#64748b" }}>
                  No sales history records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}