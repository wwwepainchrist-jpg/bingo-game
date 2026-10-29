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
  // 🏆 WINNER CARTELA HISTORY
const [winnerHistoryGameId, setWinnerHistoryGameId] = useState(
  () => localStorage.getItem(`winner_history_game_id_${id}`) || ""
);
const [cashierWinnerGroups, setCashierWinnerGroups] = useState([]);
const [loadingWinnerHistory, setLoadingWinnerHistory] = useState(false);
const [winnerHistoryError, setWinnerHistoryError] = useState("");

const loadCashierWinnerHistory = async (gameId) => {
  if (!gameId || !navigator.onLine) {
    setCashierWinnerGroups([]);
    return;
  }

  setLoadingWinnerHistory(true);
  setWinnerHistoryError("");

  try {
    const response = await fetch(
      `${API_URL}/games/${encodeURIComponent(gameId)}/winner-history/scan`
    );

    if (!response.ok) {
      throw new Error(`History request failed (${response.status})`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Could not load winner history");
    }

    setCashierWinnerGroups(
      Array.isArray(data.groups) ? data.groups : []
    );
  } catch (error) {
    console.error("Failed to load cashier winner history:", error);
    setWinnerHistoryError(error.message || "Could not load winner history");
  } finally {
    setLoadingWinnerHistory(false);
  }
};

useEffect(() => {
  const savedGameId = localStorage.getItem(
    `winner_history_game_id_${id}`
  ) || "";

  setWinnerHistoryGameId(savedGameId);

  if (savedGameId) {
    loadCashierWinnerHistory(savedGameId);
  } else {
    setCashierWinnerGroups([]);
  }
}, [id]);

  const [netUnlocked, setNetUnlocked] = useState(false);
const [netPasswordExists, setNetPasswordExists] = useState(false);

const [showNetLogin, setShowNetLogin] = useState(false);
const [showCreateNetPassword, setShowCreateNetPassword] = useState(false);
const [showChangeNetPassword, setShowChangeNetPassword] = useState(false);

const [netPassword, setNetPassword] = useState("");
const [netPasswordConfirm, setNetPasswordConfirm] = useState("");

const [currentNetPassword, setCurrentNetPassword] = useState("");
const [newNetPassword, setNewNetPassword] = useState("");
const [newNetPasswordConfirm, setNewNetPasswordConfirm] = useState("");
const [houseNetIncome, setHouseNetIncome] = useState(0);
const [loadingHouseNet, setLoadingHouseNet] = useState(false);

  const checkNetPasswordStatus = async () => {
  try {
    const response = await fetch(
`${API_URL}/cashiers/cashier-net-password/status/${id}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to check NET password"
      );
    }

    setNetPasswordExists(
      Boolean(data.hasPassword)
    );

    if (data.hasPassword) {
      setShowNetLogin(true);
      setShowCreateNetPassword(false);
    } else {
      setShowCreateNetPassword(true);
      setShowNetLogin(false);
    }

  } catch (error) {
    console.error(
      "❌ NET PASSWORD STATUS ERROR:",
      error
    );

    alert(
      error.message ||
      "Cannot connect to server"
    );
  }
};

// ==========================================
// INTERNET CUT / RESTORED ALERTS
// ==========================================
useEffect(() => {
  const handleOffline = () => {
    alert("⚠️ INTERNET IS CUT!");
  };

  const handleOnline = () => {
    alert("✅ INTERNET IS BACK!");
  };

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("online", handleOnline);
  };
}, []);


const handleCreateNetPassword = async () => {
  if (!netPassword || !netPasswordConfirm) {
    alert("Please enter and confirm the password.");
    return;
  }

  if (netPassword !== netPasswordConfirm) {
    alert("Passwords do not match.");
    return;
  }

  try {
    const response = await fetch(
`${API_URL}/cashiers/cashier-net-password/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cashierId: id,
          password: netPassword,
          confirmPassword: netPasswordConfirm,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to create password"
      );
    }

    setNetPassword("");
    setNetPasswordConfirm("");

    setNetPasswordExists(true);
    setShowCreateNetPassword(false);
    setShowNetLogin(true);

    alert("NET password created successfully.");

  } catch (error) {
    alert(error.message);
  }
};

const handleNetLogin = async () => {
  if (!netPassword) {
    alert("Enter your NET password.");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/cashiers/cashier-net-password/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cashierId: id,
          password: netPassword,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Incorrect password"
      );
    }

    setNetUnlocked(true);
setShowNetLogin(false);
setNetPassword("");

// LOAD THE SAME HOUSE NET USED BY HOUSE DASHBOARD
await loadHouseNetIncome();

  } catch (error) {
    alert(error.message);
  }
};

const handleChangeNetPassword = async () => {
  if (
    !currentNetPassword ||
    !newNetPassword ||
    !newNetPasswordConfirm
  ) {
    alert("Please fill in all password fields.");
    return;
  }

  if (
    newNetPassword !==
    newNetPasswordConfirm
  ) {
    alert("New passwords do not match.");
    return;
  }

  try {
    const response = await fetch(
     `${API_URL}/cashiers/cashier-net-password/change` ,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cashierId: id,
          currentPassword: currentNetPassword,
          newPassword: newNetPassword,
          confirmPassword: newNetPasswordConfirm,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to change password"
      );
    }

    setCurrentNetPassword("");
    setNewNetPassword("");
    setNewNetPasswordConfirm("");

    setShowChangeNetPassword(false);
    setNetUnlocked(false);
    setShowNetLogin(true);

    alert("NET password changed successfully.");

  } catch (error) {
    alert(error.message);
  }
};
const loadHouseNetIncome = async () => {
  try {
    setLoadingHouseNet(true);

    const response = await fetch(`${API_URL}/games`);

    if (!response.ok) {
      throw new Error(`Failed to load games: ${response.status}`);
    }

    const data = await response.json();

    const games = Array.isArray(data)
      ? data
      : Array.isArray(data?.games)
        ? data.games
        : [];

    const actualHouseId =
      currentCashier?.house_id ||
      localStorage.getItem(`cashier_house_id_${id}`);

    const today = new Date().toISOString().slice(0, 10);

    const todayHouseGames = games.filter((game) => {
      const gameHouseId = String(
        game?.house_id ??
        game?.house ??
        ""
      );

      const gameDate = new Date(
        game?.game_date ??
        game?.created_at ??
        game?.date ??
        0
      );

      const gameDateString = Number.isNaN(gameDate.getTime())
        ? ""
        : gameDate.toISOString().slice(0, 10);

      return (
        gameHouseId === String(actualHouseId) &&
        gameDateString === today
      );
    });

    const totalHouseNet = todayHouseGames.reduce(
      (total, game) => {
        const houseEarned = Number(
          game?.house_commission ??
          game?.commission_earned ??
          game?.commissionDeducted ??
          0
        );

        return total + (
          Number.isFinite(houseEarned)
            ? houseEarned
            : 0
        );
      },
      0
    );

    setHouseNetIncome(totalHouseNet);

    console.log(
      "💰 CASHIER HOUSE NET LOADED:",
      {
        houseId: actualHouseId,
        gamesToday: todayHouseGames.length,
        houseNetIncome: totalHouseNet,
      }
    );

  } catch (error) {
    console.error(
      "❌ FAILED TO LOAD CASHIER HOUSE NET:",
      error
    );

    setHouseNetIncome(0);
  } finally {
    setLoadingHouseNet(false);
  }
};

  const [showQrModal, setShowQrModal] = useState(false);
