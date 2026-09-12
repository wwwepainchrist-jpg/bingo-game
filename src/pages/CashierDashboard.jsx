import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "./CashierDashboard.css";
import { useLanguage } from "../context/LanguageContext";
import { API_URL } from "../config";

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
  useEffect(() => {

  const saved = localStorage.getItem(
    `bet_amount_${id}`
  );

  if (saved) {

    setBet(Number(saved));

    console.log(
      "💰 LOADED SAVED BET:",
      saved
    );
  }

}, [id]);

  const [commission, setCommission] = useState(15);
  const [voiceMode, setVoiceMode] = useState("speech");

  const [selectedCartela, setSelectedCartela] = useState(null);
  const [keyboardInput, setKeyboardInput] = useState("");
  const [selectedPatterns, setSelectedPatterns] = useState([]);
  const [showFinance, setShowFinance] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
const startingGameRef = useRef(false);
  const [soldCartelas, setSoldCartelas] = useState([]);
  const [currentCashier, setCurrentCashier] = useState({});
  const [rawPackageInfo, setRawPackageInfo] = useState({
    totalAmount: 3642,
    remainingAmount: 1755
  });

  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const [startClicked, setStartClicked] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [winningPatternCount, setWinningPatternCount] = useState(1);
 useEffect(() => {
  const saved = localStorage.getItem(
    `winning_pattern_count_${id}`
  );

  if (saved === "FULL_HOUSE") {
    setWinningPatternCount("FULL_HOUSE");

    console.log(
      "🏆 LOADED SAVED WINNING PATTERN:",
      "FULL_HOUSE"
    );
  } else if (saved) {
    setWinningPatternCount(Number(saved));

    console.log(
      "🏆 LOADED SAVED WINNING PATTERN:",
      saved
    );
  }
}, [id]);
  const [showWinningPattern, setShowWinningPattern] = useState(false);
  const passedGame = location.state?.game;

  // Fetch initial cashier data
