import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "./CashierDashboard.css";
import { useLanguage } from "../context/LanguageContext";
import { API_URL } from "../config";
import {
  saveGameOffline,
  saveSoldCartelaOffline,
  saveLocalPackage,
  getLocalPackage,
  isOnline,
   syncOfflineGames,
} from "../offline/offlineService";
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
const offlineSyncRunningRef = useRef(false);
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

// ============================================================
// FETCH CASHIER DASHBOARD DATA
// ============================================================

useEffect(() => {
  async function fetchDashboardData() {

    // ==========================================================
    // OFFLINE MODE
    // ==========================================================
    if (!navigator.onLine) {
      console.log("📴 CASHIER DASHBOARD: OFFLINE MODE");

      try {
        // ========================================================
        // 1. LOAD SAVED BET
        // ========================================================
        const savedBet = localStorage.getItem(
          `bet_amount_${id}`
        );

        if (savedBet !== null) {
          const offlineBet = Number(savedBet);

          if (Number.isFinite(offlineBet)) {
            setBet(offlineBet);

            console.log(
              "📴 USING SAVED BET:",
              offlineBet
            );
          }
        }

        // ========================================================
        // 2. LOAD SAVED HOUSE ID
        // ========================================================
        const savedHouseId = localStorage.getItem(
          `cashier_house_id_${id}`
        );

        if (!savedHouseId) {
          console.error(
            "❌ OFFLINE: NO SAVED HOUSE ID FOR CASHIER:",
            id
          );

          return;
        }

        console.log(
          "📴 USING SAVED HOUSE ID:",
          savedHouseId
        );

        // ========================================================
        // 3. LOAD LAST HOUSE COMMISSION
        // ========================================================
        const commissionStorageKey =
          `house_commission_${savedHouseId}`;

        const savedCommission =
          localStorage.getItem(
            commissionStorageKey
          );

        const offlineCommission =
          Number(savedCommission);

        if (
          Number.isFinite(offlineCommission) &&
          offlineCommission >= 0 &&
          offlineCommission <= 100
        ) {
          setCommission(
            offlineCommission
          );

          console.log(
            "📴 USING SAVED HOUSE COMMISSION:",
            `${offlineCommission}%`
          );
        } else {
          console.error(
            "❌ OFFLINE: INVALID SAVED COMMISSION:",
            savedCommission
          );
        }

        // ========================================================
        // 4. LOAD LAST ONLINE PACKAGE
        // ========================================================
        const localPackage =
          await getLocalPackage(
            String(savedHouseId)
          );

        if (!localPackage) {
          console.error(
            "❌ OFFLINE: NO SAVED PACKAGE FOR HOUSE:",
            savedHouseId
          );
        } else {

          // ------------------------------------------------------
          // TOTAL PACKAGE
          // ------------------------------------------------------
          const totalPackage =
            Number(
              localPackage.total_package ??
              localPackage.totalAmount ??
              localPackage.total ??
              0
            );

          // ------------------------------------------------------
          // REMAINING PACKAGE
          // ------------------------------------------------------
          const remainingPackage =
            Number(
              localPackage.remaining_package ??
              localPackage.remainingAmount ??
              localPackage.remainingBalance ??
              localPackage.remaining ??
              0
            );

          // ------------------------------------------------------
          // NORMALIZE PACKAGE
          // ------------------------------------------------------
          const offlinePackage = {
            ...localPackage,

            house_id:
              String(savedHouseId),

            total_package:
              totalPackage,

            totalAmount:
              totalPackage,

            remaining_package:
              remainingPackage,

            remainingAmount:
              remainingPackage,

            remainingBalance:
              remainingPackage,

            remaining:
              remainingPackage,

            synced:
              true,

            offline_created:
              false
          };

          // ------------------------------------------------------
          // LOAD PACKAGE INTO SCREEN
          // ------------------------------------------------------
          setRawPackageInfo(
            offlinePackage
          );

          console.log(
            "📴 OFFLINE PACKAGE LOADED:",
            {
              houseId: savedHouseId,
              total: totalPackage,
              remaining: remainingPackage
            }
          );
        }

                // ========================================================
        // 5. LOAD LOCAL SOLD CARTELAS
        // ========================================================
        let localSoldCartelas = [];

        try {
          // Check if the external function is imported/defined before calling it
          if (typeof getLocalSoldCartelas === "function") {
            localSoldCartelas = await getLocalSoldCartelas(String(savedHouseId));
          } else {
            // Fallback: Safely pull the local tickets straight from localStorage cache
            const fallbackCartelas = localStorage.getItem(`offline_sold_cartelas_${savedHouseId}`);
            if (fallbackCartelas) {
              localSoldCartelas = JSON.parse(fallbackCartelas);
            }
          }
        } catch (dbError) {
          console.warn("⚠️ Local indexedDB check failed, falling back to empty list:", dbError);
        }

        if (Array.isArray(localSoldCartelas)) {
          setSoldCartelas(localSoldCartelas);
          console.log("📴 USING LOCAL SOLD CARTELAS:", localSoldCartelas.length);
        } else {
          setSoldCartelas([]);
          console.log("📴 NO LOCAL SOLD CARTELAS FOUND (FALLBACK APPLIED)");
        }

      } catch (offlineError) {
        console.error(
          "❌ OFFLINE DASHBOARD LOAD FAILED:",
          offlineError
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    // ==========================================================
    // ONLINE MODE
    // ==========================================================
    try {
      const res = await fetch(
        `https://bingo-backend-ccn6.onrender.com/api/cashier-dashboard/${id}`
      );

      if (!res.ok) {
        throw new Error(
          `Dashboard request failed: ${res.status}`
        );
      }

      const data = await res.json();

      console.log(
        "🌐 CASHIER DASHBOARD DATA:",
        data
      );

      // ========================================================
      // 1. BET
      // ========================================================
      const savedBet = localStorage.getItem(
        `bet_amount_${id}`
      );

      if (savedBet !== null) {
        const onlineSavedBet =
          Number(savedBet);

        if (
          Number.isFinite(
            onlineSavedBet
          )
        ) {
          setBet(
            onlineSavedBet
          );

          console.log(
            "💰 USING SAVED BET:",
            onlineSavedBet
          );
        }

      } else if (
        data.bet !== undefined
      ) {
        const apiBet =
          Number(data.bet);

        if (
          Number.isFinite(apiBet)
        ) {
          setBet(apiBet);

          console.log(
            "💰 USING API BET:",
            apiBet
          );
        }
      }

      // ========================================================
      // 2. VOICE
      // ========================================================
      if (data.voiceMode) {
        setVoiceMode(
          data.voiceMode
        );
      }

      // ========================================================
      // 3. SOLD CARTELAS
      // ========================================================
      if (
        Array.isArray(
          data.soldCartelas
        )
      ) {
        setSoldCartelas(
          data.soldCartelas
        );
      }

      // ========================================================
      // 4. CASHIER
      // ========================================================
      if (data.cashier) {
        setCurrentCashier(
          data.cashier
        );
      }

      // ========================================================
      // 5. REAL HOUSE ID
      // ========================================================
      const houseId =
        data.cashier?.house_id;

      if (
        houseId === undefined ||
        houseId === null ||
        String(houseId).trim() === ""
      ) {
        console.error(
          "❌ REAL HOUSE ID IS MISSING:",
          data.cashier
        );

        return;
      }

      const houseIdString =
        String(houseId);

      console.log(
        "🏠 REAL HOUSE ID:",
        houseIdString
      );

      // ========================================================
      // 6. SAVE CASHIER → HOUSE
      // ========================================================
      localStorage.setItem(
        `cashier_house_id_${id}`,
        houseIdString
      );

      // ========================================================
      // 7. ONLINE PACKAGE → SAVE EXACT COPY FOR OFFLINE
      // ========================================================
      if (data.packageInfo) {
        try {
          const packageInfo =
            data.packageInfo;

          // ----------------------------------------------------
          // TOTAL PACKAGE
          // ----------------------------------------------------
          const totalPackage =
            Number(
              packageInfo.total_package ??
              packageInfo.totalAmount ??
              packageInfo.total ??
              0
            );

          // ----------------------------------------------------
          // REMAINING PACKAGE
          // ----------------------------------------------------
          const remainingPackage =
            Number(
              packageInfo.remaining_package ??
              packageInfo.remainingAmount ??
              packageInfo.remainingBalance ??
              packageInfo.remaining ??
              0
            );

          // ----------------------------------------------------
          // EXACT PACKAGE COPY
          // ----------------------------------------------------
          const packageToSave = {
            ...packageInfo,

            house_id:
              houseIdString,

            total_package:
              totalPackage,

            totalAmount:
              totalPackage,

            remaining_package:
              remainingPackage,

            remainingAmount:
              remainingPackage,

            remainingBalance:
              remainingPackage,

            remaining:
              remainingPackage,

            synced:
              true,

            offline_created:
              false,

            updated_at:
              new Date().toISOString()
          };

          // ----------------------------------------------------
          // UPDATE SCREEN
          // ----------------------------------------------------
          setRawPackageInfo(
            packageToSave
          );

          // ----------------------------------------------------
          // IMPORTANT:
          // REPLACE LOCAL PACKAGE WITH
          // THE CURRENT ONLINE SERVER PACKAGE
          // ----------------------------------------------------
          await saveLocalPackage(
            houseIdString,
            packageToSave
          );

          console.log(
            "🌐 ONLINE PACKAGE:",
            {
              houseId:
                houseIdString,
              total:
                totalPackage,
              remaining:
                remainingPackage
            }
          );

          console.log(
            "💾 OFFLINE PACKAGE UPDATED FROM ONLINE:",
            {
              houseId:
                houseIdString,
              total:
                totalPackage,
              remaining:
                remainingPackage
            }
          );

        } catch (packageError) {
          console.error(
            "❌ PACKAGE SAVE ERROR:",
            packageError
          );
        }
      } else {
        console.warn(
          "⚠️ ONLINE RESPONSE HAS NO packageInfo"
        );
      }

      // ========================================================
      // 8. HOUSE COMMISSION
      // ========================================================
      const commissionStorageKey =
        `house_commission_${houseIdString}`;

      try {
        const settingsRes =
          await fetch(
            `https://bingo-backend-ccn6.onrender.com/api/settings/house_commission_${houseIdString}`
          );

        if (settingsRes.ok) {

          const settingsData =
            await settingsRes.json();

          const houseCommission =
            Number(
              settingsData.value
            );

          console.log(
            "🏠 HOUSE COMMISSION FROM DATABASE:",
            houseCommission
          );

          if (
            Number.isFinite(
              houseCommission
            ) &&
            houseCommission >= 0 &&
            houseCommission <= 100
          ) {

            // --------------------------------------------------
            // UPDATE REACT STATE
            // --------------------------------------------------
            setCommission(
              houseCommission
            );

            // --------------------------------------------------
            // SAVE FOR OFFLINE
            // --------------------------------------------------
            localStorage.setItem(
              commissionStorageKey,
              String(
                houseCommission
              )
            );

            console.log(
              "💰 CASHIER COMMISSION UPDATED:",
              `${houseCommission}%`
            );

            console.log(
              "💾 COMMISSION SAVED FOR OFFLINE:",
              `${houseCommission}%`
            );

          } else {
            console.error(
              "❌ INVALID HOUSE COMMISSION:",
              houseCommission
            );
          }

        } else {

          // --------------------------------------------------
          // SERVER DID NOT RETURN COMMISSION
          // USE LAST SAVED COMMISSION
          // --------------------------------------------------
          const savedCommission =
            Number(
              localStorage.getItem(
                commissionStorageKey
              )
            );

          if (
            Number.isFinite(
              savedCommission
            ) &&
            savedCommission >= 0 &&
            savedCommission <= 100
          ) {

            setCommission(
              savedCommission
            );

            console.log(
              "📴 USING LAST SAVED HOUSE COMMISSION:",
              `${savedCommission}%`
            );
          }
        }

      } catch (commissionError) {

        console.error(
          "⚠️ COMMISSION FETCH FAILED:",
          commissionError
        );

        // ------------------------------------------------------
        // FALL BACK TO LAST SAVED COMMISSION
        // ------------------------------------------------------
        const savedCommission =
          Number(
            localStorage.getItem(
              commissionStorageKey
            )
          );

        if (
          Number.isFinite(
            savedCommission
          ) &&
          savedCommission >= 0 &&
          savedCommission <= 100
        ) {

          setCommission(
            savedCommission
          );

          console.log(
            "📴 USING LAST SAVED HOUSE COMMISSION:",
            `${savedCommission}%`
          );
        }
      }

    } catch (err) {

      console.error(
        "❌ ERROR FETCHING DASHBOARD:",
        err
      );

    } finally {
      setLoading(false);
    }
  }

  fetchDashboardData();

}, [id]);


// ============================================================
// COMMISSION / PACKAGE CALCULATIONS
// ============================================================

const activeCommission =
  Number.isFinite(Number(commission))
    ? Number(commission)
    : 0;

const grossIncome =
  Number(bet) *
  (Array.isArray(soldCartelas)
    ? soldCartelas.length
    : 0);

const commissionAmount =
  grossIncome *
  (activeCommission / 100);

const netIncome =
  grossIncome -
  commissionAmount;


// ============================================================
// HOUSE ID
// ============================================================

const houseId =
  currentCashier?.house_id ||
  localStorage.getItem(
    `cashier_house_id_${id}`
  );


// ============================================================
// PACKAGE BALANCE
// ============================================================

const realRemainingPackageAmount =
  Number(
    rawPackageInfo?.remaining_package ??
    rawPackageInfo?.remainingAmount ??
    rawPackageInfo?.remainingBalance ??
    rawPackageInfo?.remaining ??
    0
  );

const totalAmount =
  Number(
    rawPackageInfo?.total_package ??
    rawPackageInfo?.totalAmount ??
    1
  );


// ============================================================
// COMMISSION REQUIRED FOR NEXT GAME
// ============================================================

const upcomingGameCommission =
  grossIncome *
  (activeCommission / 100);


// ============================================================
// CHECK PACKAGE
// ============================================================

const isInsufficientPackage =
  realRemainingPackageAmount <= 0 ||
  realRemainingPackageAmount <
    upcomingGameCommission;


// ============================================================
// PACKAGE PERCENT
// ============================================================

const packagePercent =
  totalAmount > 0
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (realRemainingPackageAmount /
              totalAmount) *
              100
          )
        )
      )
    : 0;
    
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
    console.log("🛑 START GAME ALREADY IN PROGRESS");
    return;
  }

  startingGameRef.current = true;

  console.log("🚀 START GAME LOCKED");

  const startGameStart = performance.now();

  try {
    // =====================================================
    // CHECK CARTELAS
    // =====================================================
    if (!soldCartelas || soldCartelas.length === 0) {
      alert("Sell a cartela first!");
      return;
    }

    // =====================================================
    // CALCULATE MONEY
    // =====================================================
    const gross = Number(grossIncome) || 0;

    const commissionPercent =
      Number(commission) || 0;

    // HOUSE COMMISSION EARNED
    const commissionAmount =
      gross *
      (commissionPercent / 100);

    // CURRENT PACKAGE
    const currentPackage =
      Number(realRemainingPackageAmount) || 0;

    // CASHIER NET INCOME
    const gameNetIncome =
      Number(netIncome) || 0;

    console.log(
      "💰 START GAME MONEY:",
      {
        gross,
        commissionPercent,
        commissionEarned:
          commissionAmount,
        cashierNetIncome:
          gameNetIncome,
        currentPackage,
      }
    );

    // =====================================================
    // CHECK PACKAGE
    //
    // PACKAGE IS REDUCED BY HOUSE COMMISSION EARNED
    // =====================================================
    if (
      currentPackage <
      commissionAmount
    ) {
      alert("Insufficient balance");
      return;
    }

    // =====================================================
    // HOUSE ID
    // =====================================================
    const actualHouseId =
      currentCashier?.house_id ||
      localStorage.getItem(
        `cashier_house_id_${id}`
      );

    if (!actualHouseId) {
      throw new Error(
        "House ID is missing."
      );
    }

    // =====================================================
    // CREATE GAME ID ONCE
    //
    // SAME ID IS USED ONLINE + OFFLINE
    // =====================================================
    const gameId =
      `G-${Date.now()}`;

    const createdAt =
      new Date().toISOString();

    // =====================================================
    // CARTELA STRUCTURE
    // =====================================================
    const structuralSoldCartelas =
      soldCartelas.map((num) => ({
        id: String(num),

        cartela_id:
          String(num),

        matrix:
          generateMockMatrixForId(num),
      }));

    // =====================================================
    // CREATE COMMON GAME OBJECT
    // ONLINE + OFFLINE
    // =====================================================
    const localGame = {
      id:
        String(gameId),

      game_id:
        String(gameId),

      date:
        createdAt,

      created_at:
        createdAt,

      game_date:
        createdAt,

      cashier:
        id,

      cashier_id:
        String(id),

      house:
        String(actualHouseId),

      house_id:
        String(actualHouseId),

      bet:
        Number(bet) || 0,

      grossIncome:
        gross,

      // Cashier's game income
      netIncome:
        gameNetIncome,

      prize:
        gameNetIncome,

      // COMMISSION PERCENTAGE
      commission:
        commissionPercent,

      // ACTUAL HOUSE COMMISSION EARNED
      commissionDeducted:
        commissionAmount,

      // ACTUAL HOUSE COMMISSION EARNED
      house_commission:
        commissionAmount,

      soldCartelas:
        structuralSoldCartelas,

      cardsSold:
        structuralSoldCartelas.length,

      cards_sold:
        structuralSoldCartelas.length,

      selectedPatterns,

      winningPatternCount,

      voiceMode,

      status:
        "Active",
    };

    console.log(
      "🎮 GAME PREPARED:",
      localGame
    );

    // =====================================================
    // CHECK INTERNET
    // =====================================================
    const online =
      navigator.onLine;

    console.log(
      online
        ? "🌐 ONLINE START"
        : "📴 OFFLINE START"
    );

    // =====================================================
    // ONLINE GAME CREATION
    // =====================================================
    if (online) {
      try {
        console.log(
          "☁️ CREATING GAME ON SERVER:",
          gameId
        );

        const controller =
          new AbortController();

        let response;

        try {
          response =
            await fetch(
              `${API_URL}/games`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    game:
                      localGame,

                    cashierId:
                      id,

                    soldCartelas:
                      soldCartelas,
                  }),

                signal:
                  controller.signal,
              }
            );
        } catch (fetchError) {
          console.error(
            "❌ GAME FETCH ERROR:",
            fetchError
          );

          throw fetchError;
        }

        console.log(
          "☁️ SERVER RESPONSE:",
          response.status,
          response.statusText
        );

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            `Backend error ${response.status}: ${errorText}`
          );
        }

        const result =
          await response.json();

        if (
          !result ||
          !result.game
        ) {
          throw new Error(
            "Server did not return a game"
          );
        }

        // =================================================
        // SERVER GAME
        // =================================================
        const savedGame = {
          ...result.game,

          id:
            String(
              result.game.game_id ||
              gameId
            ),

          game_id:
            String(
              result.game.game_id ||
              gameId
            ),

          house_id:
            String(
              result.game.house_id ||
              actualHouseId
            ),

          cashier_id:
            String(
              result.game.cashier_id ||
              id
            ),

          soldCartelas:
            soldCartelas,

          cards_sold:
            Number(
              result.game.cards_sold ??
              result.game.cardsSold ??
              soldCartelas.length
            ),

          cardsSold:
            Number(
              result.game.cards_sold ??
              result.game.cardsSold ??
              soldCartelas.length
            ),

          bet:
            Number(
              result.game.bet ??
              bet ??
              0
            ),

          grossIncome:
            Number(
              result.game.grossIncome ??
              result.game.gross_income ??
              gross
            ),

          // COMMISSION PERCENTAGE
          commission:
            Number(
              result.game.commission ??
              result.game.commission_percent ??
              commissionPercent
            ),

          // ACTUAL COMMISSION EARNED
          commissionDeducted:
            Number(
              result.game.commissionDeducted ??
              result.game.house_commission ??
              commissionAmount
            ),

          // ACTUAL COMMISSION EARNED
          house_commission:
            Number(
              result.game.house_commission ??
              result.game.commissionDeducted ??
              commissionAmount
            ),

          prize:
            Number(
              result.game.prize ??
              gameNetIncome ??
              0
            ),

          netIncome:
            Number(
              result.game.netIncome ??
              result.game.prize ??
              gameNetIncome ??
              0
            ),

          selectedPatterns,

          winningPatternCount,

          voiceMode,

          status:
            result.game.status ||
            "Active",

          created_at:
            result.game.created_at ||
            result.game.date ||
            createdAt,

          game_date:
            result.game.game_date ||
            result.game.created_at ||
            createdAt,

          synced:
            true,

          offline_created:
            false,

          updated_at:
            new Date().toISOString(),
        };

        console.log(
          "✅ SERVER GAME CREATED:",
          savedGame
        );

        // =================================================
        // SAVE ONLINE GAME LOCALLY
        //
        // THIS MAKES ONLINE GAME AVAILABLE OFFLINE
        // =================================================
        await saveGameOffline(
          savedGame
        );

        console.log(
          "💾 ONLINE GAME SAVED LOCALLY:",
          savedGame.game_id
        );

        // =================================================
        // SAVE SOLD CARTELAS LOCALLY
        // =================================================
        for (
          const cartelaId
          of soldCartelas
        ) {
          await saveSoldCartelaOffline({
            game_id:
              String(
                savedGame.game_id
              ),

            cartela_id:
              String(cartelaId),

            house_id:
              String(actualHouseId),

            sold_at:
              savedGame.created_at ||
              createdAt,

            synced:
              true,

            offline_created:
              false,

            updated_at:
              new Date().toISOString(),
          });
        }

        console.log(
          "💾 ONLINE SOLD CARTELAS SAVED LOCALLY"
        );

        // =================================================
        // IMPORTANT
        //
        // DO NOT DO THIS:
        //
        // currentPackage - commissionAmount
        //
        // The SERVER has already processed the online game.
        //
        // Instead, download the CURRENT server package
        // and save that exact balance locally.
        // =================================================

        try {
          console.log(
            "☁️ REFRESHING HOUSE PACKAGE FROM SERVER:",
            actualHouseId
          );

          const packageResponse =
            await fetch(
              `${API_URL}/houses/${actualHouseId}/package`,
              {
                method:
                  "GET",

                headers: {
                  "Content-Type":
                    "application/json",
                },
              }
            );

          if (
            packageResponse.ok
          ) {
            const serverPackage =
              await packageResponse.json();

            console.log(
              "☁️ SERVER PACKAGE:",
              serverPackage
            );

            // -------------------------------------------------
            // SAVE SERVER PACKAGE LOCALLY
            // -------------------------------------------------

            const serverPackageData =
              serverPackage?.package ||
              serverPackage;

            if (
              serverPackageData
            ) {
              const normalizedPackage = {
                ...serverPackageData,

                house_id:
                  String(actualHouseId),

                synced:
                  true,

                offline_created:
                  false,

                updated_at:
                  new Date().toISOString(),
              };

              await saveLocalPackage(
                String(actualHouseId),
                normalizedPackage
              );

              setRawPackageInfo(
                normalizedPackage
              );

              console.log(
                "💾 SERVER PACKAGE SAVED LOCALLY:",
                normalizedPackage
              );
            }

          } else {
            console.warn(
              "⚠️ COULD NOT REFRESH SERVER PACKAGE:",
              packageResponse.status
            );
          }

        } catch (
          packageError
        ) {
          console.warn(
            "⚠️ SERVER PACKAGE REFRESH FAILED:",
            packageError
          );
        }

        // =================================================
        // START ONLINE GAME UI
        // =================================================
        setGameStarted(
          true
        );

        setStartClicked(
          true
        );

        setSoldCartelas(
          []
        );

        localStorage.setItem(
          "logged_in_cashier",
          String(id)
        );

        console.log(
          "🚀 ONLINE GAME STARTED:",
          savedGame.game_id
        );

        navigate(
          `/bingo-game/${savedGame.game_id}`,
          {
            state: {
              game:
                savedGame,

              saving:
                false,

              winningPatternCount:
                winningPatternCount,

              offline:
                false,
            },
          }
        );

        return;

      } catch (
        onlineError
      ) {

        console.warn(
          "⚠️ ONLINE GAME CREATION FAILED:",
          onlineError
        );

        console.warn(
          "📴 USING OFFLINE GAME:",
          gameId
        );

        // Continue into OFFLINE creation.
      }
    }


    // =====================================================
    // OFFLINE GAME CREATION
    // =====================================================

    console.log(
      "📴 CREATING GAME LOCALLY:",
      gameId
    );

    // =====================================================
    // SAVE OFFLINE GAME
    // =====================================================
    await saveGameOffline({
      ...localGame,

      id:
        String(gameId),

      game_id:
        String(gameId),

      house_id:
        String(actualHouseId),

      cashier_id:
        String(id),

      bet:
        Number(bet) || 0,

      grossIncome:
        gross,

      netIncome:
        gameNetIncome,

      prize:
        gameNetIncome,

      // COMMISSION PERCENTAGE
      commission:
        commissionPercent,

      // ACTUAL HOUSE COMMISSION EARNED
      commissionDeducted:
        commissionAmount,

      // ACTUAL HOUSE COMMISSION EARNED
      house_commission:
        commissionAmount,

      soldCartelas:
        structuralSoldCartelas,

      cardsSold:
        structuralSoldCartelas.length,

      cards_sold:
        structuralSoldCartelas.length,

      selectedPatterns,

      winningPatternCount,

      voiceMode,

      date:
        createdAt,

      created_at:
        createdAt,

      game_date:
        createdAt,

      status:
        "Active",

      synced:
        false,

      offline_created:
        true,

      updated_at:
        new Date().toISOString(),
    });

    console.log(
      "💾 OFFLINE GAME SAVED:",
      gameId,
      {
        gross:
          gross,

        commissionPercent:
          commissionPercent,

        commissionEarned:
          commissionAmount,

        cardsSold:
          structuralSoldCartelas.length,
      }
    );


    // =====================================================
    // SAVE OFFLINE SOLD CARTELAS
    // =====================================================
    for (
      const cartela
      of structuralSoldCartelas
    ) {

      await saveSoldCartelaOffline({
        game_id:
          String(gameId),

        cartela_id:
          String(cartela.id),

        house_id:
          String(actualHouseId),

        sold_at:
          createdAt,

        synced:
          false,

        offline_created:
          true,

        updated_at:
          new Date().toISOString(),
      });

      console.log(
        "💾 OFFLINE CARTELA SAVED:",
        cartela.id
      );
    }


    // =====================================================
    // UPDATE OFFLINE PACKAGE
    //
    // OFFLINE GAME HAS NOT BEEN PROCESSED BY SERVER.
    // THEREFORE DEDUCT COMMISSION LOCALLY ONCE.
    // =====================================================

    const packageBeforeGame =
      Number(
        rawPackageInfo?.remaining_package ??
        rawPackageInfo?.remainingAmount ??
        rawPackageInfo?.remainingBalance ??
        rawPackageInfo?.remaining ??
        0
      );

    const packageAfterGame =
      Math.max(
        0,
        packageBeforeGame -
          commissionAmount
      );

    const originalTotalPackage =
      Number(
        rawPackageInfo?.total_package ??
        rawPackageInfo?.totalAmount ??
        rawPackageInfo?.total ??
        0
      );

    const updatedOfflinePackage = {
      ...(rawPackageInfo || {}),

      house_id:
        String(actualHouseId),

      total_package:
        originalTotalPackage,

      totalAmount:
        originalTotalPackage,

      remaining_package:
        packageAfterGame,

      remainingAmount:
        packageAfterGame,

      remainingBalance:
        packageAfterGame,

      remaining:
        packageAfterGame,

      synced:
        false,

      offline_created:
        true,

      updated_at:
        new Date().toISOString(),
    };

    await saveLocalPackage(
      String(actualHouseId),
      updatedOfflinePackage
    );

    setRawPackageInfo(
      updatedOfflinePackage
    );

    console.log(
      "📴 OFFLINE PACKAGE UPDATED:",
      {
        houseId:
          String(actualHouseId),

        totalPackage:
          originalTotalPackage,

        previous:
          packageBeforeGame,

        commissionEarned:
          commissionAmount,

        remaining:
          packageAfterGame,
      }
    );


    // =====================================================
    // START OFFLINE GAME
    // =====================================================
    setGameStarted(
      true
    );

    setStartClicked(
      true
    );

    setSoldCartelas(
      []
    );

    localStorage.setItem(
      "logged_in_cashier",
      String(id)
    );

    console.log(
      "🚀 OFFLINE GAME STARTED:",
      gameId
    );


    // =====================================================
    // GO TO BINGO GAME
    // =====================================================
    navigate(
      `/bingo-game/${gameId}`,
      {
        state: {
          game: {
            ...localGame,

            id:
              String(gameId),

            game_id:
              String(gameId),

            house_id:
              String(actualHouseId),

            cashier_id:
              String(id),

            soldCartelas:
              structuralSoldCartelas,

            cardsSold:
              structuralSoldCartelas.length,

            cards_sold:
              structuralSoldCartelas.length,

            netIncome:
              gameNetIncome,

            prize:
              gameNetIncome,

            commission:
              commissionPercent,

            commissionDeducted:
              commissionAmount,

            house_commission:
              commissionAmount,

            selectedPatterns,

            winningPatternCount,

            voiceMode,

            status:
              "Active",

            date:
              createdAt,

            created_at:
              createdAt,

            game_date:
              createdAt,
          },

          saving:
            false,

          winningPatternCount:
            winningPatternCount,

          offline:
            true,
        },
      }
    );

  } catch (err) {

    console.error(
      "❌ START GAME FAILED:",
      err
    );

    setStartClicked(
      false
    );

    alert(
      `Could not start game:\n${err.message}`
    );

  } finally {

    startingGameRef.current =
      false;

    console.log(
      "🔓 START GAME UNLOCKED"
    );

    console.log(
      "⏱️ START GAME TOTAL:",
      (
        performance.now() -
        startGameStart
      ).toFixed(0),
      "ms"
    );
  }
}

