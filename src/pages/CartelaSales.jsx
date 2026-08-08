import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function CartelaSales(){
  const { id } = useParams();

  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the active game associated with this cashier from the PostgreSQL backend
  useEffect(() => {
    async function fetchActiveGame() {
      try {
        const response = await fetch(`https://bingo-backend-ccn6.onrender.com/api/games/active/${id}`);
        if (response.ok) {
          const data = await response.json();
          setGame(data); // Expecting { id, gameName, bet, cartelasSold: [...] }
        } else {
          console.error("No open game found for this cashier");
        }
      } catch (error) {
        console.error("Error connecting to backend API:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveGame();
  }, [id]);

  const cartelas = Array.from(
    { length: 150 },
    (_, i) => i + 1
  );

  async function sellCartela(){
    if (!selected) {
      alert("Select Cartela");
      return;
    }

    if (game?.cartelasSold?.includes(selected)) {
      alert("Already Sold");
      return;
    }

    try {
      const response = await fetch(`https://bingo-backend-ccn6.onrender.com/api/games/${game.id}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartelaNumber: selected })
      });

      if (response.ok) {
        const updatedGame = await response.json();
        setGame(updatedGame);
        alert("Cartela " + selected + " Sold");
        setSelected(null);
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to process sale");
      }
    } catch (error) {
      console.error("Error recording cartela sale:", error);
      alert("Network error while trying to sell cartela.");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        Loading active game data...
      </div>
    );
  }

  return (
    <div>
      <h1>
        CARTELA SALES
      </h1>

      <h3>
        Game: {game?.gameName || "No Active Game"}
      </h3>

      <h3>
        Price: {game?.bet || 0} ETB
      </h3>

      <hr />

      <h2>
        Select Cartela
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 70px)",
          gap: "10px"
        }}
      >
      {
        cartelas.map((number) => {
          const isSold = game?.cartelasSold?.includes(number);
          return (
            <button
              key={number}
              disabled={!game || isSold}
              onClick={() => setSelected(number)}
              style={{
                backgroundColor: selected === number ? "#38bdf8" : isSold ? "#cbd5e1" : "#ffffff",
                cursor: isSold ? "not-allowed" : "pointer",
                padding: "10px",
                fontWeight: "bold"
              }}
            >
              {number}
            </button>
          );
        })
      }
      </div>

      <hr />

      <h3>
        Selected: {selected || "None"}
      </h3>

      <button
        onClick={sellCartela}
        disabled={!game}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: game ? "pointer" : "not-allowed"
        }}
      >
        SELL CARTELA
      </button>
    </div>
  );
}