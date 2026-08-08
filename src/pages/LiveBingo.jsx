import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function LiveBingo() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [game, setGame] = useState(null);
  const [current, setCurrent] = useState(null);
  const [speed, setSpeed] = useState(3);
  const [paused, setPaused] = useState(false);

  const API_URL = "https://bingo-backend-ccn6.onrender.com/api";

  // Fetch initial game state for the cashier/house
  useEffect(() => {
    fetch(`${API_URL}/games/${id}`)
      .then((res) => res.json())
      .then((data) => setGame(data))
      .catch((err) => console.error("Error fetching game state:", err));
  }, [id]);

  // Handle number generation / draw request to backend
  async function generateNumber() {
    try {
      const response = await fetch(`${API_URL}/games/${id}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok && data.number !== undefined) {
        setCurrent(data.number);
      } else {
        alert(data.message || "Failed to draw number");
      }
    } catch (err) {
      console.error("Error drawing number:", err);
    }
  }

  // Handle pause / resume updates on the backend
  async function updateGameStatus(newPausedState) {
    setPaused(newPausedState);
    try {
      await fetch(`${API_URL}/games/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: newPausedState, speed }),
      });
    } catch (err) {
      console.error("Error updating game status:", err);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        gap: "20px",
        background: "#1d3557",
        padding: "15px",
        borderRadius: "10px",
        color: "white",
        overflowX: "auto",
        whiteSpace: "nowrap",
        width: "100%",
        minWidth: "max-content",
        marginBottom: "20px",
      }}
    >
      <button onClick={() => navigate("/cashier-dashboard/" + id)}>
        ← Back
      </button>

      <h1
        style={{
          margin: 0,
          fontSize: "25px",
        }}
      >
        LIVE BINGO
      </h1>

      <div>
        <button onClick={generateNumber}>TEST DRAW</button>
        <b>Cashier:</b> {id}
      </div>

      <div>
        <b>Bet:</b> {game?.bet || 0} ETB
      </div>

      <button onClick={() => updateGameStatus(true)}>PAUSE</button>

      <button onClick={() => updateGameStatus(false)}>RESUME</button>

      <div>
        <b>DRAW SPEED:</b>
      </div>

      <button
        onClick={() => {
          if (speed > 1) {
            setSpeed(speed - 1);
          }
        }}
      >
        -
      </button>

      <div>{speed} sec</div>

      <button onClick={() => setSpeed(speed + 1)}>+</button>

      <div>
        <b>PRIZE:</b> {game?.prize || 0} ETB
      </div>

      <div
        style={{
          marginTop: "20px",
          marginBottom: "25px",
          background: "linear-gradient(135deg,#1e3a8a,#2563eb)",
          borderRadius: "20px",
          padding: "25px",
          textAlign: "center",
          color: "white",
          boxShadow: "0 10px 25px rgba(0,0,0,.3)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            letterSpacing: "2px",
          }}
        >
          LAST DRAWN NUMBER
        </h2>

        <div
          style={{
            marginTop: "15px",
            fontSize: "90px",
            fontWeight: "bold",
            color: "#fbbf24",
          }}
        >
          {current || "---"}
        </div>
      </div>
    </div>
  );
}