const startingGameRef = useRef(false);
  const [soldCartelas, setSoldCartelas] = useState([]);

/* =====================================================
   CARD VERIFICATION — STATE
===================================================== */

const [showCardVerification, setShowCardVerification] = useState(false);
const [verificationCartelaId, setVerificationCartelaId] = useState("");
const [verificationLoading, setVerificationLoading] = useState(false);
const [verificationResult, setVerificationResult] = useState(null);
const [verificationError, setVerificationError] = useState("");
const [verificationCalledNumbers, setVerificationCalledNumbers] = useState([]);


/* =====================================================
   CARD VERIFICATION — STATE
===================================================== */



/* =====================================================
   HELPERS
===================================================== */

const parseVerificationField = (value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const isValidVerificationMatrix = (matrix) =>
  Array.isArray(matrix) &&
  matrix.length === 5 &&
  matrix.every((row) => Array.isArray(row) && row.length === 5);

const makeVerificationMatrix = (cartela) => {
  if (!cartela) return null;

  let matrix = parseVerificationField(cartela.matrix);
  const numbers = parseVerificationField(cartela.numbers);

  if (isValidVerificationMatrix(matrix)) {
    return matrix;
  }

  const columns = ["B", "I", "N", "G", "O"];

  // Supports B/I/N/G/O arrays directly on the cartela.
  const directColumnsExist = columns.every(
    (letter) =>
      Array.isArray(cartela[letter]) &&
      cartela[letter].length === 5
  );

  // Also supports { numbers: { B: [], I: [], ... } }.
  const nestedColumnsExist = columns.every(
    (letter) =>
      Array.isArray(numbers?.[letter]) &&
      numbers[letter].length === 5
  );

  if (directColumnsExist || nestedColumnsExist) {
    const source = directColumnsExist ? cartela : numbers;

    return Array.from({ length: 5 }, (_, row) =>
      columns.map((letter, col) =>
        row === 2 && col === 2
          ? "FREE"
          : source[letter][row]
      )
    );
  }

  // Supports a flat array containing 25 cells.
  if (Array.isArray(numbers) && numbers.length === 25) {
    return Array.from({ length: 5 }, (_, row) =>
      numbers.slice(row * 5, row * 5 + 5)
    );
  }

  if (isValidVerificationMatrix(numbers)) {
    return numbers;
  }

  return null;
};

/* =====================================================
   VERIFY CARTELA
===================================================== */


/* =====================================================
   VERIFY CARTELA — WITH WINNING PATTERN CELLS
===================================================== */


const verifyCashierCartela = async () => {
  const enteredId = String(verificationCartelaId).trim();

  if (!enteredId) {
    setVerificationError("Please enter a Cartela ID first.");
    setVerificationResult(null);
    return;
  }

  const gameId =
    winnerHistoryGameId ||
    localStorage.getItem(`winner_history_game_id_${id}`);

  if (!gameId) {
    setVerificationError(
      "No game ID found. Start a game before verifying a cartela."
    );
    setVerificationResult(null);
    return;
  }

  if (!navigator.onLine) {
    setVerificationError(
      "Online verification is required. Please reconnect and try again."
    );
    setVerificationResult(null);
    return;
  }

  setVerificationLoading(true);
  setVerificationError("");
  setVerificationResult(null);
  setVerificationCalledNumbers([]);

  try {
    const encodedGameId = encodeURIComponent(gameId);

    // 1. Verify that this cartela was sold in the selected game.
    const verifyResponse = await fetch(
      `${API_URL}/games/${encodedGameId}/verify-cartela`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartelaId: enteredId }),
      }
    );

    const data = await verifyResponse.json();

    if (!verifyResponse.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        `Verification failed (${verifyResponse.status})`
      );
    }

    if (!data || typeof data.sold !== "boolean") {
      throw new Error("Unexpected verification response from the server.");
    }

    if (!data.sold) {
      setVerificationResult({
        sold: false,
        cartelaId: enteredId,
        isWinner: false,
        winOnCallNumber: null,
        winningCells: [],
        winningNumbers: [],
        message: `CARTELA #${enteredId} WAS NOT SOLD IN THIS GAME`,
        cartela: null,
      });
      return;
    }

    // 2. Get the cartela matrix.
    let cartela = data.cartela ?? data.soldCartela ?? null;
    let matrix = makeVerificationMatrix(cartela);

    if (!matrix) {
      const cardsResponse = await fetch(
        `${API_URL}/games/${encodedGameId}/sold-cartelas`
      );

      if (!cardsResponse.ok) {
        throw new Error(
          "Cartela verified, but its numbers could not be loaded."
        );
      }

      const cardsData = await cardsResponse.json();

      const soldCards = Array.isArray(cardsData)
        ? cardsData
        : cardsData?.soldCartelas;

      if (!Array.isArray(soldCards)) {
        throw new Error(
          "The sold-cartelas endpoint did not return a cartela list."
        );
      }

      const matchingCard = soldCards.find((card) => {
        const cardId =
          card?.cartelaId ??
          card?.cartela_id ??
          card?.serial ??
          card?.id;

        return String(cardId ?? "").trim() === enteredId;
      });

      if (matchingCard) {
        cartela = matchingCard;
        matrix = makeVerificationMatrix(cartela);
      }
    }

    if (!matrix) {
      throw new Error(
        "The cartela was verified, but its 5x5 matrix could not be built."
      );
    }

    // 3. Load the current game's calls.
    const gameResponse = await fetch(
      `${API_URL}/games/active/${encodedGameId}`
    );

    if (!gameResponse.ok) {
      throw new Error(
        "Cartela verified, but the called numbers could not be loaded."
      );
    }

    const gameData = await gameResponse.json();

    const normalizeNumber = (value) => {
      if (value === null || value === undefined) return null;

      if (typeof value === "object") {
        value =
          value.number ??
          value.value ??
          value.ball ??
          value.called_number ??
          "";
      }

      const valueText = String(value).trim().toUpperCase();

      if (!valueText || valueText === "FREE") return null;

      const match = valueText.match(/\d+/);
      return match ? Number(match[0]) : null;
    };

    const rawCalls =
      gameData.calledNumbers ??
      gameData.called_numbers ??
      gameData.called ??
      [];

    const calledNumbers = Array.isArray(rawCalls)
      ? rawCalls
      : [];

    setVerificationCalledNumbers(calledNumbers);

    const calledSet = new Set(
      calledNumbers
        .map(normalizeNumber)
        .filter((number) => number !== null)
    );

    // 4. Identify FREE and called cells.
    const isFreeCell = (row, col) => {
      const value = matrix[row][col];

      const cellValue =
        value && typeof value === "object"
          ? value.number ?? value.value ?? ""
          : value;

      return (
        (row === 2 && col === 2) ||
        String(cellValue).trim().toUpperCase() === "FREE"
      );
    };

    const cellIsCalled = (row, col, numbersSet = calledSet) => {
      if (isFreeCell(row, col)) return true;

      const value = matrix[row][col];

      const cellValue =
        value && typeof value === "object"
          ? value.number ?? value.value ?? ""
          : value;

      const number = normalizeNumber(cellValue);

      return number !== null && numbersSet.has(number);
    };

    // 5. Define the supported patterns in game pattern order.
    const patterns = [];

    for (let row = 0; row < 5; row++) {
      patterns.push({
        name: `ROW_${row + 1}`,
        cells: Array.from({ length: 5 }, (_, col) => [row, col]),
      });
    }

    for (let col = 0; col < 5; col++) {
      patterns.push({
        name: `COLUMN_${col + 1}`,
        cells: Array.from({ length: 5 }, (_, row) => [row, col]),
      });
    }

    patterns.push({
      name: "DIAGONAL_1",
      cells: Array.from({ length: 5 }, (_, i) => [i, i]),
    });

    patterns.push({
      name: "DIAGONAL_2",
      cells: Array.from({ length: 5 }, (_, i) => [i, 4 - i]),
    });

    patterns.push({
      name: "FOUR_CORNERS",
      cells: [
        [0, 0],
        [0, 4],
        [4, 0],
        [4, 4],
      ],
    });

    patterns.push({
      name: "FOUR_CORNERS_NEAR_STAR",
      cells: [
        [1, 1],
        [1, 3],
        [3, 1],
        [3, 3],
      ],
    });

    const completedPatterns = patterns.filter((pattern) =>
      pattern.cells.every(([row, col]) => cellIsCalled(row, col))
    );

    const isFullHouse = matrix.every((row, rowIndex) =>
      row.every((_, colIndex) =>
        cellIsCalled(rowIndex, colIndex)
      )
    );

    // 6. Read the game's configured winning rule.
    const winningPatternCount =
      gameData.winning_pattern_count ??
      gameData.winningPatternCount ??
      data.winning_pattern_count ??
      data.winningPatternCount ??
      1;

    const fullHouseTarget =
      String(winningPatternCount).toUpperCase() === "FULL_HOUSE";

    const targetCount = Math.max(
      1,
      Number(winningPatternCount) || 1
    );

    const serverSaysWinner = Boolean(data.isWinner);

    // 7. Retrieve the recorded call number from Winner Cartela History.
    // The backend groups each winner under its original callCount.
    let winOnCallNumber = null;
    let recordedWinningPattern = null;

    try {
      const historyResponse = await fetch(
        `${API_URL}/games/${encodedGameId}/winner-history/scan`
      );

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();

        if (historyData?.success && Array.isArray(historyData.groups)) {
          for (const group of historyData.groups) {
            const matchingWinner = (group.cartelas || []).find(
              (winner) =>
                String(winner.id ?? "").trim() === enteredId
            );

            if (matchingWinner) {
              const callCount = Number(group.callCount);

              if (Number.isInteger(callCount) && callCount > 0) {
                winOnCallNumber = callCount;
                recordedWinningPattern = matchingWinner.pattern ?? null;
              }

              break;
            }
          }
        }
      }
    } catch (historyError) {
      console.warn(
        "Could not retrieve recorded winner call number:",
        historyError
      );
    }

    // 8. Accept both backend winning-cell formats:
    // "1-1" and [1, 1].
    const parseWinningCell = (position) => {
      let row;
      let col;

      if (typeof position === "string") {
        const match = position.match(/^(\d)-(\d)$/);
        if (!match) return null;

        row = Number(match[1]);
        col = Number(match[2]);
      } else if (Array.isArray(position) && position.length >= 2) {
        row = Number(position[0]);
        col = Number(position[1]);
      } else {
        return null;
      }

      if (
        !Number.isInteger(row) ||
        !Number.isInteger(col) ||
        row < 0 || row > 4 ||
        col < 0 || col > 4
      ) {
        return null;
      }

      return [row, col];
    };

    let winningCells = Array.isArray(data.winningCells)
      ? data.winningCells.map(parseWinningCell).filter(Boolean)
      : [];

    let winningNumbers = Array.isArray(data.winningNumbers)
      ? data.winningNumbers
          .map(normalizeNumber)
          .filter((number) => number !== null)
      : [];

    // 9. If the backend did not return exact winning cells,
    // use the recorded winning pattern when available.
    if (winningCells.length === 0) {
      const patternNames = String(recordedWinningPattern || "")
        .toUpperCase()
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);

      if (
        data.isFullHouse ||
        (fullHouseTarget && isFullHouse) ||
        patternNames.includes("FULL_HOUSE")
      ) {
        winningCells = matrix.flatMap((row, rowIndex) =>
          row.flatMap((_, colIndex) =>
            isFreeCell(rowIndex, colIndex)
              ? []
              : [[rowIndex, colIndex]]
          )
        );
      } else if (serverSaysWinner) {
        const selectedPatterns = patternNames.length
          ? patterns.filter((pattern) =>
              patternNames.includes(pattern.name)
            )
          : completedPatterns.slice(0, targetCount);

        winningCells = selectedPatterns.flatMap(
          (pattern) => pattern.cells
        );
      }
    }

    // Remove duplicate cells.
    winningCells = [
      ...new Map(
        winningCells.map(([row, col]) => [
          `${row}-${col}`,
          [row, col],
        ])
      ).values(),
    ];

    if (winningNumbers.length === 0) {
      winningNumbers = winningCells
        .filter(([row, col]) => !isFreeCell(row, col))
        .map(([row, col]) => {
          const value = matrix[row][col];

          const cellValue =
            value && typeof value === "object"
              ? value.number ?? value.value ?? ""
              : value;

          return normalizeNumber(cellValue);
        })
        .filter((number) => number !== null);
    }

    // 10. Use a fallback calculation only if history has no saved call.
    // Do not overwrite a call number already saved in winner history.
    if (serverSaysWinner && winOnCallNumber === null) {
      const requiresFullHouse =
        fullHouseTarget || Boolean(data.isFullHouse);

      for (let callIndex = 0; callIndex < calledNumbers.length; callIndex++) {
        const callsAtMoment = new Set(
          calledNumbers
            .slice(0, callIndex + 1)
            .map(normalizeNumber)
            .filter((number) => number !== null)
        );

        const completedAtMoment = patterns.filter((pattern) =>
          pattern.cells.every(([row, col]) =>
            cellIsCalled(row, col, callsAtMoment)
          )
        );

        const fullHouseAtMoment = matrix.every((row, rowIndex) =>
          row.every((_, colIndex) =>
            cellIsCalled(rowIndex, colIndex, callsAtMoment)
          )
        );

        const becameWinner = requiresFullHouse
          ? fullHouseAtMoment
          : completedAtMoment.length >= targetCount;

        if (becameWinner) {
          winOnCallNumber = callIndex + 1;
          break;
        }
      }
    }

    // 11. Return the verification result for the existing popup.
    setVerificationResult({
      ...data,
      sold: true,
      cartela,
      matrix,
      cartelaId: enteredId,
      calledNumbers,
      winningCells,
      winningNumbers,
      winOnCallNumber,
      recordedWinningPattern,
      isWinner: serverSaysWinner,
      isFullHouse: Boolean(data.isFullHouse),
      isFourCorners: Boolean(data.isFourCorners),
      message: serverSaysWinner
        ? data.isFullHouse
          ? "FULL HOUSE — WINNER!"
          : data.isFourCorners
            ? "FOUR CORNERS — WINNER!"
            : "BINGO — WINNER!"
        : "NOT A WINNER",
    });
  } catch (error) {
    console.error("Cashier cartela verification failed:", error);

    setVerificationError(
      error.message || "Verification failed. Please try again."
    );
  } finally {
    setVerificationLoading(false);
  }
};


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

  // HOUSE DASHBOARD NET