useEffect(() => {
  async function fetchDashboardData() {
    try {
      const res = await fetch(
        `https://bingo-backend-ccn6.onrender.com/api/cashier-dashboard/${id}`
      );

      if (res.ok) {
        const data = await res.json();

    const savedBet = localStorage.getItem(
  `bet_amount_${id}`
);

if (savedBet !== null) {

  console.log(
    "💰 USING SAVED BET:",
    savedBet
  );

  setBet(Number(savedBet));

} else if (data.bet !== undefined) {

  console.log(
    "💰 USING API BET:",
    data.bet
  );

  setBet(data.bet);
}
        if (data.voiceMode) {
          setVoiceMode(data.voiceMode);
        }

        if (data.soldCartelas) {
          setSoldCartelas(data.soldCartelas);
        }

        if (data.cashier) {
          setCurrentCashier(data.cashier);
        }

        if (data.packageInfo) {
          setRawPackageInfo(data.packageInfo);
        }

        // Fetch commission for this cashier's house
        const houseId =
          Number(data.cashier?.house_id) || Number(id);

        try {
          const settingsRes = await fetch(
            `https://bingo-backend-ccn6.onrender.com/api/settings/house_commission_${houseId}`
          );

          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();

            console.log(
              "🏠 CASHIER DATABASE COMMISSION:",
              settingsData.value
            );

            if (settingsData.value !== undefined) {
              setCommission(Number(settingsData.value));
            }
          } else {
            console.log(
              "⚠️ Commission request failed:",
              settingsRes.status
            );
          }
        } catch (err) {
          console.error(
            "Error fetching house commission:",
            err
          );
        }
      }
    } catch (err) {
      console.error(
        "Error fetching dashboard data from server:",
        err
      );
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
  
  const upcomingGameCommission = Number(grossIncome) * (Number(commission) / 100);
  const isInsufficientPackage = realRemainingPackageAmount < upcomingGameCommission || realRemainingPackageAmount <= 0;
  
  const packagePercent = Math.min(100, Math.max(0, Math.round((realRemainingPackageAmount / totalAmount) * 100)));

const handleIncreaseBet = async () => {
  const nextBet = bet + 5;

  setBet(nextBet);

  localStorage.setItem(
    `bet_amount_${id}`,
    String(nextBet)
  );

  await updateSetting("bingo_bet", nextBet);
};

const handleDecreaseBet = async () => {
  const nextBet = Math.max(5, bet - 5);

  setBet(nextBet);

  localStorage.setItem(
    `bet_amount_${id}`,
    String(nextBet)
  );

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
async function sellCartela(cartelaNum = null) {
  const cartelaToSell =
    cartelaNum !== null
      ? Number(cartelaNum)
      : Number(selectedCartela);

  if (isNaN(cartelaToSell)) {
    return alert("Select a cartela first!");
  }

  if (soldCartelas.includes(cartelaToSell)) {
    return alert("Already sold!");
  }

  const updated = [...soldCartelas, cartelaToSell];

  setSoldCartelas(updated);

  if (cartelaNum === null) {
    setSelectedCartela(null);
  }
}
  
  const handleKeyboardSubmit = async (e) => {
    e.preventDefault();
    if (!keyboardInput.trim()) return;

    const parsedNums = keyboardInput
      .split(/[\s,]+/)
      .map(n => Number(n.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= 200);

    if (parsedNums.length === 0) {
      alert("Please enter valid cartela number(s) between 1 and 200.");
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
  };

  async function toggleSoldCartela(num) {
    let updated;

    if (soldCartelas.includes(num)) {
      updated = soldCartelas.filter(n => n !== num);
    } else {
      updated = Array.from(
        new Set([...soldCartelas, num])
      ).sort((a, b) => a - b);
    }

    setSoldCartelas(updated);

    if (selectedCartela === num) {
      setSelectedCartela(null);
    }
  }

async function startGame() {
  // =====================================================
  // PREVENT MULTIPLE START CLICKS
  // =====================================================
  if (startingGameRef.current) {
    console.log("🛑 START GAME ALREADY IN PROGRESS - IGNORING CLICK");
    return;
  }

  startingGameRef.current = true;

  console.log("🚀 START GAME LOCKED");

  const startGameStart = performance.now();

  if (soldCartelas.length === 0) {
    startingGameRef.current = false;
    return alert("Sell a cartela first!");
  }

  const commissionAmount =
    Number(grossIncome) * (Number(commission) / 100);

  const remaining_package = realRemainingPackageAmount;

  if (remaining_package < commissionAmount) {
    startingGameRef.current = false;
    return alert("insufficient balance");
  }

  const newRemaining = Math.max(
    0,
    remaining_package - commissionAmount
  );

  const updatedPackage = {
    ...rawPackageInfo,
    remainingAmount: newRemaining,
    remainingBalance: newRemaining,
    remaining: newRemaining,
  };

  setRawPackageInfo(updatedPackage);

  const structuralSoldCartelas = soldCartelas.map((num) => ({
    id: String(num),
    matrix: generateMockMatrixForId(num),
  }));

  localStorage.setItem(
    "logged_in_cashier",
    String(id)
  );

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
    winningPatternCount,
    voiceMode,
  };

  try {
    console.log("💾 SAVING GAME:", game.id);

    const response = await fetch(`${API_URL}/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        game,
        cashierId: id,
        soldCartelas,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Backend error ${response.status}: ${errorText}`
      );
    }

   const result = await response.json();
const savedGame = {
  ...result.game,
  soldCartelas: soldCartelas,
};

console.log(
  "✅ GAME CREATED:",
  savedGame.game_id
);

console.log(
  "🚨 SOLD CARTELAS FOR BINGO:",
  savedGame.soldCartelas
);

    setGameStarted(true);
    setStartClicked(true);
    setSoldCartelas([]);

    console.log(
      "⏱️ START GAME TOTAL:",
      performance.now() - startGameStart,
      "ms"
    );
console.log("🚨 SOLD CARTELAS BEFORE NAVIGATE:", soldCartelas);
console.log("🚨 SAVED GAME:", savedGame);
console.log("🚨 SAVED GAME SOLD CARTELAS:", savedGame?.soldCartelas);
    navigate(`/bingo-game/${savedGame.game_id}`, {
  state: {
    game: savedGame,
    saving: false,
    winningPatternCount: winningPatternCount,
  },
});

  } catch (err) {
    console.error(
      "❌ ERROR STARTING GAME:",
      err
    );

    // Only unlock if game creation failed
    startingGameRef.current = false;
    setStartClicked(false);

    alert(
      `Could not start game:\n${err.message}`
    );
  }
}

  const playerQrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/select-cartela`
      : "http://localhost:5173/select-cartela";

  return (
    <div
      className="dashboard-container"
      style={{
        ...localeFontStyle,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        padding: "4px",
        boxSizing: "border-box"
      }}
    >
      <div
        className="dashboard-wrapper"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: "4px"
        }}
      >
        {/* DASHBOARD HEADER */}
        <div className="dashboard-header" style={{ padding: "4px 8px", marginBottom: "0px" }}>
          <div className="header-top" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <button
                type="button"
             onClick={() => navigate("/")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#00f0ff",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  padding: "0 3px",
                  lineHeight: "1"
                }}
                title="Back to Login"
              >
                ←
              </button>
              <h1 className="header-title" style={{ fontSize: "13px", margin: 0, whiteSpace: "nowrap", lineHeight: 1.3, textTransform: "none" }}>
                {t?.dashboard || "CASHIER DASHBOARD"}
              </h1>
            </div>

            {/* CONTROLS */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end" }}>
              {/* መደብ */}
              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px", 
                padding: "2px 6px", 
                background: "rgba(15, 23, 42, 0.6)", 
                border: "1px solid rgba(255, 255, 255, 0.15)", 
                borderRadius: "6px" 
              }}>
                <span style={{ fontSize: "31px", fontWeight: "700", color: "#94a3b8", whiteSpace: "nowrap", textTransform: "none" }}>
                  {t?.bet || "መደብ"}:
                </span>
                <span style={{ fontSize: "32px", fontWeight: "800", color: "#38bdf8", whiteSpace: "nowrap" }}>መደብ: {bet} ETB</span>
                <div style={{ display: "flex", gap: "4px", marginLeft: "2px" }}>
                  <button 
                    onClick={handleDecreaseBet} 
                    style={{ padding: "1px 5px", fontSize: "19px", fontWeight: "bold", background: "#1e293b", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: "4px", cursor: "pointer" }}
                  >
                    − 5
                  </button>
                  <button 
                    onClick={handleIncreaseBet} 
                    style={{ padding: "1px 5px", fontSize: "19px", fontWeight: "bold", background: "#1e293b", color: "#4ade80", border: "1px solid #14532d", borderRadius: "4px", cursor: "pointer" }}
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
          <div className="header-stats" style={{ margin: "3px 0", fontSize: "22px", display: "flex", gap: "10px", alignItems: "center" }}>
            <div>{t?.cashier || "Cashier"}: <b className="stat-cashier">{id}</b></div>
            <div>{t?.sold || "Sold Cartelas"}: <b className="stat-sold">{soldCartelas.length}</b></div>
            
            <div style={{ 
              background: "rgba(15, 23, 42, 0.8)", 
              padding: "6px 14px", 
              borderRadius: "8px", 
              border: "2px solid #38bdf8",
              fontSize: "12px",
              fontWeight: "800",
              boxShadow: "0 0 10px rgba(56, 189, 248, 0.25)"
            }}>
             {<span style={{ fontSize: "23px", fontWeight: "900" }}>{"Gahataa : ደራሽ "}</span>}: <b className="stat-income" style={{ fontSize: "32px", fontWeight: "900", color: "#38bdf8", marginLeft: "10px" }}>{netIncome.toFixed(2)} ETB </b>
            </div>     
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: "2px" }}>
            <button onClick={() => setSoldCartelas([])} className="btn btn-danger" style={{ padding: "3px 8px", fontSize: "17px", lineHeight: 1.2, textTransform: "none" }}>
              {t?.resetGame || "Reset Game"}
            </button>
            
            <button
             onClick={startGame}
              className="btn btn-success"
            disabled={
  isInsufficientPackage ||
  startingGameRef.current ||
  startClicked
}
              style={{
                opacity: isInsufficientPackage ? 0.4 : 1,
                cursor: isInsufficientPackage ? "not-allowed" : "pointer",
                padding: "2px 6px",
                fontSize: "20px",
                lineHeight: 1.2,
                textTransform: "none",
                backgroundColor: startClicked ? "#dc2626" : undefined,
                borderColor: startClicked ? "#dc2626" : undefined,
              }}
            >
              {isInsufficientPackage
                ? `⛔ ${t?.insufficient || "Insufficient"}`
                : startClicked
                  ? "🔴 STARTED"
                  : (t?.start || "START GAME")}
            </button>
            
            <button onClick={() => setShowFinance(!showFinance)} className="btn btn-neutral" style={{ padding: "2px 6px", fontSize: "17px", lineHeight: 1.2, textTransform: "none" }}>
              {t?.finance || "FINANCE"}
            </button>

            <button 
              onClick={() => setShowQrModal(true)} 
              className="btn btn-neutral"
              style={{ background: "#7c3aed", color: "#ffffff", fontWeight: "bold", padding: "3px 8px", fontSize: "17px", lineHeight: 1.2, textTransform: "none" }}
            >
              📱 {t?.qr || "PLAYER QR CODE"}
            </button>
          </div> 

         {showFinance && (
  <div
    className="finance-panel"
    style={{ padding: "4px", marginTop: "2px" }}
  >
    <div
      className="finance-summary"
      style={{ fontSize: "25px" }}
    >
      Gross: {grossIncome} ETB
    </div>
  </div>
)}
        </div>

        {/* MAIN GRID */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr", flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="right-column" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            
            {/* GRID HEADER WITH INPUT FORM */}
            <div className="grid-header" style={{ marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "25px", whiteSpace: "nowrap", lineHeight: 1.3, textTransform: "none" }}>
                {"CARTELA (Filadhaa : ይምረጡ)"}
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
                    fontSize: "20px",
                    outline: "none"
                  }}
                />
              
              </form>

              {/* MAIN RIGHT SELL BUTTON */}
            
            </div>
            
            {/* CARTELA GRID */}
            <div className="cartela-scroll-grid" style={{ flex: 1, maxHeight: "calc(100vh - 110px)" }}>
              {Array.from({ length: 200 }, (_, i) => i + 1).map(num => {
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
                    border: "1px solid rgba(239, 68, 68, 0.6)",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                    color: "#ffffff"
                  };
                } else if (selected) {
                  btnClass = "grid-cell-btn selected";
                  cellGlassStyle = {
                    ...cellGlassStyle,
                    background: "rgba(56, 189, 248, 0.45)",
                    border: "1px solid rgba(56, 189, 248, 0.8)",
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
  setSelectedCartela(num);

  // Auto-sell on click
  sellCartela(num);
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
{/* WINNING PATTERN REQUIREMENT - SHOW / HIDE */}
<div
  style={{
    marginTop: "8px",
    padding: "0",
    background: "rgba(15, 23, 42, 0.85)",
    border: "1px solid rgba(56, 189, 248, 0.35)",
    borderRadius: "10px",
    boxSizing: "border-box",
    overflow: "hidden"
  }}
>
  {/* SHOW / HIDE BAR */}
  <button
    type="button"
    onClick={() =>
      setShowWinningPattern(!showWinningPattern)
    }
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 10px",
      background: "transparent",
      border: "none",
      color: "#38bdf8",
      fontSize: "19px",
      fontWeight: "900",
      cursor: "pointer"
    }}
  >
<span>🏆 የማሸነፊያ ዝጎች / PATTERNOOTA MO'AA /</span> 

    <span 
      style={{ 
        fontSize: "14px", 
        color: "#ffffff" 
      }} 
    > 
      {showWinningPattern ? "▲" : "▼"} 
    </span> 
  </button> 

  {/* EXPANDED CONTENT */} 
  {showWinningPattern && ( 
    <div 
      style={{ 
        padding: "0 10px 10px 10px" 
      }} 
    > 

      {/* WINNING PATTERN OPTIONS */} 
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(5, 1fr)", 
          gap: "6px", 
          justifyContent: "center" 
        }} 
      > 
        {[ 
          { number: 1, oromo: "TOKKO", amharic: "አንድ" }, 
          { number: 2, oromo: "LAMA", amharic: "ሁለት" }, 
          { number: 3, oromo: "SADII", amharic: "ሶስት" }, 
          { number: 4, oromo: "AFUR", amharic: "አራት" }, 
          { number: 5, oromo: "SHAN", amharic: "አምስት" }, 
          { number: 6, oromo: "JAHA", amharic: "ስድስት" }, 
          { number: 7, oromo: "TORBA", amharic: "ሰባት" }, 
          { number: 8, oromo: "SADDEET", amharic: "ስምንት" }, 
          { number: 9, oromo: "SAGAL", amharic: "ዘጠኝ" }, 
          { number: 10, oromo: "KUDHAN", amharic: "አስር" } 
        ].map(function (item) { 

          const count = item.number; 
          const selected = winningPatternCount === count; 

          return ( 
            <button 
              key={count} 
              type="button" 
              disabled={gameStarted} 

              onClick={() => { 
                if (gameStarted) return; 

                setWinningPatternCount(count); 

                console.log( 
                  `🏆 WINNING PATTERN REQUIREMENT CHANGED TO ${count}` 
                ); 

                localStorage.setItem( 
                  `winning_pattern_count_${id}`, 
                  String(count) 
                ); 
              }} 

              style={{ 
                padding: "7px 3px", 
                borderRadius: "7px", 

                border: selected 
                  ? "2px solid #22d3ee" 
                  : "1px solid #475569", 

                background: selected 
                  ? "#0284c7" 
                  : "#1e293b", 

                color: "#ffffff", 

                fontSize: "9px", 
                fontWeight: "900", 

                cursor: gameStarted 
                  ? "not-allowed" 
                  : "pointer", 

                opacity: gameStarted 
                  ? 0.75 
                  : 1, 

                lineHeight: "1.35" 
              }} 
            > 
              <div> 
                {count}{" "} 
                {count === 1 ? "PATTERN" : "PATTERNS"} 
              </div> 

              <div style={{ fontSize: "8px" }}> 
                {item.oromo} 
              </div> 

              <div style={{ fontSize: "8px" }}> 
                {item.amharic} 
              </div> 
            </button> 
          ); 
        })} 
      </div> 

      {/* FULL HOUSE OPTION BUTTON */} 
      <div style={{ marginTop: "6px" }}> 
        <button 
          type="button" 
          disabled={gameStarted} 
          onClick={() => { 
            if (gameStarted) return; 

            setWinningPatternCount("FULL_HOUSE"); 

            console.log( 
              `🏆 WINNING PATTERN REQUIREMENT CHANGED TO FULL_HOUSE` 
            ); 

            localStorage.setItem( 
              `winning_pattern_count_${id}`, 
              "FULL_HOUSE" 
            ); 
          }} 
          style={{ 
            width: "100%", 
            padding: "8px 5px", 
            borderRadius: "7px", 
            border: winningPatternCount === "FULL_HOUSE" 
              ? "2px solid #22d3ee" 
              : "1px solid #475569", 
            background: winningPatternCount === "FULL_HOUSE" 
              ? "#0284c7" 
              : "#1e293b", 
            color: "#ffffff", 
            fontSize: "10px", 
            fontWeight: "900", 
            cursor: gameStarted ? "not-allowed" : "pointer", 
            opacity: gameStarted ? 0.75 : 1, 
            textAlign: "center" 
          }} 
        > 
          🏠 FULL HOUSE / MANA GUUTUU / ሙሉ ቤት 
        </button> 
      </div> 

      {/* CURRENT SELECTION */} 
      <div 
        style={{ 
          marginTop: "8px", 
          textAlign: "center", 
          color: "#22d3ee", 
          fontSize: "11px", 
          fontWeight: "900" 
        }} 
      > 
        {winningPatternCount === "FULL_HOUSE" ? ( 
          <> 
            🏆 FULL HOUSE SELECTED 
            <br /> 
            🇪🇹 Mana Guutuu 
            <br /> 
            🇪🇹 ሙሉ ቤት 
          </> 
        ) : ( 
          <> 
            🏆 {winningPatternCount} PATTERN 
            {winningPatternCount > 1 ? "S" : ""} SELECTED 
            <br /> 
            🇪🇹 {winningPatternCount === 1 ? "TOKKO" : "PATTERN"} • 
            {winningPatternCount === 2 ? " LAMA" : ""} 
            {winningPatternCount === 3 ? " SADII" : ""} 
            {winningPatternCount === 4 ? " AFUR" : ""} 
            {winningPatternCount === 5 ? " SHAN" : ""} 
            {winningPatternCount === 6 ? " JAHA" : ""} 
            {winningPatternCount === 7 ? " TORBA" : ""} 
            {winningPatternCount === 8 ? " SADDEET" : ""} 
            {winningPatternCount === 9 ? " SAGAL" : ""} 
            {winningPatternCount === 10 ? " KUDHAN" : ""} 
            <br /> 
            🇪🇹 { 
              [ 
                "", 
                "አንድ", 
                "ሁለት", 
                "ሶስት", 
                "አራት", 
                "አምስት", 
                "ስድስት", 
                "ሰባት", 
                "ስምንት", 
                "ዘጠኝ", 
                "አስር" 
              ][winningPatternCount] 
            } 
          </> 
        )} 
      </div> 

      {/* THREE LANGUAGES */} 
      <div 
        style={{ 
          marginTop: "7px", 
          textAlign: "center", 
          color: "#cbd5e1", 
          fontSize: "10px", 
          lineHeight: "1.6" 
        }} 
      > 

        {winningPatternCount === "FULL_HOUSE" && ( 
          <> 
            <div> 
              🇬🇧 Complete FULL HOUSE (All Numbers) = WINNER 
            </div> 

            <div> 
              🇪🇹 Afaan Oromo: Mo'achuuf lakkoofsa hundumaa (Mana Guutuu) guutuu qaba 
            </div> 

            <div> 
              🇪🇹 አማርኛ: ለማሸነፍ ሙሉ ቤቱን (ሁሉንም ቁጥሮች) መሙላት አለበት 
            </div> 
          </> 
        )} 

        {winningPatternCount === 1 && ( 
          <> 
            <div> 
              🇬🇧 Any ONE winning pattern = WINNER 
            </div> 

            <div> 
              🇪🇹 Afaan Oromo: Mo'achuuf patternii TOKKO qofa guutuun ga'a 
            </div> 

            <div> 
              🇪🇹 አማርኛ: ለማሸነፍ አንድ የማሸነፊያ ንድፍ ብቻ መሙላት በቂ ነው 
            </div> 
          </> 
        )} 

        {winningPatternCount === 2 && ( 
          <> 
            <div> 
              🇬🇧 Any TWO different winning patterns = WINNER 
            </div> 

            <div> 
              🇪🇹 Afaan Oromo: Patternoota MO'AA LAMA adda addaa guutuu qaba 
            </div> 

            <div> 
              🇪🇹 አማርኛ: ሁለት የተለያዩ የማሸነፊያ ንድፎችን መሙላት አለበት 
            </div> 
          </> 
        )} 

        {winningPatternCount === 3 && ( 
          <> 
            <div> 
              🇬🇧 Any THREE different winning patterns = WINNER 
            </div> 

            <div> 
              🇪🇹 Afaan Oromo: Patternoota MO'AA SADII adda addaa guutuu qaba 
            </div> 

            <div> 
              🇪🇹 አማርኛ: ሶስት የተለያዩ የማሸነፊያ ንድፎችን መሙላት አለበት 
            </div> 
          </> 
        )} 

        {typeof winningPatternCount === "number" && winningPatternCount >= 4 && ( 
          <> 
            <div> 
              🇬🇧 Complete {winningPatternCount} different winning patterns = WINNER 
            </div> 

            <div> 
              🇪🇹 Afaan Oromo: Patternoota MO'AA {winningPatternCount} adda addaa guutuu qaba 
            </div> 

            <div> 
              🇪🇹 አማርኛ: {winningPatternCount} የተለያዩ የማሸነፊያ ንድፎችን መሙላት አለበት 
            </div> 
          </> 
        )} 

      </div> 

      {/* AVAILABLE PATTERNS */} 
      <div 
        style={{ 
          marginTop: "7px", 
          textAlign: "center", 
          color: "#94a3b8", 
          fontSize: "9px", 
          lineHeight: "1.5" 
        }} 
      > 
        🇬🇧 Four Corners Near Star • Four Corners • Horizontal • Vertical • Diagonal • Full House 

        <br /> 

        🇪🇹 Afaan Oromo: Koona Afur Star bira • Koona Afur • Sarara Horiizontaal • Sarara Vertikaal • Diagonaalii • Mana Guutuu 

        <br /> 

        🇪🇹 አማርኛ: ከኮከቡ አጠገብ አራት ማዕዘኖች • አራት ማዕዘኖች • አግድም • ቁመት • ዲያጎናል • ሙሉ ቤት 
      </div> 

      {/* LOCK STATUS */} 
      {gameStarted && ( 
        <div 
          style={{ 
            marginTop: "8px", 
            padding: "6px", 
            borderRadius: "6px", 
            background: "rgba(34, 197, 94, 0.12)", 
            border: "1px solid rgba(34, 197, 94, 0.35)", 
            textAlign: "center", 
            color: "#86efac", 
            fontSize: "9px", 
            fontWeight: "900" 
          }} 
        > 
          🔒 LOCKED — {winningPatternCount === "FULL_HOUSE" ? "FULL HOUSE" : `${winningPatternCount} PATTERN${winningPatternCount > 1 ? "S" : ""}`} 

          <br /> 

          🇪🇹 Afaan Oromo: 
          Patternichi hanga Cashier jijjiirutti ni tura 

          <br /> 

          🇪🇹 አማርኛ: 
          ይህ ንድፍ ካሺየሩ እስኪቀይረው ድረስ ይቆያል 
        </div> 
      )} 

    </div> 
  )} 
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
                {t?.qrInstructions || "Players scan this QR code on their mobile phones to choose 1 or more Cartela numbers (1–200)."}
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
    </div>
  );
}