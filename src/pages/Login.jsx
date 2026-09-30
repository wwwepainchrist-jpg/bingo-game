import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { useLanguage } from "../context/LanguageContext";
import {
  saveOfflineLogin,
  verifyOfflineLogin,
} from "../offline/offlineService";
export default function Login() {
  const navigate = useNavigate();

  // Consume global Language Context
  const { language, changeLanguage, t } = useLanguage();

  const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [loggingIn, setLoggingIn] = useState(false);
const loginLockRef = useRef(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changeUsername, setChangeUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
useEffect(() => {
  const savedUser = localStorage.getItem("currentUser");

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);

      if (user?.role) {
        console.log("✅ EXISTING LOGIN FOUND:", user);
      }
    } catch (err) {
      console.error("❌ INVALID SAVED LOGIN:", err);
      localStorage.removeItem("currentUser");
    }
  }

  setUsername("");
  setPassword("");
}, []);
const API_URL = "https://bingo-backend-ccn6.onrender.com/api";


 
   
async function login() {
  console.log("🖱️ LOGIN FUNCTION CALLED", {
    time: Date.now(),
    lock: loginLockRef.current,
  });

  // 🔒 HARD LOGIN LOCK
  if (loginLockRef.current) {
    console.log("⛔ LOGIN ALREADY IN PROGRESS");
    return;
  }

  if (!username.trim() || !password) {
    alert("Please enter username and password.");
    return;
  }

  // 🔒 Lock immediately
  loginLockRef.current = true;
  setLoggingIn(true);

  try {
    console.log("⚡ LOGIN START");

    const startTime = performance.now();

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    });

    const data = await response.json();

    console.log(
      `⚡ LOGIN RESPONSE: ${(
        performance.now() - startTime
      ).toFixed(0)} ms`
    );

    if (!response.ok || !data.success) {
      alert(
        data.message ||
          "Wrong username or password."
      );

      return;
    }

    const user = data.user;

    console.log("✅ LOGIN SUCCESS:", user);
    console.log("👤 ROLE:", user.role);

    // ========================================================
    // 💾 SAVE ONLINE LOGIN FOR FUTURE OFFLINE LOGIN
    // ========================================================

    try {
      await saveOfflineLogin(
        username.trim(),
        password,
        user
      );

      console.log(
        "💾 LOGIN CREDENTIALS SAVED FOR OFFLINE USE"
      );
    } catch (offlineLoginSaveError) {
      console.error(
        "⚠️ FAILED TO SAVE OFFLINE LOGIN:",
        offlineLoginSaveError
      );

      // IMPORTANT:
      // Online login still continues normally.
    }

    // 💾 SAVE CURRENT USER
    localStorage.setItem(
      "currentUser",
      JSON.stringify(user)
    );

    // ========================================================
    // 🚀 NAVIGATION
    // ========================================================

    if (user.role === "Super Admin") {
      navigate("/super-admin", {
        replace: true,
      });

    } else if (user.role === "House Admin") {
      navigate(
        `/house-dashboard/${user.house_id}`,
        {
          replace: true,
        }
      );

    } else if (user.role === "Agent") {
      navigate(
        `/agent-dashboard/${user.username}`,
        {
          replace: true,
        }
      );

    } else if (user.role === "Cashier") {
      navigate(
        `/cashier-dashboard/${user.username}`,
        {
          replace: true,
        }
      );

    } else {
      alert(
        "Unknown role: " + user.role
      );
    }

  } catch (err) {

    // ========================================================
    // 📴 SERVER UNAVAILABLE
    // ========================================================

    console.warn(
      "📴 SERVER LOGIN FAILED - TRYING OFFLINE LOGIN:",
      err
    );

    try {
      const offlineUser =
        await verifyOfflineLogin(
          username.trim(),
          password
        );

      if (!offlineUser) {
        alert(
          "Cannot connect to server and no valid offline login was found."
        );

        return;
      }

      console.log(
        "✅ OFFLINE LOGIN SUCCESS:",
        offlineUser
      );

      // 💾 Restore current user
      localStorage.setItem(
        "currentUser",
        JSON.stringify(offlineUser)
      );

      console.log(
        "📴 USING SAVED OFFLINE USER:",
        offlineUser.username
      );

      // ======================================================
      // 🚀 SAME ROLE NAVIGATION AS ONLINE LOGIN
      // ======================================================

      if (
        offlineUser.role ===
        "Super Admin"
      ) {

        navigate("/super-admin", {
          replace: true,
        });

      } else if (
        offlineUser.role ===
        "House Admin"
      ) {

        navigate(
          `/house-dashboard/${offlineUser.house_id}`,
          {
            replace: true,
          }
        );

      } else if (
        offlineUser.role ===
        "Agent"
      ) {

        navigate(
          `/agent-dashboard/${offlineUser.username}`,
          {
            replace: true,
          }
        );

      } else if (
        offlineUser.role ===
        "Cashier"
      ) {

        navigate(
          `/cashier-dashboard/${offlineUser.username}`,
          {
            replace: true,
          }
        );

      } else {

        alert(
          "Unknown role: " +
          offlineUser.role
        );
      }

    } catch (offlineLoginError) {

      console.error(
        "❌ OFFLINE LOGIN FAILED:",
        offlineLoginError
      );

      alert(
        "Offline login failed."
      );
    }

  } finally {

    loginLockRef.current = false;

    setLoggingIn(false);
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
  // 🎮 GAME LOADING SCREEN
  if (loggingIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "70px",
            height: "70px",
            border: "6px solid rgba(255,255,255,0.2)",
            borderTop: "6px solid #38bdf8",
            borderRadius: "50%",
            animation: "loginSpin 1s linear infinite",
            marginBottom: "25px",
          }}
        />

        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: "bold",
            letterSpacing: "2px",
          }}
        >
          GAME LOADING
        </h1>

        <p
          style={{
            marginTop: "10px",
            color: "#94a3b8",
            fontSize: "16px",
          }}
        >
          Please wait...
        </p>

        <style>
          {`
            @keyframes loginSpin {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    );
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
  width: "700px",
  maxWidth: "95vw",
  minHeight: "700px",
  maxHeight: "95vh",
  overflowY: "auto",
  padding: "45px",
  boxSizing: "border-box",
  borderRadius: "20px",
}}
      >
        <h1
  style={{
    marginTop: 0,
    marginBottom: "30px",
    fontSize: "42px",
    textAlign: "center",
    fontWeight: "bold",
  }}
>
  L.SPEED BINGO LOGIN
</h1>

        {/* LANGUAGE SELECTOR */}
      <div style={{ marginBottom: "25px" }}>
  <label
    style={{
      display: "block",
      fontSize: "30px",
      color: "#fff",
      marginBottom: "12px",
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
      padding: "18px",
      borderRadius: "10px",
      fontSize: "33px",
      fontWeight: "bold",
      boxSizing: "border-box",
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
  style={{
    width: "100%",
    padding: "18px",
    marginBottom: "18px",
    boxSizing: "border-box",
    borderRadius: "10px",
    fontSize: "39px",
    minHeight: "65px",
  }}
/>

<input
  type="password"
  placeholder={t?.password || "Password"}
  value={password}
  autoComplete="new-password"
  onChange={(e) => setPassword(e.target.value)}
  style={{
    width: "100%",
    padding: "18px",
    marginBottom: "25px",
    boxSizing: "border-box",
    borderRadius: "10px",
    fontSize: "38px",
    minHeight: "65px",
  }}
/>

      <button
  onClick={login}
  disabled={loggingIn}
  style={{
    width: "100%",
    minHeight: "75px",
    padding: "18px",
    borderRadius: "10px",
    fontSize: "42px",
    fontWeight: "bold",
    cursor: loggingIn ? "not-allowed" : "pointer",
  }}
>
  {loggingIn
    ? "LOGGING IN..."
    : (t?.login || "LOGIN")}
</button>
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
    fontSize: "38px",
    fontWeight: "bold",
    textDecoration: "underline",
    padding: "12px",
  }}
>
  {showChangePassword
    ? "Cancel Password Change"
    : "Change Password"}
</button>
        </div>

        {showChangePassword && (
         <div
  style={{
    marginTop: "25px",
    paddingTop: "25px",
    borderTop: "1px solid rgba(255,255,255,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  }}
>
        <h3
  style={{
    margin: 0,
    marginBottom: "10px",
    color: "#fff",
    textAlign: "center",
    fontSize: "38px",
  }}
>
  Change Password
</h3>
           <input
  placeholder={t?.username || "Username"}
  value={changeUsername}
  onChange={(e) => setChangeUsername(e.target.value)}
  style={{
    width: "100%",
    minHeight: "65px",
    padding: "18px",
    fontSize: "36px",
    boxSizing: "border-box",
    borderRadius: "10px",
  }}
/>

<input
  type="password"
  placeholder="Current Password"
  value={currentPassword}
  onChange={(e) => setCurrentPassword(e.target.value)}
  style={{
    width: "100%",
    minHeight: "65px",
    padding: "18px",
    fontSize: "36px",
    boxSizing: "border-box",
    borderRadius: "10px",
  }}
/>

<input
  type="password"
  placeholder="New Password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
  style={{
    width: "100%",
    minHeight: "65px",
    padding: "18px",
    fontSize: "38px",
    boxSizing: "border-box",
    borderRadius: "10px",
  }}
/>

            <button
  onClick={handlePasswordChange}
  style={{
    width: "100%",
    minHeight: "70px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "40px",
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