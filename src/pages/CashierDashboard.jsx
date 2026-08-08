import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "./CashierDashboard.css";
import { useLanguage } from "../context/LanguageContext";

function generateMockMatrixForId(id) {
  const seed = Number(id) || 1;
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
}

const localeFontStyle = {
  fontFamily: '"Nyala", "Abyssinica SIL", "Noto Sans Ethiopic", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textTransform: "none"
};

export default function CashierDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [bet, setBet] = useState(25);
  const [commission, setCommission] = useState(15);
  const [voiceMode, setVoiceMode] = useState("speech");

  const [selectedCartela, setSelectedCartela] = useState(null);
  const [keyboardInput, setKeyboardInput] = useState("");
  const [selectedPatterns, setSelectedPatterns] = useState([]);
  const [showFinance, setShowFinance] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const [soldCartelas, setSoldCartelas] = useState([]);
  const [currentCashier, setCurrentCashier] = useState({});
  const [rawPackageInfo, setRawPackageInfo] = useState({ totalAmount: 3642, remainingAmount: 1755 });
  const [loading, setLoading] = useState(true);

  // Fetch initial cashier data, settings, package info, and sold cartelas from PostgreSQL backend
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch(`https://bingo-backend-ccn6.onrender.com/api/cashier-dashboard/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.bet !== undefined) setBet(data.bet);
          if (data.commission !== undefined) setCommission(data.commission);
          if (data.voiceMode) setVoiceMode(data.voiceMode);
          if (data.soldCartelas) setSoldCartelas(data.soldCartelas);
          if (data.cashier) setCurrentCashier(data.cashier);
          if (data.packageInfo) setRawPackageInfo(data.packageInfo);
        }
      } catch (err) {
        console.error("Error fetching dashboard data from server:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [id]);

  const grossIncome = bet * soldCartelas.length;
  const commissionAmount = grossIncome * (Number(commission) / 100);
  const netIncome = grossIncome - commissionAmount;
  
  const houseId = Number(currentCashier.house_id) || Number(id);
  console.log("Cashier:", id);
  console.log("House:", houseId);
  
  const realRemainingPackageAmount = Number(
    rawPackageInfo.remaining_package ??
    rawPackageInfo.remainingAmount ??
    rawPackageInfo.remainingBalance ??
    rawPackageInfo.remaining ??
    0
  );

  const totalAmount = Number(
    rawPackageInfo.total_package ??
    rawPackageInfo.totalAmount ??
    1
  );
  console.log("rawPackageInfo:", rawPackageInfo);
  console.log("Remaining Package:", realRemainingPackageAmount);
  
  const upcomingGameCommission = Number(grossIncome) * (Number(commission) / 100);
  const isInsufficientPackage = realRemainingPackageAmount < upcomingGameCommission || realRemainingPackageAmount <= 0;
  
  const packagePercent = Math.min(100, Math.max(0, Math.round((realRemainingPackageAmount / totalAmount) * 100)));

  const handleIncreaseBet = async () => {
    const nextBet = bet + 5;
    setBet(nextBet);
    await updateSetting("bingo_bet", nextBet);
  };

  const handleDecreaseBet = async () => {
    const nextBet = Math.max(5, bet - 5);
    setBet(nextBet);
    await updateSetting("bingo_bet", nextBet);
  };

  async function updateSetting(key, value) {
    try {
      await fetch("https://bingo-backend-ccn6.onrender.com/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
    } catch (err) {
      console.error("Error updating setting:", err);
    }
  }

  async function sellCartela() {
    if (selectedCartela === null) return alert("Select a cartela first!");
    if (soldCartelas.includes(Number(selectedCartela))) return alert("Already sold!");
    
    const updated = [...soldCartelas, Number(selectedCartela)];
    setSoldCartelas(updated);
    setSelectedCartela(null);
   
  }

  const handleKeyboardSubmit = async (e) => {
    e.preventDefault();
    if (!keyboardInput.trim()) return;

    const parsedNums = keyboardInput
      .split(/[\s,]+/)
      .map(n => Number(n.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= 150);

    if (parsedNums.length === 0) {
      alert("Please enter valid cartela number(s) between 1 and 150.");
      return;
    }

    const alreadySold = parsedNums.filter(n => soldCartelas.includes(n));
    if (alreadySold.length > 0) {
      alert(`Cartela(s) #${alreadySold.join(", #")} are already sold!`);
      return;
    }

    const updated = Array.from(new Set([...soldCartelas, ...parsedNums])).sort((a, b) => a - b);
    setSoldCartelas(updated);
    setKeyboardInput("");
    setSelectedCartela(null);
    await syncSoldCartelas(updated);
  };

  async function toggleSoldCartela(num) {
    let updated;
    if (soldCartelas.includes(num)) {
      updated = soldCartelas.filter(n => n !== num);
    } else {
      updated = Array.from(new Set([...soldCartelas, num])).sort((a, b) => a - b);
    }
    setSoldCartelas(updated);
    if (selectedCartela === num) setSelectedCartela(null);
    await syncSoldCartelas(updated);
  }

  
  async function startGame() {
    if (soldCartelas.length === 0) return alert("Sell a cartela first!");
    
    // Calculate the commission that this game will cost
    const commissionAmount = Number(grossIncome) * (Number(commission) / 100);

    // Get the house's remaining package
    const remaining_package = realRemainingPackageAmount;

    // If remaining_package < commissionAmount, do not start the game and show insufficient balance alert
    if (remaining_package < commissionAmount) {
      return alert("insufficient balance");
    }

    const newRemaining = Math.max(0, remaining_package - commissionAmount);
    const updatedPackage = {
      ...rawPackageInfo,
      remainingAmount: newRemaining,
      remainingBalance: newRemaining,
      remaining: newRemaining
    };

    setRawPackageInfo(updatedPackage);

    const structuralSoldCartelas = soldCartelas.map(num => ({ id: String(num), matrix: generateMockMatrixForId(num) }));
    console.log("Cashier ID:", id);
    console.log("House ID:", houseId);
    
    const game = { 
      id: `G-${Date.now()}`,
      date: new Date().toISOString(),
      cashier: id, 
      house: houseId,
      bet: Number(bet), 
      prize: Number(netIncome.toFixed(0)),
      commission: Number(commission), 
      commissionDeducted: commissionAmount,
      soldCartelas: structuralSoldCartelas, 
      cardsSold: structuralSoldCartelas.length,
      selectedPatterns, 
      voiceMode: voiceMode 
    };
    
    alert(`Cashier=${game.cashier}\nHouse=${game.house}\nBet=${game.bet}`);

    console.log("Sending game:", JSON.stringify(game, null, 2));
    try {
      await fetch("https://bingo-backend-ccn6.onrender.com/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, remainingPackage: updatedPackage, cashierId: id })
      });
      await fetch("https://bingo-backend-ccn6.onrender.com/api/sold-cartelas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: game.id,
          cashierId: id,
          soldCartelas
        }),
      });
      await fetch(`https://bingo-backend-ccn6.onrender.com/api/houses/${houseId}/package`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    remaining_package: newRemaining,
  }),
});
    } catch (err) {
      console.error("Error starting game on server:", err);
    }

    setSoldCartelas([]);
    navigate(`/bingo-game/${id}`);
  }

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const port = typeof window !== "undefined" && window.location.port ? `:${window.location.port}` : ":5173";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const playerQrUrl = `${protocol}//${host}${port}/select-cartela`;

  if (loading) {
    return (
      <div style={{ padding: "20px", color: "#fff", textAlign: "center", ...localeFontStyle }}>
        Loading cashier dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ ...localeFontStyle, display: "flex", flexDirection: "column", minHeight: "100vh", padding: "4px", boxSizing: "border-box" }}>
      <div className="dashboard-wrapper" style={{ display: "flex", flexDirection: "column", flex: 1, gap: "4px" }}>
        
        {/* HEADER */}
        <div className="dashboard-header" style={{ padding: "4px 8px", marginBottom: "0px" }}>
          <div className="header-top" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
            <h1 className="header-title" style={{ fontSize: "13px", margin: 0, whiteSpace: "nowrap", lineHeight: 1.3, textTransform: "none" }}>
              {t?.dashboard || "CASHIER DASHBOARD"}
            </h1>
            
            {/* CONTROLS */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end" }}>
              {/* BET AMOUNT */}
              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px", 
                padding: "2px 6px", 
                background: "rgba(15, 23, 42, 0.6)", 
                border: "1px solid rgba(255, 255, 255, 0.15)", 
                borderRadius: "6px" 
              }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", whiteSpace: "nowrap", textTransform: "none" }}>
                  {t?.bet || "BET"}:
                </span>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#38bdf8", whiteSpace: "nowrap" }}>AMOUNT: {bet} ETB</span>
                <div style={{ display: "flex", gap: "4px", marginLeft: "2px" }}>
                  <button 
                    onClick={handleDecreaseBet} 
                    style={{ padding: "1px 5px", fontSize: "11px", fontWeight: "bold", background: "#1e293b", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: "4px", cursor: "pointer" }}
                  >
                    − 5
                  </button>
                  <button 
                    onClick={handleIncreaseBet} 
                    style={{ padding: "1px 5px", fontSize: "11px", fontWeight: "bold", background: "#1e293b", color: "#4ade80", border: "1px solid #14532d", borderRadius: "4px", cursor: "pointer" }}
                  >
                    + 5
                  </button>
                </div>
              </div>

              {/* PACKAGE BAR */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", maxWidth: "180px", flex: 1 }}>
                <div className="package-text" style={{ fontSize: "11px", whiteSpace: "nowrap", textTransform: "none" }}>
                  {isInsufficientPackage ? (t?.insufficient || "Insufficient") : `${t?.package || "Package"}:`}
                </div>
                <div className="package-bar-bg" style={{ height: "6px", flex: 1, margin: 0 }}>
                  <div 
                    className="package-bar-fill" 
                    style={{ 
                      width: `${packagePercent}%`, 
                      backgroundColor: isInsufficientPackage ? "#ef4444" : "#22c55e" 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* STATS */}
          <div className="header-stats" style={{ margin: "3px 0", fontSize: "11px", display: "flex", gap: "10px", alignItems: "center" }}>
            <div>{t?.cashier || "Cashier"}: <b className="stat-cashier">{id}</b></div>
            <div>{t?.sold || "Sold Cartelas"}: <b className="stat-sold">{soldCartelas.length}</b></div>
            
            <div style={{ 
              background: "rgba(15, 23, 42, 0.8)", 
              padding: "6px 14px", 
              borderRadius: "8px", 
              border: "2px solid #38bdf8",
              fontSize: "16px",
              fontWeight: "800",
              boxShadow: "0 0 10px rgba(56, 189, 248, 0.25)"
            }}>
              {t?.netIncome || "Net Income"}: <b className="stat-income" style={{ fontSize: "22px", fontWeight: "900", color: "#38bdf8", marginLeft: "6px" }}>{netIncome.toFixed(2)} ETB</b>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: "2px" }}>
            <button onClick={async () => { 
              setSoldCartelas([]); 
              await syncSoldCartelas([]); 
            }} className="btn btn-danger" style={{ padding: "3px 8px", fontSize: "11px", lineHeight: 1.2, textTransform: "none" }}>
              {t?.resetGame || "Reset Game"}
            </button>
            
            <button 
              onClick={startGame} 
              className="btn btn-success"
              disabled={isInsufficientPackage}
              style={{ opacity: isInsufficientPackage ? 0.4 : 1, cursor: isInsufficientPackage ? "not-allowed" : "pointer", padding: "3px 8px", fontSize: "11px", lineHeight: 1.2, textTransform: "none" }}
            >
              {isInsufficientPackage ? `⛔ ${t?.insufficient || "Insufficient"}` : (t?.start || "START GAME")}
            </button>
            
            <button onClick={() => setShowFinance(!showFinance)} className="btn btn-neutral" style={{ padding: "3px 8px", fontSize: "11px", lineHeight: 1.2, textTransform: "none" }}>
              {t?.finance || "FINANCE"}
            </button>

            <button 
              onClick={() => setShowQrModal(true)} 
              className="btn btn-neutral"
              style={{ background: "#7c3aed", color: "#ffffff", fontWeight: "bold", padding: "3px 8px", fontSize: "11px", lineHeight: 1.2, textTransform: "none" }}
            >
              📱 {t?.qr || "PLAYER QR CODE"}
            </button>

            <select
  value={voiceMode}
  onChange={async (e) => {
    const val = e.target.value;
    setVoiceMode(val);
    await updateSetting("bingo_voice_mode", val);
  }}
  style={{
    ...localeFontStyle,
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "2px 8px",
    fontSize: "11px",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer",
    minHeight: "26px"
  }}
