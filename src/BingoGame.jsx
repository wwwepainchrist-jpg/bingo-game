import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function BingoGame(){
  const { id } = useParams();

  const [game, setGame] = useState(null);
  const [selectedCartela, setSelectedCartela] = useState(null);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [current, setCurrent] = useState("");
  const [winnerCartelaInput, setWinnerCartelaInput] = useState("");

  const cartelas = Array.from({ length: 150 }, (_, i) => i + 1);

  // Fetch active game data on component mount
  useEffect(() => {
    async function fetchActiveGame() {
      try {
        const res = await fetch(`http://localhost:5000/api/cashier/${id}/active-game`);
        if (res.ok) {
          const data = await res.json();console.log("Backend game:", data.game);
          setGame(data.game || { gameName: "Active Game", cartelasSold: [] });
          if (data.game?.drawnNumbers) {
            setDrawnNumbers(data.game.drawnNumbers);
          }
        }
      } catch (err) {
        console.error("Error fetching active game:", err);
      }
    }
    fetchActiveGame();
  }, [id]);

  async function sellCartela(){
    if(!selectedCartela){
      alert("Select cartela");
      return;
    }

    if(game?.cartelasSold?.includes(selectedCartela)){
      alert("Already sold");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/games/${game?.id || id}/sell-cartela`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartela: selectedCartela, cashier: id })
      });

      if (res.ok) {
        const data = await res.json();
        setGame(data.game);
        alert("Cartela " + selectedCartela + " sold");
        setSelectedCartela(null);
      } else {
        alert("Failed to sell cartela");
      }
    } catch (err) {
      console.error("Error selling cartela:", err);
    }
  }

  async function drawNumber(){
    const letters = ["B", "I", "N", "G", "O"];
    const letter = letters[Math.floor(Math.random() * 5)];
    
    let min = 1;
    let max = 15;

    if(letter === "I"){
      min = 16;
      max = 30;
    }
    if(letter === "N"){
      min = 31;
      max = 45;
    }
    if(letter === "G"){
      min = 46;
      max = 60;
    }
    if(letter === "O"){
      min = 61;
      max = 75;
    }

    const number = Math.floor(Math.random() * (max - min + 1)) + min;
    const result = letter + " " + number;

    setCurrent(result);
    const updatedDrawn = [...drawnNumbers, result];
    setDrawnNumbers(updatedDrawn);

    speak(letter + " number " + number);

    // Persist drawn numbers to backend
    try {
      await fetch(`http://localhost:5000/api/games/${game?.id || id}/drawn-numbers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawnNumbers: updatedDrawn })
      });
    } catch (err) {
      console.error("Error saving drawn numbers:", err);
    }
  }

  async function resetGame() {
    setDrawnNumbers([]);
    setCurrent("");
    try {
      await fetch(`http://localhost:5000/api/games/${game?.id || id}/drawn-numbers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawnNumbers: [] })
      });
    } catch (err) {
      console.error("Error resetting game:", err);
    }
  }

  function speak(text){
    const voice = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(voice);
  }

  async function checkWinner() {
    if (!winnerCartelaInput) {
      alert("Enter Cartela ID");
      return;
    }
    alert("Checking winner for Cartela #" + winnerCartelaInput);
  }

  return (
    <div>
      <h1>
        BINGO GAME
      </h1>

      <h3>
        Cashier: {id}
      </h3>

      <h3>
        Game: {game?.gameName || "Loading..."}
      </h3>

      <hr/>

      <h2>
        SELL CARTELAS
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(10, 70px)",
          gap: "8px"
        }}
      >
      {
        cartelas.map((number) => (
          <button
            key={number}
            disabled={game?.cartelasSold?.includes(number)}
            onClick={() => setSelectedCartela(number)}
          >
            {number}
          </button>
        ))
      }
      </div>

      <h3>
        Selected: {selectedCartela}
      </h3>

      <button onClick={sellCartela}>
        SELL CARTELA
      </button>

      <hr/>

      <h2>
        LIVE BINGO
      </h2>

      <h1>
        {current}
      </h1>

      <button onClick={drawNumber}>
        START
      </button>

      <button onClick={resetGame}>
        RESET
      </button>

      <h3>
        Called Numbers
      </h3>

      {
        drawnNumbers.map((n, index) => (
          <p key={index}>
            {n}
          </p>
        ))
      }

      <hr/>

      <h2>
        CHECK WINNER
      </h2>

      <input
        placeholder="Enter Cartela ID"
        value={winnerCartelaInput}
        onChange={(e) => setWinnerCartelaInput(e.target.value)}
      />

      <button onClick={checkWinner}>
        CHECK WINNER
      </button>
    </div>
  );
}