// NET = HOUSE COMMISSION EARNED



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
  console.log("🚨 NEW CASHIER STARTGAME CODE IS RUNNING");

  const startTiming = performance.now();

console.log(
  "⏱️ START TIMING → START GAME"
);
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
      gross * (commissionPercent / 100);

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
    // =====================================================
    const gameId =
      `G-${Date.now()}`;

    const createdAt =
      new Date().toISOString();

    // =====================================================
    // STRUCTURAL SOLD CARTELAS
    //
    // IMPORTANT:
    // These IDs are sent to the backend.
    //
    // DO NOT generate a fake matrix here.
    //
    // The real authenticated numbers/matrix will be
    // downloaded from the backend AFTER the game is created.
    // =====================================================
    const structuralSoldCartelas =
      soldCartelas.map((num) => ({
        id: String(num),

        cartela_id:
          String(num),
      }));

    console.log(
      "🎫 SOLD CARTELA IDS SENT TO GAME:",
      structuralSoldCartelas
    );

    console.log(
      "🎯 CARTELA COUNT:",
      structuralSoldCartelas.length
    );

    console.log(
      "🏆 WINNING PATTERN COUNT:",
      winningPatternCount
    );

    // =====================================================
    // CREATE COMMON GAME OBJECT
    // ONLINE + OFFLINE
    //
    // NOTE:
    // For a completely offline start, this object still
    // contains only the structural cartela IDs.
    //
    // For an ONLINE start, we replace soldCartelas with
    // the authentic backend snapshot before saving locally.
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
   // =====================================================
