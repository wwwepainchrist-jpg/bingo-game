import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const navigate = useNavigate();

  // Consume global Language Context
  const { language, changeLanguage, t } = useLanguage();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changeUsername, setChangeUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

 const API_URL = "https://bingo-backend-ccn6.onrender.com/api";

  useEffect(() => {
    setUsername("");
    setPassword("");
  }, []);

 async function login() {
  try {console.log("LOGIN SENDING:", {
  username,
  passwordLength: password.length,
  password
});
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.message || "Wrong username or password");
      return;
    }

    const user = data.user;
console.log("Logged in user:", user);
console.log("Role:", user.role);

    localStorage.setItem("currentUser", JSON.stringify(user));

   if (user.role === "Super Admin") {
  navigate("/super-admin");

} else if (user.role === "House Admin") {

  console.log("Logged in user:", user);
  console.log("house_id =", user.house_id);

  navigate("/house-dashboard/" + user.house_id);

} else if (user.role === "Agent") {
  navigate("/agent-dashboard/" + user.username);
} else if (user.role === "Cashier") {
  navigate("/cashier-dashboard/" + user.username);
} else {
  alert("Unknown role: " + user.role);
}

  } catch (err) {
    console.error(err);
    alert("Cannot connect to server.");
  }
}

  async function handlePasswordChange() {
    if (!changeUsername || !currentPassword || !newPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (changeUsername === "admin") {
      alert("Super Admin password cannot be changed here.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: changeUsername,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to update password.");
        return;
      }

      alert("Password updated successfully!");

      setChangeUsername("");
      setCurrentPassword("");
      setNewPassword("");
      setShowChangePassword(false);
    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  return (
    <div
      className="login-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="login-box"
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ marginTop: 0 }}>BULCHA 
          LOGIN</h1>

        {/* LANGUAGE SELECTOR */}
        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              color: "#fff",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            🌐 {t?.language || "Language"}
          </label>

          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "15px",
            }}
          >
            <option value="en">🇺🇸 English</option>
          
            <option value="om">🇪🇹 Afaan Oromoo</option>
          </select>
        </div>

        <input
          placeholder={t?.username || "Username"}
          value={username}
          autoComplete="off"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder={t?.password || "Password"}
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login}>{t?.login || "LOGIN"}</button>

        <div
          style={{
            marginTop: "15px",
            textAlign: "center",
          }}
        >
          <button
            type="button"
            onClick={() => setShowChangePassword(!showChangePassword)}
            style={{
              background: "transparent",
              border: "none",
              color: "#38bdf8",
              cursor: "pointer",
              fontSize: "14px",
              textDecoration: "underline",
            }}
          >
            {showChangePassword ? "Cancel Password Change" : "Change Password"}
          </button>
        </div>

        {showChangePassword && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#fff",
                textAlign: "center",
              }}
            >
              Change Password
            </h3>

            <input
              placeholder={t?.username || "Username"}
              value={changeUsername}
              onChange={(e) => setChangeUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button
              onClick={handlePasswordChange}
              style={{
                background: "#10b981",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              UPDATE PASSWORD
            </button>
          </div>
        )}
      </div>
    </div>
  );
}