>
  <option value="robot" style={{ background: "#1a202c" }}>🎤 {t?.robotVoice || "Robot Voice"}</option>
  <option value="recorded" style={{ background: "#1a202c" }}>🎙️ {t?.amharicVoice || "Amharic Voice"}</option>
</select>
          </div> 

          {showFinance && (
            <div className="finance-panel" style={{ padding: "4px", marginTop: "2px" }}>
              <label style={{ fontSize: "11px" }}>Commission %: </label>
              <input 
                type="number" 
                value={commission} 
                onChange={async (e) => {
                  const val = Number(e.target.value);
                  setCommission(val);
                  await updateSetting("bingo_commission", val);
                }} 
                className="finance-input" 
                style={{ padding: "1px 4px", fontSize: "11px" }}
              />
              <div className="finance-summary" style={{ fontSize: "11px" }}>Gross: {grossIncome} ETB </div>
            </div>
          )}
        </div>

        {/* MAIN GRID */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr", flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="right-column" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            
            {/* GRID HEADER WITH INPUT FORM */}
            <div className="grid-header" style={{ marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "14px", whiteSpace: "nowrap", lineHeight: 1.3, textTransform: "none" }}>
                {t?.select || "Select Cartela to Sell"}
              </h2>

              {/* INPUT FORM */}
              <form onSubmit={handleKeyboardSubmit} style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1, maxWidth: "260px" }}>
                <input 
                  type="text"
                  placeholder={t?.typeCartelaPlaceholder || "Type # & press Enter..."}
                  value={keyboardInput}
                  onChange={(e) => setKeyboardInput(e.target.value)}
                  style={{
                    ...localeFontStyle,
                    width: "100%",
                    padding: "4px 8px",
                    background: "#0f172a",
                    border: "1px solid #38bdf8",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontWeight: "bold",
                    fontSize: "11px",
                    outline: "none"
                  }}
                />
                <button 
                  type="submit"
                  style={{
                    ...localeFontStyle,
                    background: "#22c55e",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontWeight: "bold",
                    fontSize: "11px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    lineHeight: 1.2
                  }}
                >
                  {t?.sellButton || "SELL"} ↵
                </button>
              </form>

              {/* MAIN RIGHT SELL BUTTON */}
              <button onClick={sellCartela} className="btn-primary-neon" style={{ padding: "4px 10px", fontSize: "11px", whiteSpace: "nowrap", lineHeight: 1.2, textTransform: "none" }}>
                ✓ {t?.sell || "SELL SELECTED"}
              </button>
            </div>
            
            {/* CARTELA GRID */}
            <div className="cartela-scroll-grid" style={{ flex: 1, maxHeight: "calc(100vh - 110px)" }}>
              {Array.from({ length: 150 }, (_, i) => i + 1).map(num => {
                const sold = soldCartelas.includes(num);
                const selected = selectedCartela === num;
                
                let cellGlassStyle = {
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                };

                let btnClass = "grid-cell-btn available";

                if (sold) {
                  btnClass = "grid-cell-btn sold";
                  cellGlassStyle = {
                    ...cellGlassStyle,
                    background: "rgba(239, 68, 68, 0.45)",
                    borderColor: "rgba(239, 68, 68, 0.6)",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                    color: "#ffffff"
                  };
                } else if (selected) {
                  btnClass = "grid-cell-btn selected";
                  cellGlassStyle = {
                    ...cellGlassStyle,
                    background: "rgba(56, 189, 248, 0.45)",
                    borderColor: "rgba(56, 189, 248, 0.8)",
                    boxShadow: "0 0 12px rgba(56, 189, 248, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                    color: "#ffffff"
                  };
                }

                return (
                  <button 
                    key={num}
                    onClick={() => {
                      if (sold) {
                        toggleSoldCartela(num);
                      } else {
                        setSelectedCartela(selected ? null : num);
                      }
                    }}
                    className={btnClass}
                    style={cellGlassStyle}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* QR MODAL */}
      {showQrModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 9999
        }}>
          <div style={{
            ...localeFontStyle,
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            color: "#ffffff",
            maxWidth: "320px",
            width: "90%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <h2 style={{ margin: "0 0 4px 0", color: "#38bdf8", fontSize: "16px", lineHeight: 1.3, textTransform: "none" }}>
              📱 {t?.scanToChooseCards || "SCAN TO CHOOSE CARDS"}
            </h2>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px", lineHeight: 1.4 }}>
              {t?.qrInstructions || "Players scan this QR code on their mobile phones to choose 1 or more Cartela numbers (1–150)."}
            </p>

            <div style={{
              background: "#ffffff",
              padding: "12px",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
              <QRCodeCanvas 
                value={playerQrUrl} 
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                style={{ width: "180px", height: "180px", display: "block" }}
              />
            </div>

            <div style={{ marginTop: "10px", fontSize: "10px", color: "#64748b", wordBreak: "break-all" }}>
              {playerQrUrl}
            </div>

            <div style={{ marginTop: "12px", width: "100%" }}>
              <button 
                onClick={() => setShowQrModal(false)} 
                className="btn btn-danger"
                style={{ width: "100%", padding: "8px", cursor: "pointer", fontSize: "12px", lineHeight: 1.2, textTransform: "none" }}
              >
                {t?.close || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}