// CHECK INTERNET — ONLINE START ONLY
// =====================================================
const online = navigator.onLine;

if (!online) {
  alert("⚠️ Internet connection is required to start a game.");
  return;
}

console.log("🌐 ONLINE START");

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

          const createGameStart =
  performance.now();

console.log(
  "⏱️ START TIMING → POST /games"
);
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

console.log(
  "⏱️ POST /games:",
  (
    performance.now() -
    createGameStart
  ).toFixed(0),
  "ms"
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
        // 🔐 LOAD AUTHENTIC SOLD CARTELAS
        //
        // THIS IS THE IMPORTANT FIX.
        //
        // The backend now gives us the exact B/I/N/G/O
        // numbers belonging to the sold cartelas.
        //
        // These exact numbers are what BingoGame's
        // offline verifier will later use.
        // =================================================
       console.log(
  "🔐 LOADING AUTHENTIC SOLD CARTELAS:",
  gameId
);

const authenticCartelaStart =
  performance.now();

console.log(
  "⏱️ START TIMING → GET AUTHENTIC CARTELAS"
);

const authenticCartelaResponse =
  await fetch(
    `${API_URL}/games/${encodeURIComponent(gameId)}/sold-cartelas`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

console.log(
  "⏱️ GET AUTHENTIC CARTELAS:",
  (
    performance.now() -
    authenticCartelaStart
  ).toFixed(0),
  "ms"
);
        console.log(
          "🔐 AUTHENTIC CARTELA RESPONSE:",
          authenticCartelaResponse.status,
          authenticCartelaResponse.statusText
        );

        if (
          !authenticCartelaResponse.ok
        ) {
          const errorText =
            await authenticCartelaResponse.text();

          throw new Error(
            `Could not load authentic sold cartelas: HTTP ${authenticCartelaResponse.status} ${errorText}`
          );
        }

        const authenticCartelaData =
          await authenticCartelaResponse.json();

        if (
          !authenticCartelaData ||
          !authenticCartelaData.success
        ) {
          throw new Error(
            authenticCartelaData?.error ||
            "Backend did not return authentic sold cartelas"
          );
        }

        const backendSoldCartelas =
          Array.isArray(
            authenticCartelaData.soldCartelas
          )
            ? authenticCartelaData.soldCartelas
            : [];

        if (
          backendSoldCartelas.length === 0
        ) {
          throw new Error(
            "Backend returned ZERO authentic sold cartelas"
          );
        }

        console.log(
          "✅ AUTHENTIC SOLD CARTELAS RECEIVED:",
          backendSoldCartelas.length
        );

        console.table(
          backendSoldCartelas.map(
            (card) => ({
              id:
                card?.id,

              cartela_id:
                card?.cartela_id,

              serial:
                card?.serial,

              hasNumbers:
                !!card?.numbers,

              B:
                card?.numbers?.B?.join(",") ||
                "",

              I:
                card?.numbers?.I?.join(",") ||
                "",

              N:
                card?.numbers?.N?.join(",") ||
                "",

              G:
                card?.numbers?.G?.join(",") ||
                "",

              O:
                card?.numbers?.O?.join(",") ||
                "",
            })
          )
        );

        // =================================================
        // 🔐 BUILD EXACT OFFLINE CARTELA SNAPSHOT
        //
        // IMPORTANT:
        // Keep BOTH:
        //
        // 1. numbers
        // 2. matrix
        //
        // BingoGame can use either one.
        // =================================================
        const authenticSoldCartelas =
          backendSoldCartelas.map(
            (card) => {
              let numbers =
                card?.numbers;

              // Backend may return numbers as JSON string
              if (
                typeof numbers ===
                "string"
              ) {
                try {
                  numbers =
                    JSON.parse(
                      numbers
                    );
                } catch (
                  parseError
                ) {
                  console.error(
                    "❌ INVALID AUTHENTIC CARTELA NUMBERS:",
                    card,
                    parseError
                  );

                  throw new Error(
                    `Invalid numbers data for cartela ${card?.id ?? card?.cartela_id}`
                  );
                }
              }

              if (
                !numbers ||
                !Array.isArray(numbers.B) ||
                !Array.isArray(numbers.I) ||
                !Array.isArray(numbers.N) ||
                !Array.isArray(numbers.G) ||
                !Array.isArray(numbers.O)
              ) {
                throw new Error(
                  `Authentic cartela ${card?.id ?? card?.cartela_id} does not contain valid B/I/N/G/O numbers`
                );
              }

              if (
                numbers.B.length !== 5 ||
                numbers.I.length !== 5 ||
                numbers.N.length !== 5 ||
                numbers.G.length !== 5 ||
                numbers.O.length !== 5
              ) {
                throw new Error(
                  `Authentic cartela ${card?.id ?? card?.cartela_id} does not contain 5 numbers in every column`
                );
              }

              const letters =
                [
                  "B",
                  "I",
                  "N",
                  "G",
                  "O",
                ];

              const matrix = [];

              for (
                let row = 0;
                row < 5;
                row++
              ) {
                const boardRow = [];

                for (
                  let col = 0;
                  col < 5;
                  col++
                ) {
                  const letter =
                    letters[col];

                  if (
                    row === 2 &&
                    col === 2
                  ) {
                    boardRow.push(
                      "FREE"
                    );
                  } else {
                    boardRow.push(
                      numbers?.[
                        letter
                      ]?.[row] ??
                        null
                    );
                  }
                }

                matrix.push(
                  boardRow
                );
              }

              return {
                ...card,

                id:
                  String(
                    card?.id ??
                    card?.cartela_id ??
                    card?.cartelaId ??
                    ""
                  ),

                cartela_id:
                  String(
                    card?.cartela_id ??
                    card?.id ??
                    card?.cartelaId ??
                    ""
                  ),

                numbers,

                matrix,
              };
            }
          );

        // =================================================
        // 🔐 VERIFY THE BACKEND RETURNED THE SAME CARTELAS
        // THAT WERE SOLD
        // =================================================
        const soldIdSet =
          new Set(
            soldCartelas.map(
              (value) =>
                String(value)
            )
          );

        const authenticIdSet =
          new Set(
            authenticSoldCartelas.map(
              (card) =>
                String(
                  card?.cartela_id ??
                  card?.id ??
                  ""
                )
            )
          );

        const missingAuthenticCartelas =
          soldCartelas.filter(
            (value) =>
              !authenticIdSet.has(
                String(value)
              )
          );

        if (
          missingAuthenticCartelas.length >
          0
        ) {
          throw new Error(
            `Backend authentic cartela response is missing sold cartelas: ${missingAuthenticCartelas.join(", ")}`
          );
        }

        const unexpectedAuthenticCartelas =
          authenticSoldCartelas.filter(
            (card) =>
              !soldIdSet.has(
                String(
                  card?.cartela_id ??
                  card?.id ??
                  ""
                )
              )
          );

        if (
          unexpectedAuthenticCartelas.length >
          0
        ) {
          console.warn(
            "⚠️ BACKEND RETURNED ADDITIONAL AUTHENTIC CARTELAS:",
            unexpectedAuthenticCartelas.map(
              (card) =>
                card?.cartela_id ??
                card?.id
            )
          );
        }

        console.log(
          "🔐 AUTHENTIC CARTELA SNAPSHOT LOCKED:",
          authenticSoldCartelas.map(
            (card) => ({
              id:
                card.id,

              cartela_id:
                card.cartela_id,

              matrix:
                card.matrix,
            })
          )
        );

        // =================================================
        // SERVER GAME
        //
        // IMPORTANT:
        // soldCartelas is now the AUTHENTIC snapshot.
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

          // 🔐 EXACT AUTHENTIC CARTELAS
          soldCartelas:
            authenticSoldCartelas,

          cards_sold:
            Number(
              result.game.cards_sold ??
              result.game.cardsSold ??
              authenticSoldCartelas.length
            ),

          cardsSold:
            Number(
              result.game.cards_sold ??
              result.game.cardsSold ??
              authenticSoldCartelas.length
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

        console.log(
          "🔐 SAVING AUTHENTIC CARTELAS LOCALLY:",
          savedGame.soldCartelas
        );

        // =================================================
        // SAVE ONLINE GAME LOCALLY
        //
        // THIS IS CRITICAL.
        //
        // If internet disappears later, BingoGame will
        // read this exact authentic snapshot from IndexedDB.
        // =================================================
        const saveGameStart =
  performance.now();

await saveGameOffline(
  savedGame
);

console.log(
  "⏱️ SAVE GAME LOCAL:",
  (
    performance.now() -
    saveGameStart
  ).toFixed(0),
  "ms"
);

        console.log(
          "💾 ONLINE GAME SAVED LOCALLY:",
          savedGame.game_id
        );

        // =================================================
        // SAVE SOLD CARTELAS LOCALLY
        // =================================================
       const saveCartelasStart =
  performance.now();

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
  "⏱️ SAVE SOLD CARTELAS LOCAL:",
  (
    performance.now() -
    saveCartelasStart
  ).toFixed(0),
  "ms"
);
        console.log(
          "💾 ONLINE SOLD CARTELAS SAVED LOCALLY"
        );

        // =====================================================
// 🚀 START ONLINE GAME IMMEDIATELY
// =====================================================

setGameStarted(true);

setStartClicked(true);

setSoldCartelas([]);

localStorage.setItem(
  "logged_in_cashier",
  String(id)
);


// 🏆 Remember which game's winner history to display
localStorage.setItem(
  `winner_history_game_id_${id}`,
  String(savedGame.game_id)
);

setWinnerHistoryGameId(String(savedGame.game_id));
setCashierWinnerGroups([]);

console.log(
  "🚀 ONLINE GAME STARTED IMMEDIATELY:",
  savedGame.game_id
);

// =====================================================
// 🚀 GO TO BINGO GAME NOW
// =====================================================
console.log(
  "⏱️ TOTAL BEFORE NAVIGATION:",
  (
    performance.now() -
    startTiming
  ).toFixed(0),
  "ms"
);
navigate(
  `/bingo-game/${savedGame.game_id}`,
  {
    state: {
      game: savedGame,

      saving: false,

      winningPatternCount:
        winningPatternCount,

      offline: false,
    },
  }
);

// =====================================================
// ☁️ REFRESH HOUSE PACKAGE IN BACKGROUND
// =====================================================

(async () => {
  try {
    console.log(
      "☁️ BACKGROUND PACKAGE REFRESH:",
      actualHouseId
    );

    const packageResponse =
      await fetch(
        `${API_URL}/houses/${actualHouseId}/package`,
        {
          method: "GET",

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
      "⚠️ BACKGROUND PACKAGE REFRESH FAILED:",
      packageError
    );
  }
})();

return;

} catch (onlineError) {
  console.error(
    "❌ ONLINE GAME CREATION FAILED:",
    onlineError
  );

  throw new Error(
    `Could not start the game online. ${
      onlineError?.message ||
      "Please check your internet and try again."
    }`
  );
}
    }

    // =====================================================
    // OFFLINE GAME CREATION
    //
    // IMPORTANT:
    // This path is only for a game that could not be
    // created on the server.
    //
    // We cannot download authentic numbers from the backend
    // because the backend game does not exist/was not created.
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
            <div style={{ display: "flex", alignItems: "center", gap: "2800px" }}>
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
              }}></div>

            
  
          
                <span style={{ fontSize: "60px", fontWeight: "700", color: "#94a3b8", whiteSpace: "nowrap", textTransform: "none" }}>
                  {t?.bet || "መደብ"}:
                </span>
                <span style={{ fontSize: "66px", fontWeight: "800", color: "#ffffff", whiteSpace: "nowrap" }}>መደብ: {bet} ETB</span>
                <div style={{ display: "flex", gap: "6px", marginLeft: "2px" }}>
                 <button
  onClick={handleDecreaseBet}
  style={{
    padding: "0px 10px",
    fontSize: "55px",
    fontWeight: "bold",
    lineHeight: "1",
    height: "57px",
    background: "#1e293b",
    color: "#f87171",
    border: "1px solid #7f1d1d",
    borderRadius: "4px",
    cursor: "pointer",
  }}