useEffect(() => {
  const syncWhenOnline = async () => {
    // Prevent duplicate syncs
    if (offlineSyncRunningRef.current) {
      console.log(
        "⏳ OFFLINE SYNC ALREADY RUNNING - SKIPPING DUPLICATE"
      );
      return;
    }

    // Must be online before syncing
    if (!navigator.onLine) {
      console.log("📴 OFFLINE - WAITING FOR CONNECTION");
      return;
    }

    offlineSyncRunningRef.current = true;

    console.log("🌐 INTERNET CONNECTION RESTORED");
    console.log("🔄 STARTING OFFLINE SYNC:", {
      cashierId: id,
      houseId: currentCashier?.house_id,
    });

    try {
      const SYNC_API_URL =
        "https://bingo-backend-ccn6.onrender.com/api";

      // ==============================
      // 1. SYNC OFFLINE GAMES
      // ==============================
      const result = await syncOfflineGames({
  apiUrl: SYNC_API_URL,
  cashierId: id,
});

      console.log(
        "✅ OFFLINE SYNC RESULT:",
        result
      );

      // ==============================
      // 2. REFRESH PACKAGE AFTER SYNC
      // ==============================
      if (
        result?.success &&
        currentHouseId
      ) {
        try {
          const packageResponse = await fetch(
            `${SYNC_API_URL}/houses/${currentHouseId}/package`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (packageResponse.ok) {
            const packageResult =
              await packageResponse.json();

            const serverPackage =
              packageResult?.package ||
              packageResult;

            if (serverPackage) {
              const normalizedPackage = {
                ...serverPackage,
                house_id: String(currentHouseId),
                synced: true,
                offline_created: false,
                updated_at:
                  new Date().toISOString(),
              };

              // Save fresh server package locally
              await saveLocalPackage(
                String(currentHouseId),
                normalizedPackage
              );

              // Update React state
              setRawPackageInfo(
                normalizedPackage
              );

              console.log(
                "💰 PACKAGE REFRESHED AFTER SYNC:",
                normalizedPackage
              );
            } else {
              console.warn(
                "⚠️ PACKAGE RESPONSE DID NOT CONTAIN PACKAGE"
              );
            }
          } else {
            console.warn(
              "⚠️ PACKAGE FETCH FAILED:",
              packageResponse.status,
              packageResponse.statusText
            );
          }
        } catch (packageError) {
          console.warn(
            "⚠️ PACKAGE REFRESH AFTER SYNC FAILED:",
            packageError
          );
        }
      }

      console.log(
        "🏁 OFFLINE SYNC PROCESS COMPLETED"
      );
    } catch (syncError) {
      console.error(
        "❌ OFFLINE SYNC ERROR:",
        syncError
      );
    } finally {
      // IMPORTANT:
      // Always release the lock so future
      // online events can trigger another sync.
      offlineSyncRunningRef.current = false;

      console.log(
        "🔓 OFFLINE SYNC LOCK RELEASED"
      );
    }
  };

  // ==========================================
  // SYNC IMMEDIATELY IF ALREADY ONLINE
  // ==========================================
  if (navigator.onLine) {
    syncWhenOnline();
  }

  // ==========================================
  // SYNC WHEN INTERNET COMES BACK
  // ==========================================
  window.addEventListener(
    "online",
    syncWhenOnline
  );

  // ==========================================
  // CLEANUP
  // ==========================================
  return () => {
    window.removeEventListener(
      "online",
      syncWhenOnline
    );
  };
}, [id, currentCashier?.house_id]);
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
                  fontSize: "42px",
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
                <span style={{ fontSize: "60px", fontWeight: "700", color: "#94a3b8", whiteSpace: "nowrap", textTransform: "none" }}>
                  {t?.bet || "መደብ"}:
                </span>
                <span style={{ fontSize: "60px", fontWeight: "800", color: "#ffffff", whiteSpace: "nowrap" }}>መደብ: {bet} ETB</span>
                <div style={{ display: "flex", gap: "4px", marginLeft: "2px" }}>
                  <button 
                    onClick={handleDecreaseBet} 
                    style={{ padding: "1px 5px", fontSize: "45px", fontWeight: "bold", background: "#1e293b", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: "4px", cursor: "pointer" }}
                  >
                    − 5
                  </button>
                  <button 
                    onClick={handleIncreaseBet} 
                    style={{ padding: "1px 5px", fontSize: "45px", fontWeight: "bold", background: "#1e293b", color: "#4ade80", border: "1px solid #14532d", borderRadius: "4px", cursor: "pointer" }}
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
          <div className="header-stats" style={{ margin: "3px 0", fontSize: "40px", display: "flex", gap: "10px", alignItems: "center" }}>
            <div>{t?.cashier || "Cashier"}: <b className="stat-cashier">{id}</b></div>
            <div>{t?.sold || "Sold Cartelas"}: <b className="stat-sold">{soldCartelas.length}</b></div>
            
            <div style={{ 
              background: "rgba(15, 23, 42, 0.8)", 
              padding: "6px 14px", 
              borderRadius: "8px", 
              border: "2px solid #2954d6",
              fontSize: "70px",
              fontWeight: "800",
              boxShadow: "0 0 10px rgba(56, 189, 248, 0.25)"
            }}>
             {<span style={{ fontSize: "70px", fontWeight: "900" }}>{"Gahataa : ደራሽ "}</span>}: <b className="stat-income" style={{ fontSize: "80px", fontWeight: "900", color: "#ffffff", marginLeft: "10px" }}>{netIncome.toFixed(2)} ETB </b>
            </div>     
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: "2px" }}>
            <button onClick={() => setSoldCartelas([])} className="btn btn-danger" style={{ padding: "3px 8px", fontSize: "45px", background: "#2278e1", lineHeight: 1.2, textTransform: "none" }}>
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
                 background: "#e12222",
                padding: "2px 6px",
                fontSize: "50px",
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
            
            <button onClick={() => setShowFinance(!showFinance)} className="btn btn-neutral" style={{ padding: "2px 6px", background: "#2278e1", fontSize: "40px", lineHeight: 1.2, textTransform: "none" }}>
              {t?.finance || "FINANCE"}
            </button>

            <button 
              onClick={() => setShowQrModal(true)} 
              className="btn btn-neutral"
              style={{ background: "#2278e1", color: "#ffffff", fontWeight: "bold", padding: "3px 8px", fontSize: "40px", lineHeight: 1.2, textTransform: "none" }}
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
              <h2 style={{ margin: 0, fontSize: "45px", whiteSpace: "nowrap", lineHeight: 1.3, textTransform: "none" }}>
                {"CARTELA (Filadhaa : ይምረጡ)"}
              </h2>

              {/* INPUT FORM */}
              <form onSubmit={handleKeyboardSubmit} style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1, maxWidth: "400px" }}>
                <input 
                  type="text"
                  placeholder={t?.typeCartelaPlaceholder || "Type # & press Enter..."}
                  value={keyboardInput}
                  onChange={(e) => setKeyboardInput(e.target.value)}
                  style={{
                    ...localeFontStyle,
                    width: "100%",
                    padding: "6px 12px",
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
  color: "#000000",
  fontWeight: "bold",
  fontSize: "30px",       // 👈 NUMBER SIZE
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.2s ease"
};
                let btnClass = "grid-cell-btn available";

                if (sold) {
                  btnClass = "grid-cell-btn sold";
                  cellGlassStyle = {
                    ...cellGlassStyle,
                    background: "rgba(8, 109, 224, 0.97)",
                    border: "1px solid rgba(68, 139, 239, 0.6)",
                    boxShadow: "0 9px 12px rgba(32, 123, 208, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                    color: "#ffffff"
                  };
                } else if (selected) {
                  btnClass = "grid-cell-btn selected";
                  cellGlassStyle = {
                    ...cellGlassStyle,
                    background: "rgba(8, 109, 224, 0.97)",
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
      fontSize: "27px",
      fontWeight: "900",
      cursor: "pointer"
    }}
  >
<span>🏆 የማሸነፊያ ዝጎች / PATTERNOOTA MO'AA /</span> 

    <span 
      style={{ 
        fontSize: "22px", 
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

                fontSize: "22px", 
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