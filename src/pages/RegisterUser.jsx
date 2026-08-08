import { useState } from "react";
import { Link } from "react-router-dom";
import "./SuperAdminDashboard.css"; // Reusing your shared dark theme CSS

export default function RegisterUser() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("House Admin");

  async function registerUser() {
    if (!username || !password) {
      alert("Username and password required");
      return;
    }

    try {
      const response = await fetch("https://bingo-backend-ccn6.onrender.com/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          role,
          branch,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || data.error);
        return;
      }

      alert("User Registered Successfully!");

      setUsername("");
      setPassword("");
      setBranch("");
      setPhone("");
      setRole("House Admin");

    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  return (
    <div className="super-admin-container">
      {/* Header */}
      <header className="admin-header">
        <h1>REGISTER NEW USER / HOUSE</h1>
      </header>

      {/* Top Navigation Menu */}
      <div className="admin-menu">
        <h2>System Navigation</h2>
        <nav>
          <Link to="/register">Register</Link>
          <Link to="/super-admin">Super Admin Dashboard</Link>
          <Link to="/users">User List</Link>
          <Link to="/house-dashboard">House Dashboard</Link>
          <Link to="/cashiers">Manage Cashiers</Link>
          <Link to="/agent-dashboard">Agent Dashboard</Link>
          <Link to="/cashier-dashboard">Cashier Dashboard</Link>
          <Link to="/bingo-game">Bingo Game</Link>
          <Link to="/finance-dashboard">Finance Dashboard</Link>
        </nav>
      </div>

      {/* Registration Form Section */}
      <section className="section" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="section-header">
          <h2>User Account Details</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#94a3b8", fontSize: "14px" }}>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#94a3b8", fontSize: "14px" }}>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#94a3b8", fontSize: "14px" }}>Branch / House Name</label>
            <input
              type="text"
              placeholder="Enter branch or house"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#94a3b8", fontSize: "14px" }}>Phone Number</label>
            <input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#94a3b8", fontSize: "14px" }}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              <option value="House Admin">House Admin</option>
              <option value="Agent">Agent</option>
              <option value="Cashier">Cashier</option>
            </select>
          </div>

          <button onClick={registerUser} style={{ width: "100%", marginTop: "10px", padding: "14px" }}>
            Register User
          </button>
        </div>
      </section>
    </div>
  );
}