>
  -5
</button>

<button
  onClick={handleIncreaseBet}
  style={{
    padding: "3px 10px",
    fontSize: "55px",
    fontWeight: "bold",
    lineHeight: "1",
    height: "57px",
    background: "#1e293b",
    color: "#4ade80",
    border: "1px solid #14532d",
    borderRadius: "4px",
    cursor: "pointer",
  }}
>
  +5
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
            <div></div>
           
          </div>


          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '48px', marginTop: "2px" }}>

{/* SHOW / HIDE BAR */}
  <button
    type="button"
    onClick={() =>
      setShowWinningPattern(!showWinningPattern)
    }
    style={{
      width: "10%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "9px 12px",
      background: "transparent",
      border: "none",
      color: "#38bdf8",
      fontSize: "37px",
      fontWeight: "900",
      cursor: "pointer"
    }}
  >
<span>🏆 የማሸነፊያ ዝጎች / PATTERNOOTA MO'AA</span> 

    <span 
      style={{ 
        fontSize: "35px", 
        color: "#de0c0c" 
      }} 
    > 
      {showWinningPattern ? "▲" : "▼"} 
    </span> 
  </button> 

        <button
  onClick={() => {
    setSoldCartelas([]);
    setSelectedCartela(null);
  }}
  className="btn btn-danger"
  style={{
    padding: "3px 8px",
    fontSize: "45px",
    background: "#2278e1",
    lineHeight: 1.2,
    textTransform: "none",
  }}
