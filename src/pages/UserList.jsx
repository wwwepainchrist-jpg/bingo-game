import { useState, useEffect } from "react";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [branch, setBranch] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");

  // Track show/hide password state per user id
  const [showPasswords, setShowPasswords] = useState({});

  useEffect(() => {
    fetch("https://bingo-backend-ccn6.onrender.com/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error(err));
  }, []);

  const filteredUsers = users.filter((user) =>
    (user.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (user.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (user.role || "").toLowerCase().includes(search.toLowerCase()) ||
    (user.branch || "").toLowerCase().includes(search.toLowerCase()) ||
    (user.phone || "").toLowerCase().includes(search.toLowerCase())
  );

  const togglePasswordVisibility = (id) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  async function deleteUser(id) {
    if (!window.confirm("Delete this user?")) return;

    try {
      const response = await fetch(
        `https://bingo-backend-ccn6.onrender.com/api/users/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Delete failed");
        return;
      }

      setUsers(users.filter((user) => user.id !== id));
      alert("User deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  function editUser(user) {
    setEditingUser(user);

    setFullName(user.full_name || "");
    setUsername(user.username || "");
    // Force direct mapping ensuring password key alignment with standard backend naming
    setPassword(user.password || user.pass || "");
    setRole(user.role || "");
    setBranch(user.branch || "");
    setPhone(user.phone || "");
    setStatus(user.status || "");
  }

  async function saveUser() {
    try {
      const response = await fetch(
        `https://bingo-backend-ccn6.onrender.com/api/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName,
            username,
            password,
            role,
            branch,
            phone,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Update failed");
        return;
      }

      alert("User updated successfully!");
      setEditingUser(null);

      const res = await fetch("https://bingo-backend-ccn6.onrender.com/api/users");
      const list = await res.json();
      setUsers(list);
    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", color: "#1e293b" }}>User List</h1>
        
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search users by name, username, role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px 14px",
            width: "300px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            outline: "none",
            backgroundColor: "#ffffff",
            fontSize: "14px"
          }}
        />
      </div>

      {/* Main Table Container with Vertical & Horizontal Scrolling Support */}
      <div 
        style={{ 
          background: "#ffffff", 
          borderRadius: "10px", 
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", 
          maxHeight: "70vh", 
          overflowY: "auto", 
          overflowX: "auto" 
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            minWidth: "700px"
          }}
        >
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", color: "#475569", fontSize: "14px" }}>
              <th style={{ padding: "12px 16px" }}>Username</th>
              <th style={{ padding: "12px 16px" }}>Full Name</th>
              <th style={{ padding: "12px 16px" }}>Phone</th>
              <th style={{ padding: "12px 16px" }}>Branch</th>
              <th style={{ padding: "12px 16px" }}>Role</th>
              <th style={{ padding: "12px 16px" }}>Password</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "center" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const userPassword = user.password || user.pass || "-";
                return (
                  <tr key={user.id} style={{ borderBottom: "1px solid #e2e8f0", fontSize: "14px", color: "#334155" }}>
                    <td style={{ padding: "12px 16px" }}>{user.username}</td>
                    <td style={{ padding: "12px 16px" }}>{user.full_name || "-"}</td>
                    <td style={{ padding: "12px 16px" }}>{user.phone || "-"}</td>
                    <td style={{ padding: "12px 16px" }}>{user.branch || "-"}</td>
                    <td style={{ padding: "12px 16px" }}>{user.role}</td>
                    
                    {/* Password Column with Show/Hide Toggle */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "monospace" }}>
                          {showPasswords[user.id] ? userPassword : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.id)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "14px", padding: 0 }}
                          title={showPasswords[user.id] ? "Hide Password" : "Show Password"}
                        >
                          {showPasswords[user.id] ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        background: user.status === "Active" ? "#dcfce7" : "#fee2e2",
                        color: user.status === "Active" ? "#15803d" : "#b91c1c"
                      }}>
                        {user.status || "Active"}
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <button
                        onClick={() => editUser(user)}
                        style={{
                          background: "#2563eb",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "5px",
                          cursor: "pointer",
                          marginRight: "8px",
                          fontSize: "13px"
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteUser(user.id)}
                        style={{
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "13px"
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
        >
          {/* Scrollable Edit Modal Container */}
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "400px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "20px", color: "#1e293b" }}>Edit User</h2>

            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Full Name</label>
            <input
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />

            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Username</label>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />

            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Password</label>
            <input
              type="text"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />

            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Branch</label>
            <input
              placeholder="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />

            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Phone</label>
            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />

            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", backgroundColor: "#fff" }}
            >
              <option>House Admin</option>
              <option>Agent</option>
              <option>Cashier</option>
            </select>

            <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "20px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", backgroundColor: "#fff" }}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: "#cbd5e1", color: "#334155", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Cancel
              </button>
              
              <button
                onClick={saveUser}
                style={{ background: "#2563eb", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}