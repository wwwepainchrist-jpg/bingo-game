import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function PlayerCartelaView() {
  const { id } = useParams();
  
  const [selectedCards, setSelectedCards] = useState(() => id ? [Number(id)] : []);
  const [isConfirmed, setIsConfirmed] = useState(() => id ? true : false);
  const [typedInput, setTypedInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Track database-backed matrices for selected cards
  const [cartelaMatrices, setCartelaMatrices] = useState({});

  // Track dabbed/highlighted numbers across all cards on player's phone
  // Format: { "cartelaNum-cellValue": true }
  const [markedCells, setMarkedCells] = useState({});
  const [allCartelas, setAllCartelas] = useState([]);
useEffect(() => {
  async function loadCartelas() {
    try {
      const res = await fetch(
        "http://192.168.1.2:5000/api/cartelas"
      );

      const data = await res.json();
      setAllCartelas(data);

    } catch (err) {
      console.error("Error loading cartelas:", err);
    }
  }

  loadCartelas();
}, []);
  // Fetch cartela matrices and initial selections from PostgreSQL backend
  useEffect(() => {
    async function fetchPlayerCartelaData() {
      try {
        const res = await fetch(`https://bingo-backend-ccn6.onrender.com/api/player-cartelas/${id || "default"}`);
        if (res.ok) {
          const data = await res.json();
          if (data.selectedCards && Array.isArray(data.selectedCards)) {
            setSelectedCards(data.selectedCards);
          }
          if (data.matrices) {
            setCartelaMatrices(data.matrices);
          }
        }
      } catch (err) {
        console.error("Error fetching player cartela data from server:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayerCartelaData();
  }, [id]);

  // Synchronize selected cartelas with backend database
  async function syncSelectedCards(updatedCards) {
    try {
      await fetch("https://bingo-backend-ccn6.onrender.com/api/player-cartelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: id, selectedCards: updatedCards })
      });
    } catch (err) {
      console.error("Error syncing player cartela selection:", err);
    }
  }

  const toggleCellMark = (cartelaNum, cellVal) => {
    if (cellVal === "FREE") return; // Keep FREE space permanently marked
    const key = `${cartelaNum}-${cellVal}`;
    setMarkedCells(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleNumberSelection = async (num) => {
    let updated;
    if (selectedCards.includes(num)) {
      updated = selectedCards.filter(n => n !== num);
    } else {
      updated = [...selectedCards, num].sort((a, b) => a - b);
    }
    setSelectedCards(updated);
    await syncSelectedCards(updated);
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    
    const parsed = typedInput
      .split(/[\s,]+/)
      .map(n => Number(n))
      .filter(n => !isNaN(n) && n >= 1 && n <= 150);

    if (parsed.length === 0) {
      alert("Please enter valid numbers between 1 and 150.");
      return;
    }

    const combined = Array.from(new Set([...selectedCards, ...parsed])).sort((a, b) => a - b);
    setSelectedCards(combined);
    setTypedInput("");
    await syncSelectedCards(combined);
  };

  // Helper generator fallback if backend matrix isn't pre-fetched for a given ID
  const getMatrixForId = (cartelaId) => {
    if (cartelaMatrices[cartelaId]) {
      return cartelaMatrices[cartelaId];
    }
    // Fallback algorithmic generation matching server seed layout
    const seed = Number(cartelaId) || 1;
    const columns = { B: [], I: [], N: [], G: [], O: [] };
    const getColNumbers = (min, max, count, seedVal) => {
      const list = [];
      for (let i = min; i <= max; i++) list.push(i);
      let currentSeed = seedVal;
      for (let i = list.length - 1; i > 0; i--) {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        const j = Math.floor((currentSeed / 233280) * (i + 1));
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
      }
      return list.slice(0, count).sort((a, b) => a - b);
    };

    columns.B = getColNumbers(1, 15, 5, seed + 100);
    columns.I = getColNumbers(16, 30, 5, seed + 200);
    columns.N = getColNumbers(31, 45, 4, seed + 300);
    columns.G = getColNumbers(46, 60, 5, seed + 400);
    columns.O = getColNumbers(61, 75, 5, seed + 500);

    const matrix = [];
    for (let r = 0; r < 5; r++) {
      const row = [
        columns.B[r],
        columns.I[r],
        r === 2 ? "FREE" : columns.N[r < 2 ? r : r - 1],
        columns.G[r],
        columns.O[r]
      ];
      matrix.push(row);
    }
    return matrix;
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#ffffff", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "sans-serif" }}>
        Loading player cards...
      </div>
    );
  }

  // STEP 1: SELECT WHICH CARTELAS TO PLAY
  if (!isConfirmed) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px",
        fontFamily: "sans-serif",
        boxSizing: "border-box"
      }}>
        <div style={{
          background: "#1e293b",
          padding: "20px",
          borderRadius: "16px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
          textAlign: "center"
        }}>
          <h1 style={{ color: "#38bdf8", fontSize: "22px", margin: "0 0 4px 0" }}>🎱 CHOOSE CARTELAS</h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>
            Tap numbers below or type multiple (e.g. 5, 12):
          </p>

          <form onSubmit={handleManualAdd} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input 
              type="text"
              placeholder="e.g. 5, 12, 45"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #38bdf8",
                background: "#0f172a",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: "bold",
                outline: "none"
              }}
            />
            <button 
              type="submit"
              style={{
                padding: "10px 14px",
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              + Add
            </button>
          </form>

          {selectedCards.length > 0 && (
            <div style={{ marginBottom: "16px", textAlign: "left" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Selected ({selectedCards.length}):</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                {selectedCards.map(num => (
                  <span 
                    key={num} 
                    onClick={() => toggleNumberSelection(num)}
                    style={{
                      background: "#38bdf8",
                      color: "#0f172a",
                      fontWeight: "bold",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    #{num} <span style={{ fontSize: "11px" }}>✕</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "6px",
            maxHeight: "260px",
            overflowY: "auto",
            padding: "8px",
            background: "#0f172a",
            borderRadius: "10px",
            marginBottom: "16px",
            border: "1px solid #334155"
          }}>
            {Array.from({ length: 150 }, (_, i) => i + 1).map(num => {
              const selected = selectedCards.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => toggleNumberSelection(num)}
                  style={{
                    padding: "8px 0",
                    background: selected ? "#22c55e" : "#1e293b",
                    color: selected ? "#ffffff" : "#cbd5e1",
                    border: selected ? "2px solid #86efac" : "1px solid #334155",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  {num}
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => {
              if (selectedCards.length === 0) return alert("Select at least one cartela number!");
              setIsConfirmed(true);
            }}
            style={{
              width: "100%",
              padding: "14px",
              background: selectedCards.length > 0 ? "#22c55e" : "#475569",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: selectedCards.length > 0 ? "pointer" : "not-allowed"
            }}
          >
            ✓ VIEW MY BINGO CARDS ({selectedCards.length})
          </button>
        </div>
      </div>
    );
  }
console.log("ALL SELECTED:", selectedCards);
console.log("ALL DATABASE IDS:", allCartelas.map(c => c.id));
  // STEP 2: DISPLAY CARDS WITH INTERACTIVE NUMBER HIGHLIGHTING
return (
  <div style={{
    minHeight: "100vh",
    height: "100vh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    background: "#0f172a",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    paddingBottom: "100px",
    fontFamily: "sans-serif",
    boxSizing: "border-box"
  }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: "360px",
        marginBottom: "12px"
      }}>
        <div>
          <h1 style={{ margin: 0, color: "#38bdf8", fontSize: "20px" }}>
            MY CARDS ({selectedCards.length})
          </h1>
          <p style={{ margin: "2px 0 0 0", color: "#94a3b8", fontSize: "11px" }}>
            Tap numbers to highlight called numbers
          </p>
        </div>
        <button 
          onClick={() => setIsConfirmed(false)}
          style={{
            background: "#334155",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          ✏️ Change
        </button>
      </div>

      <div style={{
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  width: "100%",
  maxWidth: "360px",
  paddingBottom: "100px"
}}>

{selectedCards.map(cartelaNum => {
  const cartela = allCartelas.find(
    c => Number(c.id) === Number(cartelaNum)
  );

  if (!cartela) return null;

  const matrix = cartela.numbers.rows;

  return (
    <div key={cartelaNum} style={{
      background: "#1e293b",
      padding: "12px",
      borderRadius: "12px",
      width: "100%",
      boxSizing: "border-box"
    }}>
              <div style={{
                textAlign: "center",
                fontWeight: "bold",
                color: "#f59e0b",
                fontSize: "18px",
                marginBottom: "8px"
              }}>
                CARTELA #{cartelaNum}
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "6px"
              }}>
                {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                  <div key={letter} style={{
                    background: "#0284c7",
                    fontWeight: "bold",
                    textAlign: "center",
                    padding: "8px 0",
                    borderRadius: "6px",
                    fontSize: "16px"
                  }}>
                    {letter}
                  </div>
                ))}

                {matrix.flat().map((cell, idx) => {
                  const isFree = cell === "FREE";
                  const key = `${cartelaNum}-${cell}`;
                  const isMarked = isFree || Boolean(markedCells[key]);

                  return (
                    <button
                      key={idx}
                      onClick={() => toggleCellMark(cartelaNum, cell)}
                      style={{
                        background: isFree 
                          ? "#059669" 
                          : isMarked 
                            ? "#eab308" 
                            : "#334155",
                        color: isMarked && !isFree ? "#0f172a" : "#ffffff",
                        fontWeight: "bold",
                        border: isMarked && !isFree ? "2px solid #fef08a" : "1px solid #475569",
                        padding: "12px 0",
                        borderRadius: "6px",
                        fontSize: isFree ? "11px" : "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: isFree ? "default" : "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isMarked && !isFree ? "0 0 10px rgba(234, 179, 8, 0.5)" : "none"
                      }}
                    >
                      {cell}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}