>
  {t?.resetGame || "Reset Game"}
</button>
            
         
<button
  onClick={() => {
    if (startingGameRef.current || startClicked || isInsufficientPackage) {
      return;
    }

    startGame();
  }}
  className="btn btn-success"
  disabled={
    isInsufficientPackage ||
    startingGameRef.current ||
    startClicked
  }
  style={{
    opacity: isInsufficientPackage ? 0.4 : 1,
    cursor:
      isInsufficientPackage || startingGameRef.current || startClicked
        ? "not-allowed"
        : "pointer",
    background: "#e12222",
    padding: "2px 6px",
    fontSize: "60px",
    lineHeight: 1.2,
    textTransform: "none",
    backgroundColor: startClicked ? "#dc2626" : undefined,
    borderColor: startClicked ? "#dc2626" : undefined,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
  }}
>
  {isInsufficientPackage ? (
    `⛔ ${t?.insufficient || "Insufficient"}`
  ) : startClicked ? (
    <>
      <span
        style={{
          width: "36px",
          height: "36px",
          border: "5px solid rgba(255,255,255,0.35)",
          borderTopColor: "#ffffff",
          borderRadius: "50%",
          display: "inline-block",
          animation: "bingoStartSpin 0.8s linear infinite",
          flexShrink: 0,
        }}
      />
      STARTING GAME...
    </>
  ) : (
    t?.start || "START GAME"
  )}
</button>

            
            <button onClick={() => setShowFinance(!showFinance)} className="btn btn-neutral" style={{ padding: "22px 26px", background: "#ec0c0c", fontSize: "40px", lineHeight: 1.2, textTransform: "none" }}>
             
            </button>

            <button 
              onClick={() => setShowQrModal(true)} 
              className="btn btn-neutral"
              style={{ background: "#2278e1", color: "#ffffff", fontWeight: "bold", padding: "3px 8px", fontSize: "40px", lineHeight: 1.2, textTransform: "none" }}
            >
             
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


{/* =====================================================
    CARD VERIFICATION BUTTON
===================================================== */}
<button
  type="button"
  onClick={() => {
    setShowCardVerification(true);
    setVerificationError("");
    setVerificationResult(null);
  }}
  style={{
    padding: "10px 16px",
    background: "#087fba",
    color: "#fff",
    border: "1px solid #22d3ee",
     fontSize: "32px",
    borderRadius: "6px",
    fontWeight: 800,
    cursor: "pointer",
  }}
>
  🔎 CARD VERIFICATION
</button>

{/* =====================================================
    CARD ID INPUT MODAL
===================================================== */}
{showCardVerification && (
  <div
    onClick={(event) => {
      if (event.target === event.currentTarget) {
        setShowCardVerification(false);
      }
    }}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 15000,
      background: "rgba(0,0,0,0.78)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
       fontSize: "62px",
      padding: 12,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        width: "min(440px, 96vw)",
        background: "#080f1e",
        border: "1px solid #087fba",
        borderRadius: 7,
 fontSize: "62px",

        padding: 12,
        color: "#fff",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <strong style={{ color: "#67e8f9", fontSize: 16 }}>
          🔎 CARD VERIFICATION
        </strong>

        <button
          type="button"
          onClick={() => setShowCardVerification(false)}
          style={{
            background: "#991b1b",
            border: 0,
            color: "#fff",
            borderRadius: 4,
            padding: "5px 9px",
            cursor: "pointer",
             fontSize: "62px",
            fontWeight: 800,
          }}
        >
          ×
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          verifyCashierCartela();
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: 12,
             fontSize: "32px",
            marginBottom: 6,
          }}
        >
          Enter Cartela ID to check it against the current game.
        </label>

        <div style={{ display: "flex", gap: 5 }}>
          <input
            type="text"
            value={verificationCartelaId}
            onChange={(event) =>
              setVerificationCartelaId(event.target.value)
            }
            placeholder="Enter Cartela ID"
            style={{
              flex: 1,
              minWidth: 0,
              padding: 9,
              background: "#151515",
              color: "#fff",
              border: "1px solid #64748b",
              borderRadius: 4,
              textAlign: "center",
               fontSize: "32px",
              fontWeight: 800,
            }}
          />

          <button
            type="submit"
            disabled={verificationLoading}
            style={{
              padding: "8px 12px",
              background: "#0891b2",
              color: "#fff",
              border: 0,
              borderRadius: 4,
               fontSize: "22px",
              fontWeight: 900,
              cursor: verificationLoading ? "wait" : "pointer",
            }}
          >
            {verificationLoading ? "CHECKING..." : "VERIFY"}
          </button>
        </div>
      </form>

      {verificationError && (
        <div
          style={{
            marginTop: 10,
            padding: 9,
            background: "#451a1a",
            color: "#fecaca",
            border: "1px solid #ef4444",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {verificationError}
        </div>
      )}
    </div>
  </div>
)}

{/* =====================================================
    VERIFIED CARTELA POPUP
===================================================== */}
{verificationResult && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 20000,
      background: "rgba(0,0,0,0.88)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 22,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        position: "relative",
        width: "min(900px, 106vw)",
        maxHeight: "99vh",
        overflowY: "auto",
        background: "#080f1e",
        border: `1px solid ${
          verificationResult.isWinner ? "#22c55e" : "#ef233c"
        }`,
        borderRadius: 7,
        padding: 10,
        boxSizing: "border-box",
        color: "#fff",
      }}
    >
      <button
        type="button"
        onClick={() => setVerificationResult(null)}
        aria-label="Close verified cartela"
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 86,
          height: 86,
          borderRadius: "50%",
          background: "#172033",
          border: "1px solid #64748b",
          color: "#fff",
          fontSize: 38,
          cursor: "pointer",
          lineHeight: 1,
          zIndex: 2,
        }}
      >
        ×
      </button>

{/* CURRENT CALL NUMBER */}
<div
  style={{
    margin: "8px auto 14px",
    padding: "10px 18px",
    background: "#14532d",
    border: "2px solid #22c55e",
    borderRadius: "10px",
    color: "#FFFFFF",
    textAlign: "center",
    width: "fit-content",
    minWidth: "220px",
    maxWidth: "90%",
    boxSizing: "border-box",
  }}
>
  <div
    style={{
      fontSize: "46px",
      color: "#bbf7d0",
      fontWeight: "bold",
    }}
  >
    ያቆመበት ጥሪ
  </div>

  <div
    style={{
      fontSize: "72px",
      fontWeight: 900,
      lineHeight: 1.2,
    }}
  >
    #{verificationResult.calledNumbers?.length ?? verificationCalledNumbers.length}
  </div>
</div>

{verificationResult.sold && verificationResult.isWinner && (
  <div
    style={{
      margin: "8px auto",
      padding: "8px 12px",
      background: "#172554",
      border: "1px solid #3B82F6",
      borderRadius: "8px",
      color: "#FFFFFF",
      textAlign: "center",
      maxWidth: "240px",
    }}
  >
    <div
      style={{
        fontSize: "62px",
        color: "#BFDBFE",
        fontWeight: "bold",
      }}
    >
      ያሸነፈበት  ጥሪ
    </div>

    <div style={{ fontSize: "86px", fontWeight: 900 }}>
      {verificationResult.winOnCallNumber != null
        ? `#${verificationResult.winOnCallNumber}`
        : "Not recorded"}
    </div>
  </div>
)}


      <div
        style={{
          textAlign: "center",
          fontSize: "clamp(52px, 4vw, 72px)",
          fontWeight: 900,
          color: verificationResult.sold
            ? verificationResult.isWinner
              ? "#22c55e"
              : "#ff1744"
            : "#ff1744",
          paddingRight: 35,
        }}
      >
        {verificationResult.sold
          ? verificationResult.isWinner
            ? "🏆 WINNER"
            : "❌ NOT WINNER"
          : "❌ NOT SOLD"}
      </div>

      <div
        style={{
          textAlign: "center",
          color: "#a6b5cb",
          fontSize: "clamp(72px, 4.5vw, 68px)",
          fontWeight: 900,
          marginBottom: 8,
        }}
      >
        Cartela #{verificationResult.cartelaId}
      </div>

      {(() => {
        const card = verificationResult.cartela;

        const parseMaybeJSON = (value) => {
          if (typeof value !== "string") return value;
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        };

        let matrix = parseMaybeJSON(
          verificationResult.matrix ?? card?.matrix
        );

        const numbers = parseMaybeJSON(card?.numbers);

        if (
          (!Array.isArray(matrix) ||
            matrix.length !== 5 ||
            !matrix.every(
              (row) => Array.isArray(row) && row.length === 5
            )) &&
          numbers &&
          ["B", "I", "N", "G", "O"].every((letter) =>
            Array.isArray(numbers[letter])
          )
        ) {
          matrix = Array.from({ length: 5 }, (_, rowIndex) =>
            ["B", "I", "N", "G", "O"].map((letter, colIndex) =>
              rowIndex === 2 && colIndex === 2
                ? "FREE"
                : numbers[letter][rowIndex]
            )
          );
        }

        if (
          !Array.isArray(matrix) ||
          matrix.length !== 5 ||
          !matrix.every(
            (row) => Array.isArray(row) && row.length === 5
          )
        ) {
          return (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: "#fca5a5",
              }}
            >
              {verificationResult.sold
                ? "The cartela was verified, but its 5×5 numbers were not returned. Check the sold-cartelas API response."
                : verificationResult.message || "Cartela not sold."}
            </div>
          );
        }

        // Convert numbers consistently, including strings such as "B-12".
        const normalizeNumber = (value) => {
          if (value === null || value === undefined) return null;

          if (typeof value === "object") {
            value = value.number ?? value.value ?? value.ball ?? "";
          }

          const text = String(value).trim().toUpperCase();

          if (!text || text === "FREE") return null;

          const match = text.match(/\d+/);
          return match ? Number(match[0]) : null;
        };

        // Use the calls attached to the verification result first.
        // Fall back to the calls loaded by verifyCashierCartela().
        const rawCalledNumbers =
          verificationResult.calledNumbers ??
          verificationResult.called ??
          verificationCalledNumbers ??
          [];

        const calledList = Array.isArray(rawCalledNumbers)
          ? rawCalledNumbers
          : [];

        const calledSet = new Set(
          calledList
            .map(normalizeNumber)
            .filter((number) => number !== null)
        );

        const winningCells = Array.isArray(
          verificationResult.winningCells
        )
          ? verificationResult.winningCells
          : [];

        const winningNumbers = Array.isArray(
          verificationResult.winningNumbers
        )
          ? verificationResult.winningNumbers
              .map(normalizeNumber)
              .filter((number) => number !== null)
          : [];

        return (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 5,
                marginBottom: 5,
              }}
            >
              {["B", "I", "N", "G", "O"].map((letter) => (
                <div
                  key={letter}
                  style={{
                    height: "clamp(42px, 7vw, 70px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#151515",
                    border: "1px solid #454545",
                    borderRadius: 3,
                    fontSize: "clamp(48px, 5vw, 70px)",
                    fontWeight: 900,
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 4,
              }}
            >
              {matrix.flatMap((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const cellValue =
                    cell && typeof cell === "object"
                      ? cell.number ?? cell.value ?? ""
                      : cell;

                  const isFree =
                    (rowIndex === 2 && colIndex === 2) ||
                    String(cellValue).trim().toUpperCase() === "FREE";

                  const number = normalizeNumber(cellValue);

                  const isWinningCell =
                    !isFree &&
                    (
                      winningCells.some(
                        (position) =>
                          Array.isArray(position) &&
                          Number(position[0]) === rowIndex &&
                          Number(position[1]) === colIndex
                      ) ||
                      (number !== null &&
                        winningNumbers.includes(number))
                    );

                  const isCalled =
                    !isFree &&
                    number !== null &&
                    calledSet.has(number);

                  // Priority: winning red, called blue, otherwise dark.
                  const cellBackground = isFree
                    ? "#1f1e1d"
                    : isWinningCell
                      ? "#dc2626"
                      : isCalled
                        ? "#1555df"
                        : "#1e293b";

                  const cellBorder = isFree
                    ? "#6b5900"
                    : isWinningCell
                      ? "#ff6666"
                      : isCalled
                        ? "#3478ff"
                        : "#8490a2";

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      title={
                        isFree
                          ? "FREE"
                          : isWinningCell
                            ? "Winning number"
                            : isCalled
                              ? "Called number"
                              : "Not called"
                      }
                      style={{
                        minWidth: 12,
                        height: "clamp(85px, 8.5vw, 109px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                        background: cellBackground,
                        color: "#fff",
                        border: `1px solid ${cellBorder}`,
                        borderRadius: 1,
                        fontSize: isFree
                          ? "clamp(69px, 3.5vw, 84px)"
                          : "clamp(78px, 5.2vw, 94px)",
                        fontWeight: 900,
                        lineHeight: 1,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isFree ? "FREE" : number ?? String(cellValue)}
                    </div>
                  );
                })
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 14,
                marginTop: 12,
                fontSize: 32,
                fontWeight: 800,
              }}
            >
              <span>
                <span style={{ color: "#ff6666" }}>■</span> Winning
              </span>
              <span>
                <span style={{ color: "#3478ff" }}>■</span> Called
              </span>
              <span>
                <span style={{ color: "#8490a2" }}>■</span> Not called
              </span>
              <span>
                <span style={{ color: "#a89b70" }}>■</span> FREE
              </span>
            </div>

            {calledSet.size === 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  background: "#422006",
                  border: "1px solid #d97706",
                  borderRadius: 5,
                  color: "#fde68a",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                No called numbers were received for this verification.
                The blue cells will appear after the called-number data
                is supplied by the API.
              </div>
            )}

            {verificationResult.isWinner &&
              winningCells.length === 0 &&
              winningNumbers.length === 0 && (
                <div
                  style={{
                    marginTop: 8,
                    color: "#fcd34d",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  The server marked this cartela as a winner but did not
                  return its winning cells or winning numbers, so the
                  winning pattern cannot yet be highlighted in red.
                </div>
              )}
          </>
        );
      })()}
    </div>
  </div>
)}
{verificationResult?.isWinner &&
  verificationResult.winOnCallNumber !== null &&
  verificationResult.winOnCallNumber !== undefined && (
    <div
      style={{
        marginTop: "10px",
        padding: "14px",
        borderRadius: "10px",
        background: "#172554",
        border: "2px solid #3B82F6",
        color: "#FFFFFF",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: "bold",
          color: "#BFDBFE",
          marginBottom: "5px",
        }}
      >
        WIN ON CALL NUMBER
      </div>

      <div
        style={{
          fontSize: "36px",
          fontWeight: "900",
          lineHeight: 1.2,
        }}
      >
        #{verificationResult.winOnCallNumber}
      </div>
    </div>
  )}



  

 {/* 🏆 WINNER CARTELA HISTORY */}
<div
  style={{
    marginTop: "10px",
    padding: "22px",
    borderRadius: "10px",
    background: "#211044",
    border: "2px solid #8b5cf6",
    color: "#ffffff",
    width: "100%",
    boxSizing: "border-box",
  }}
>
  {/* HEADER */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "8px",
    }}
  >
    <h3 style={{ margin: 0, fontSize: "18px" }}>
      🏆 WINNER CARTELA HISTORY (
      {cashierWinnerGroups.reduce(
        (total, group) =>
          total + (group.cartelas?.length || 0),
        0
      )}
      )
    </h3>

    <button
      type="button"
      disabled={!winnerHistoryGameId || loadingWinnerHistory}
      onClick={() => loadCashierWinnerHistory(winnerHistoryGameId)}
      style={{
        padding: "7px 12px",
        borderRadius: "6px",
        border: "1px solid #c4b5fd",
        background: "#6d28d9",
        color: "#ffffff",
        fontWeight: "bold",
        cursor: loadingWinnerHistory ? "wait" : "pointer",
        opacity: loadingWinnerHistory ? 0.7 : 1,
      }}
    >
      {loadingWinnerHistory ? "LOADING..." : "↻ REFRESH"}
    </button>
  </div>

  {/* GAME ID */}
  <div style={{ marginTop: "8px", fontSize: "13px" }}>
    Game ID:{" "}
    <strong>{winnerHistoryGameId || "No game selected"}</strong>
  </div>

  {/* ERRORS */}
  {winnerHistoryError && (
    <p style={{ color: "#fca5a5", marginBottom: "8px" }}>
      {winnerHistoryError}
    </p>
  )}

  {!winnerHistoryGameId && (
    <p>Start a game to display its winning cartelas here.</p>
  )}

  {winnerHistoryGameId &&
    !loadingWinnerHistory &&
    cashierWinnerGroups.length === 0 &&
    !winnerHistoryError && (
      <p>No winning cartelas have been recorded for this game yet.</p>
    )}

  {/* WINNER GROUPS */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}
  >
    {cashierWinnerGroups.map((group) => (
      <div
        key={group.callCount}
        style={{
          marginTop: "8px",
          padding: "10px",
          borderRadius: "8px",
          background: "#32145b",
          border: "1px solid #7c3aed",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "31px",   marginBottom: "10px" }}>
          🎱 ጥሪ   CALL #{group.callCount}
        </div>

        {(group.cartelas || []).map((winner, index) => (
          <div
            key={`${winner.id}-${index}`}
            style={{
              marginBottom: "12px",
              padding: "10px",
              borderRadius: "8px",
              background: "#1a1030",
            }}
          >
            <div style={{  fontSize: "38px",   marginBottom: "5px" }}>
              <strong>Cartela NUMBER:</strong> {winner.id}
            </div>

            <div style={{ marginBottom: "10px" }}>
              <strong>Winning Pattern:</strong> {winner.pattern}
            </div>

            {/* CARTELA MATRIX */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",

               
                gap: "4px",
                maxWidth: "420px",
              }}
            >
              {(Array.isArray(winner.matrix) ? winner.matrix : []).map(
                (row, rowIndex) =>
                  (Array.isArray(row) ? row : []).map(
                    (cell, colIndex) => {
                      // Matrix cells can be strings such as "B 5",
                      // "I 30", or "FREE".
                      const cellText = String(cell).trim();
                      const isFree =
                        rowIndex === 2 &&
                        colIndex === 2;

                      const cellNumber = isFree
                        ? null
                        : parseInt(
                            cellText.split(/\s+/).pop(),
                            10
                          );

                      const isWinningCell =
                        Array.isArray(winner.winningCells) &&
                        winner.winningCells.some(
                          (position) =>
                            Array.isArray(position) &&
                            Number(position[0]) === rowIndex &&
                            Number(position[1]) === colIndex
                        );

                      const isWinningNumber =
                        Array.isArray(winner.winningNumbers) &&
                        cellNumber !== null &&
                        winner.winningNumbers.some(
                          (number) =>
                            Number(number) === cellNumber
                        );

                      const isCalledNumber =
                        Array.isArray(winner.calledNumbers) &&
                        cellNumber !== null &&
                        winner.calledNumbers.some(
                          (number) =>
                            Number(number) === cellNumber
                        );

                      // Winning red takes priority over called blue.
                      const cellBackground = isFree
                        ? "#f59e0b"
                        : isWinningCell || isWinningNumber
                          ? "#dc2626"
                          : isCalledNumber
                            ? "#2563eb"
                            : "#4c1d95";

                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          title={
                            isFree
                              ? "FREE"
                              : isWinningCell || isWinningNumber
                                ? "Winning number"
                                : isCalledNumber
                                  ? "Called number"
                                  : "Not called"
                          }
                         style={{
  width: "100%",
  minWidth: 0,
  aspectRatio: "1 / 1",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "10px",
  background: cellBackground,
  color: "#ffffff",
  border: "1px solid #a78bfa",
  fontSize: "39px",
  fontWeight: 700,
  lineHeight: 1,
  overflow: "hidden",
  whiteSpace: "nowrap",
}}
                        >
                          {cell}
                        </div>
                      );
                    }
                  )
              )}
            </div>

            {/* COLOR LEGEND */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "10px",
                fontSize: "11px",
              }}
            >
              <span>
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "2px",
                    background: "#dc2626",
                    marginRight: "4px",
                  }}
                />
                Winning
              </span>

              <span>
                <span
                  style={{
                    display: "inline-block",
                    width: "40px",
                    height: "50px",
                    borderRadius: "2px",
                    background: "#2563eb",
                    marginRight: "4px",
                  }}
                />
                Called
              </span>

              <span>
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "2px",
                    background: "#f59e0b",
                    marginRight: "4px",
                  }}
                />
                FREE
              </span>

              <span>
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "2px",
                    background: "#4c1d95",
                    marginRight: "4px",
                  }}
                />
                Not called
              </span>
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
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
                       height: "60px",
                    padding: "6px 12px",
                    background: "#0f172a",
                    border: "1px solid #38bdf8",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontWeight: "bold",
                    fontSize: "50px",
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