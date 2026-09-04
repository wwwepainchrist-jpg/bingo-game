import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { API_URL } from "../config";
import "./BingoGame.css";
import { io } from "socket.io-client";
  // Add this if not already imported
// --- Phonetic & Legend Data ---
const amharicPhoneticNumbers = {
  1: "Aaaand",
  2: "Hoooo-let",
  3: "Sooost",
  4: "Araaat",
  5: "Aaaamist",
  6: "Siiidist",
  7: "Seeebat",
  8: "Siiiimint",
  9: "Zaaateñ",

  10: "Asir",

  11: "Asra Aand",
  12: "Asra Hoo-let",
  13: "Asra Sost",
  14: "Asra Arat",
  15: "Asra Amist",
  16: "Asra Sidist",
  17: "Asra Sebat",
  18: "Asra Simint",
  19: "Asra Zateñ",

  20: "Haya",
  21: "Haya Aand",
  22: "Haya Hoo-let",
  23: "Haya Sost",
  24: "Haya Arat",
  25: "Haya Amist",
  26: "Haya Sidist",
  27: "Haya Sebat",
  28: "Haya Simint",
  29: "Haya Zateñ",

  30: "Selasa",
  31: "Selasa Aand",
  32: "Selasa Hoo-let",
  33: "Selasa Sost",
  34: "Selasa Arat",
  35: "Selasa Amist",
  36: "Selasa Sidist",
  37: "Selasa Sebat",
  38: "Selasa Simint",
  39: "Selasa Zateñ",

  40: "Arrba",
  41: "Arba Aand",
  42: "Arba Hoo-let",
  43: "Arba Sost",
  44: "Arba Arat",
  45: "Arba Amist",
  46: "Arba Sidist",
  47: "Arba Sebat",
  48: "Arba Simint",
  49: "Arba Zateñ",

  50: "Hamsa",
  51: "Hamsa Aand",
  52: "Hamsa Hoo-let",
  53: "Hamsa Sost",
  54: "Hamsa Arat",
  55: "Hamsa Amist",
  56: "Hamsa Sidist",
  57: "Hamsa Sebat",
  58: "Hamsa Simint",
  59: "Hamsa Zateñ",

  60: "Silsa",
  61: "Silsa Aand",
  62: "Silsa Hoo-let",
  63: "Silsa Sost",
  64: "Silsa Arat",
  65: "Silsa Amist",
  66: "Silsa Sidist",
  67: "Silsa Sebat",
  68: "Silsa Simint",
  69: "Silsa Zateñ",

70: "Säba",
71: "Säba Aand",
72: "Säba Hoo-let",
73: "Säba Sost",
74: "Säba Arat",
75: "Säba Amist",
};// ==========================================================
// 🎙️ DRAMATIC BINGO ANNOUNCER
// Makes the existing pronunciation longer and more dramatic
// ==========================================================

// ==========================================================
// 🎙️ FAST BINGO ANNOUNCER
// Short vowel extension — energetic, NOT slow
// ==========================================================
const makeDramaticBingoText = (text) => {
  if (!text) return text;

  return text
    // Main Amharic number words
    .replace(/\bAand\b/g, "Aaaand")
    .replace(/\bHoo-let\b/g, "Hoooo-let")
    .replace(/\bSost\b/g, "Sooost")
    .replace(/\bArat\b/g, "Araaat")
    .replace(/\bAmist\b/g, "Aaaamist")
    .replace(/\bSidist\b/g, "Siiidist")
    .replace(/\bSebat\b/g, "Seeebat")
    .replace(/\bSimint\b/g, "Siiiimint")
    .replace(/\bZateñ\b/g, "Zaaateñ")

    // Tens
    .replace(/\bAsir\b/g, "Aaaasir")
    .replace(/\bAsra\b/g, "Aaaasraaa")
    .replace(/\bHaya\b/g, "Haaayaa")
    .replace(/\bSelasa\b/g, "Selaaasa")
    .replace(/\bArba\b/g, "Aaarba")
    .replace(/\bArrba\b/g, "Aaarrba")
    .replace(/\bHamsa\b/g, "Haaamsa")
    .replace(/\bSilsa\b/g, "Siiilsa")
    .replace(/\bSäba\b/g, "Säääba");
};
// --- Afaan Oromo Number Words ---
const afaanOromoNumbers = {
  1: "Tookko", 2: "Lama", 3: "Sadii", 4: "Affuurr", 5: "Shaan",
  6: "Jaha", 7: "Torba", 8: "Saaddeet", 9: "Sagal", 10: "Kuudhan",
  11: "Kudha tokko", 12: "Kudha lama", 13: "Kudha sadii", 14: "Kudha affurii", 15: "Kudha shaan",
  16: "Kudha jaha", 17: "Kudha torba", 18: "Kudha saaddeet", 19: "Kudha sagal", 20: "Digdama",
  21: "Digdamii tokko", 22: "Digdamii lama", 23: "Digdamii sadii", 24: "Digdamii afurii", 25: "Digdamii shaan",
  26: "Digdamii jaha", 27: "Digdamii torrba", 28: "Digdamii saaddeet", 29: "Digdamii sagal", 30: "Sooddoma",
  31: "Soddomii tokko", 32: "Soddomii lama", 33: "Soddomii sadii", 34: "Soddomii afurii", 35: "Soddomii shan",
  36: "Soddomii jaha", 37: "Soddomii torrba", 38: "Soddomii saaddeet", 39: "Soddomii sagal", 40: "Affuurtama",
  41: "Affuurrtamii tokko", 42: "Affuurrtamii lama", 43: "Affuurrtamii sadii", 44: "Afurrtamii afuurii", 45: "Affuurrtamii shaan",
  46: "Affuurrtamii jaha", 47: "Afurrtamii torrba", 48: "Afurrtamii saddeet", 49: "Afurtamii sagal", 50: "Shantama",
  51: "Shantamii tokko", 52: "Shantamii lama", 53: "Shantamii sadii", 54: "Shantamii afuurii", 55: "Shantamii shaan",
  56: "Shantamii jaha", 57: "Shantamii torba", 58: "Shantamii saaddeet", 59: "Shantamii sagal", 60: "Jahaatama",
  61: "Jahaatamii tokko", 62: "Jahaatamii lama", 63: "Jahaatamii sadii", 64: "Jahaatamii afurii", 65: "Jahaatamii shaan",
  66: "Jahaatamii jaha", 67: "Jahaatamii torrba", 68: "Jahaatamii saaddeet", 69: "Jahaatamii sagal", 70: "Torrbatama",
  71: "Torrbatamii tokko", 72: "Torrbatamii lama", 73: "Torrbatamii sadii", 74: "Torbatamii afurii", 75: "Torrbatamii shan"
};

const afaanOromoDigitWords = { "0": "Zeeroo", "1": "Tokko", "2": "Lama", "3": "Sadii", "4": "Afuurr", "5": "Shaan", "6": "Jaha", "7": "Torrba", "8": "Saddeet", "9": "Sagal" };


const footballLegends = {
  1: "buffon",
  2: "Cafu",
  3: " Maldini",
  4: " Ramos",
  5: " madrid",
  6: "Xavi Hernández",
  7: "Cristiano Ronaldo",
  8: " Iniesta",
  9: "Ronaldo Nazário",
  10: "Pelé",
  11: "Neymar Jr.",
  12: "Marcelo",
  13: " arsenal",
  14: "Johan Cruyff",
  15: " Vidić",
  16: "Roy Keane",
  17: "Kevin De Bruyne",
  18: "Paul Scholes",
  19: "Lionel Messi",
  20: "Luka Modrić"
};

const digitWords = { "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine" };
const spokenLetter = {
  B: "BEE",
  I: "Iii",
  N: "N",
  G: "GE",
  O: "OO"
};

const columnColorStyles = {
  B: { border: "2px solid #00c8ff", textShadow: "0 0 6px #00c8ff", labelBg: "#00c8ff" },
  I: { border: "2px solid #ffd400", textShadow: "0 0 6px #ffd400", labelBg: "#ffd400" },
  N: { border: "2px solid #ff5aa5", textShadow: "0 0 6px #ff5aa5", labelBg: "#ff5aa5" },
  G: { border: "2px solid #2fdc4b", textShadow: "0 0 6px #2fdc4b", labelBg: "#2fdc4b" },
  O: { border: "2px solid #ff5252", textShadow: "0 0 6px #ff5252", labelBg: "#ff5252" }
};

const INITIAL_BALLS = [
  { id: 1, letter: "B", num: 7, color: "#00c8ff", x: 30, y: 40, dx: 1.2, dy: -1.5 },
  { id: 2, letter: "I", num: 22, color: "#ffd400", x: 50, y: 65, dx: -1.8, dy: 1.1 },
  { id: 3, letter: "N", num: 37, color: "#ff5aa5", x: 65, y: 45, dx: 1.4, dy: -1.3 },
  { id: 4, letter: "G", num: 51, color: "#2fdc4b", x: 25, y: 70, dx: -1.1, dy: -1.6 },
  { id: 5, letter: "O", num: 75, color: "#ff5252", x: 55, y: 35, dx: 1.6, dy: 1.4 },
  { id: 6, letter: "B", num: 12, color: "#00c8ff", x: 15, y: 55, dx: -1.5, dy: -1.2 },
  { id: 7, letter: "G", num: 58, color: "#2fdc4b", x: 70, y: 58, dx: 1.3, dy: 1.7 },
  { id: 8, letter: "I", num: 19, color: "#ffd400", x: 45, y: 20, dx: -1.6, dy: -1.1 },
  { id: 9, letter: "O", num: 63, color: "#ff5252", x: 80, y: 40, dx: 1.2, dy: 1.8 }
];

export default function BingoGame() {
  const { id } = useParams();
  const navigate = useNavigate();
 
  const [game, setGame] = useState({ 
    prize: "00 Birr", 
    id: id || "101", 
    soldCartelas: [], 
    voiceMode: "recorded",
    speechLang: "en-US",
    language: "en" 
  });
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();

  const [current, setCurrent] = useState("");
  const [called, setCalled] = useState([]);

  const [paused, setPaused] = useState(true);
  const [speed, setSpeed] = useState(5);
  const [cartelaId, setCartelaId] = useState("");
  
  const [winnerMessage, setWinnerMessage] = useState("");
  const [checkedCartela, setCheckedCartela] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(""); 

  const [tvMode, setTvMode] = useState(false);
  const [cageBalls, setCageBalls] = useState(INITIAL_BALLS);
  const [voices, setVoices] = useState([]);
 
  const hasAnnouncedLetsGo = useRef(false);
  const animationRef = useRef(null);
  const shuffleAudioRef = useRef(null);
  const isDrawingBallRef = useRef(false);
  const loopTimeoutRef = useRef(null);
const audioGenerationInProgressRef = useRef(false);
const audioLoadingRef = useRef(false);
  const remainingNumbersRef = useRef(Array.from({ length: 75 }, (_, i) => i + 1));
  const activeUtteranceRef = useRef(null);
  const activeAudioRef = useRef(null);
  const pausedAudioRef = useRef(null);
  const audioTimeoutRef = useRef(null);
  const audioGenerationRef = useRef(0);
  const calledRef = useRef(called);
  const stateRef = useRef({ called, paused, speed, current, game });
  const [volume, setVolume] = useState(0.7);
  const volumeRef = useRef(0.7);
  const location = useLocation();
  const selectedWinningPattern =
  location.state?.winningPatternCount ??
  location.state?.game?.winningPatternCount ??
  1;
  const [activeWinningPattern, setActiveWinningPattern] =
  useState(selectedWinningPattern);
  const passedGame = location.state?.game;
const [voiceSpeed, setVoiceSpeed] = useState(1.0);
const voiceSpeedRef = useRef(1.0);
const TARGET_GENERATION_INTERVAL_MS = 400;
const [winningCells, setWinningCells] = useState([]);
const [displayedWinningPatterns, setDisplayedWinningPatterns] = useState([]);
const audioContextRef = useRef(null);
const audioSourceRef = useRef(null);
const bassFilterRef = useRef(null);

const SHUFFLE_PLAYED_KEY = "bingo_shuffle_played";
const pendingBingoCallRef = useRef(null);
const playPauseActionRef = useRef(0);
const resumeAfterGenerationRef = useRef(false);
const [voiceDepth, setVoiceDepth] = useState(() => {
  const cashierId = localStorage.getItem("logged_in_cashier");

  if (!cashierId) return 0;

  const saved = localStorage.getItem(
    `cashier_voice_depth_${cashierId}`
  );

  return saved !== null ? Number(saved) : 0;
});
useEffect(() => {
  voiceDepthRef.current = voiceDepth;

  // Change bass immediately if audio is currently playing
  if (bassFilterRef.current) {
    bassFilterRef.current.gain.value = voiceDepth * 0.8;

    console.log(
      "🎙️ LIVE VOICE DEPTH:",
      voiceDepth,
      "BASS GAIN:",
      voiceDepth * 0.8
    );
  }

  // Save for this cashier
  const cashierId = localStorage.getItem("logged_in_cashier");

  if (cashierId) {
    localStorage.setItem(
      `cashier_voice_depth_${cashierId}`,
      String(voiceDepth)
    );
  }
}, [voiceDepth]);
const voiceDepthRef = useRef(voiceDepth);
const winningPatternAnimationRef = useRef(null);
const winningPatternIndexRef = useRef(0);
// ============================================================
// 🏆 WINNING PATTERN PREVIEW ANIMATION
// Shows EVERY possible winning pattern combination
// ============================================================


useEffect(() => {
  if (!activeWinningPattern) {
    setDisplayedWinningPatterns([]);

    winningPatternIndexRef.current = 0;

    if (winningPatternAnimationRef.current !== null) {
      clearTimeout(winningPatternAnimationRef.current);

      winningPatternAnimationRef.current = null;
    }

    return;
  }

  // ============================================================
  // ALL POSSIBLE WINNING PATTERNS
  // ============================================================

  const allPatterns = [];

  // ----------------------------
  // HORIZONTAL
  // ----------------------------
  for (let row = 0; row < 5; row++) {
    const cells = [];

    for (let col = 0; col < 5; col++) {
      cells.push(`${row}-${col}`);
    }

    allPatterns.push(cells);
  }

  // ----------------------------
  // VERTICAL
  // ----------------------------
  for (let col = 0; col < 5; col++) {
    const cells = [];

    for (let row = 0; row < 5; row++) {
      cells.push(`${row}-${col}`);
    }

    allPatterns.push(cells);
  }

  // ----------------------------
  // DIAGONAL 1
  // ----------------------------
  allPatterns.push([
    "0-0",
    "1-1",
    "2-2",
    "3-3",
    "4-4",
  ]);

  // ----------------------------
  // DIAGONAL 2
  // ----------------------------
  allPatterns.push([
    "0-4",
    "1-3",
    "2-2",
    "3-1",
    "4-0",
  ]);

  // ----------------------------
  // FOUR CORNERS
  // ----------------------------
  allPatterns.push([
    "0-0",
    "0-4",
    "4-0",
    "4-4",
  ]);

  // ----------------------------
  // FOUR CORNERS NEAR STAR
  // ----------------------------
  allPatterns.push([
    "1-1",
    "1-3",
    "3-1",
    "3-3",
  ]);

  // ----------------------------
  // FULL HOUSE
  // ----------------------------
  const fullHouse = [];

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      fullHouse.push(`${row}-${col}`);
    }
  }

  allPatterns.push(fullHouse);

  // ============================================================
  // REQUIRED NUMBER OF PATTERNS
  // ============================================================

  const requiredCount = Math.min(
    10,
    Math.max(
      1,
      Number(activeWinningPattern) || 1
    )
  );

  console.log(
    "🏆 REQUIRED WINNING PATTERNS:",
    requiredCount
  );

  // ============================================================
  // BUILD COMBINATIONS
  //
  // We only need enough combinations for the UI.
  // DO NOT generate every possible combination.
  // ============================================================

  const combinations = [];

  // First combination
  const firstCombination = [];

  for (
    let i = 0;
    i < requiredCount &&
    i < allPatterns.length;
    i++
  ) {
    firstCombination.push(i);
  }

  combinations.push(firstCombination);

  // Additional combinations
  // Rotate the patterns so the displayed pattern changes.
  for (
    let start = 1;
    start < allPatterns.length;
    start++
  ) {
    const combination = [];

    for (let offset = 0; offset < requiredCount; offset++) {
      const index =
        (start + offset) %
        allPatterns.length;

      combination.push(index);
    }

    combinations.push(combination);
  }

  console.log(
    "🏆 UI COMBINATIONS:",
    combinations.length
  );

  // ============================================================
  // RESET ANIMATION INDEX
  // ============================================================

  winningPatternIndexRef.current = 0;

  // ============================================================
  // SHOW NEXT COMBINATION
  // ============================================================

  const showNextCombination = () => {

    // ----------------------------------------------------------
    // PAUSED = STOP TIMER
    // ----------------------------------------------------------

    if (stateRef.current.paused) {
      console.log(
        "⏸️ WINNING ANIMATION PAUSED"
      );

      winningPatternAnimationRef.current = null;

      return;
    }

    if (!combinations.length) {
      winningPatternAnimationRef.current = null;

      return;
    }

    // ----------------------------------------------------------
    // CURRENT COMBINATION
    // ----------------------------------------------------------

    const currentIndex =
      winningPatternIndexRef.current;

    const indexes =
      combinations[currentIndex];

    // ----------------------------------------------------------
    // GET CELLS
    // ----------------------------------------------------------

    const cells = indexes.flatMap(
      patternIndex =>
        allPatterns[patternIndex]
    );

    // Remove duplicate cells
    const uniqueCells = [
      ...new Set(cells)
    ];

    // ----------------------------------------------------------
    // DISPLAY
    // ----------------------------------------------------------

    setDisplayedWinningPatterns(
      uniqueCells
    );

    console.log(
      `🏆 SHOWING ${requiredCount} PATTERNS — COMBINATION ${
        currentIndex + 1
      } / ${combinations.length}`,
      uniqueCells
    );

    // ----------------------------------------------------------
    // NEXT COMBINATION
    // ----------------------------------------------------------

    winningPatternIndexRef.current =
      (currentIndex + 1) %
      combinations.length;

    // ----------------------------------------------------------
    // ONE TIMER ONLY
    // ----------------------------------------------------------

    winningPatternAnimationRef.current =
      setTimeout(() => {

        winningPatternAnimationRef.current =
          null;

        showNextCombination();

      }, 1000);
  };

  // ============================================================
  // START
  // ============================================================

  if (!stateRef.current.paused) {
    showNextCombination();
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  return () => {

    if (
      winningPatternAnimationRef.current !== null
    ) {
      clearTimeout(
        winningPatternAnimationRef.current
      );

      winningPatternAnimationRef.current = null;
    }
  };

}, [activeWinningPattern, paused]);


const nextGenerationTimeRef = useRef(null);


const cashierId =
  localStorage.getItem("logged_in_cashier");

const [callInterval, setCallInterval] = useState(() => {
  const saved = cashierId
    ? localStorage.getItem(
        `cashier_call_speed_${cashierId}`
      )
    : null;

  return saved !== null
    ? Number(saved)
    : 5;
});

const callIntervalRef = useRef(
  cashierId
    ? Number(
        localStorage.getItem(
          `cashier_call_speed_${cashierId}`
        )
      ) || 5
    : 5
);

const callIntervalTimerRef = useRef(null);


const playPauseGenerationRef = useRef(0);
const generationCancelRef = useRef(0);

// 🔄 LOAD CASHIER SPEED

const gameRunIdRef = useRef(0);
const hasPlayedShuffleRef = useRef(
  sessionStorage.getItem("bingo_shuffle_played") === "true"
);
const callIntervalChangeRef = useRef(null);
  // ============================================
  // CALL NUMBER API (prevents spam)
  // ============================================
 

  
  // ============================================
  // VOICE SPEED
  // ============================================
  const decreaseVoiceSpeed = () => {
    setVoiceSpeed(prev => Math.max(0.5, +(prev - 0.1).toFixed(1)));
  };

  const increaseVoiceSpeed = () => {
    setVoiceSpeed(prev => Math.min(2.0, +(prev + 0.1).toFixed(1)));
  };
useEffect(() => {
  if (!cashierId) return;

  callIntervalRef.current = callInterval;

  localStorage.setItem(
    `cashier_call_speed_${cashierId}`,
    String(callInterval)
  );

  console.log(
    "💾 CALL SPEED SAVED:",
    cashierId,
    callInterval
  );
}, [callInterval, cashierId]);
  // ============================================
  // RETURN JSX
  // ============================================

  useEffect(() => {
    stateRef.current = { called, paused, speed, current, game };
  }, [called, paused, speed, current, game]);
  useEffect(() => {
  voiceSpeedRef.current = voiceSpeed;

  if (activeAudioRef.current) {
    activeAudioRef.current.playbackRate = voiceSpeed;
  }
}, [voiceSpeed]);
useEffect(() => {
  if (activeAudioRef.current) {
    activeAudioRef.current.playbackRate = voiceSpeed;
  }
}, [voiceSpeed]);
  // --- Fetch Active Game from Backend ---
// Add with your other refs at the top of the component
const fetchingGameRef = useRef(false);

// --- Fetch Active Game from Backend ---
useEffect(() => {
  async function fetchGameData() {
    if (fetchingGameRef.current) return;

    fetchingGameRef.current = true;

    const maxAttempts = 10;
    const retryDelay = 150;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {

        console.log(
          `🔥 FETCH ACTIVE GAME: ${id} (attempt ${attempt}/${maxAttempts})`
        );

        const response = await fetch(
          `${API_URL}/games/active/${id}`
        );

        // ✅ Game found
        if (response.ok) {
          const data = await response.json();

          console.log("✅ ACTIVE GAME FROM BACKEND:", data);
          console.log(
            "🎱 CALLED NUMBERS FROM BACKEND:",
            data.calledNumbers
          );

          setGame(prev => {
            const restoredVoiceMode =
              data.voice_mode ||
              data.voiceMode ||
              prev.voiceMode ||
              "recorded";

            const restoredSpeechLang =
              data.speech_lang ||
              data.speechLang ||
              prev.speechLang ||
              "en-US";

            const restoredVoiceSpeed =
              data.voice_speed ||
              data.voiceSpeed ||
              prev.voiceSpeed ||
              1;

            return {
              ...prev,
              id: data.game_id,
              date: data.date,
              cashier: data.cashier,
              house: data.house,
              bet: data.bet,
              prize: data.prize,
              commission: data.commission,
              commissionDeducted: data.commission_deducted,
              status: data.status,
              voiceMode: restoredVoiceMode,
              speechLang: restoredSpeechLang,
              voiceSpeed: restoredVoiceSpeed,
            };
          });

          // ==========================================
// RESTORE CALLED NUMBERS AFTER REFRESH
// ==========================================

const restoredCalled = Array.isArray(data.calledNumbers)
  ? data.calledNumbers
  : [];

// Restore React state
setCalled(restoredCalled);

// Restore refs used by generateNumber()
calledRef.current = restoredCalled;

// Restore last called number
if (restoredCalled.length > 0) {
  setCurrent(
    restoredCalled[restoredCalled.length - 1]
  );
} else {
  setCurrent(null);
}

// ==========================================
// REBUILD REMAINING NUMBERS
// ==========================================

const calledNumberValues = new Set(
  restoredCalled.map(ball => {
    const parts = ball.trim().split(/\s+/);
    return Number(parts[1]);
  })
);

const allNumbers = Array.from(
  { length: 75 },
  (_, index) => index + 1
);

const remainingNumbers = allNumbers.filter(
  number => !calledNumberValues.has(number)
);

remainingNumbersRef.current = remainingNumbers;

// ==========================================
// LOG RESTORE
// ==========================================

console.log(
  "📦 RESTORED CALLED COUNT:",
  restoredCalled.length
);

console.log(
  "📦 RESTORED LAST BALL:",
  restoredCalled.length > 0
    ? restoredCalled[restoredCalled.length - 1]
    : null
);

console.log(
  "📦 REMAINING NUMBERS:",
  remainingNumbers.length
);
          // ✅ SUCCESS — stop retrying
          return;
        }

        // ⏳ Game hasn't been saved yet
        if (response.status === 404) {
          console.log(
            `⏳ GAME NOT READY — retrying in ${retryDelay}ms...`
          );

          if (attempt < maxAttempts) {
            await new Promise(resolve =>
              setTimeout(resolve, retryDelay)
            );
          }

          continue;
        }

        // ❌ Other server error
        console.error(
          "❌ ACTIVE GAME REQUEST FAILED:",
          response.status
        );

        return;
      }

      console.error(
        `❌ GAME ${id} NOT FOUND AFTER ${maxAttempts} ATTEMPTS`
      );

    } catch (err) {
      console.error(
        "ACTIVE GAME FETCH ERROR:",
        err
      );

    } finally {
      fetchingGameRef.current = false;
    }
  }

  fetchGameData();
}, [id]);
// --- Cleanup on Unmount ---
useEffect(() => {
  return () => {
    stopAllActiveAudio();
    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
  };
}, []);

// ============================
// SOCKET.IO REAL-TIME NUMBERS
// ============================
const socketRef = useRef(null);
const seenBallsRef = useRef(new Set());

useEffect(() => {
  if (!id) return;

  seenBallsRef.current.clear();

  if (!socketRef.current) {
    socketRef.current = io(
      "https://bingo-backend-ccn6.onrender.com",
      {
        transports: ["websocket"],
        reconnection: true,
      }
    );
  }

 const socket = socketRef.current;

const handleConnect = () => {
  console.log("🔌 CONNECTED:", socket.id);

  socket.emit("join-game", id);

  console.log(
    "🎱 JOINED GAME:",
    id
  );
};

// 🏆 RECEIVE WINNING PATTERN FROM CASHIER
const handleWinningPattern = ({ gameId, pattern }) => {
  if (gameId !== id) return;

  console.log(
    `🏆 WINNING PATTERN RECEIVED: Pattern ${pattern}`
  );

  setActiveWinningPattern(Number(pattern));
};

socket.on("winning-pattern-selected", handleWinningPattern);
 const handleNumberCalled = ({ gameId, ball }) => {

  if (gameId !== id) {
    console.log(
      "⚠️ WRONG GAME IGNORED:",
      gameId
    );
    return;
  }

  if (seenBallsRef.current.has(ball)) {
    console.log(
      "⚠️ DUPLICATE IGNORED:",
      ball
    );
    return;
  }

  seenBallsRef.current.add(ball);

  console.log(
    "📡 SOCKET NUMBER RECEIVED:",
    {
      socket: socket.id,
      game: gameId,
      ball
    }
  );

  setCalled(prev => {

    if (prev.includes(ball)) {
      return prev;
    }

    return [...prev, ball];
  });

  setCurrent(ball);
};
  socket.on("connect", handleConnect);
  socket.on(
    "number-called",
    handleNumberCalled
  );

  if (socket.connected) {
    handleConnect();
  }

  
  return () => {
  console.log(
    "🧹 CLEANING GAME SOCKET:",
    id
  );

  socket.off(
    "connect",
    handleConnect
  );

  socket.off(
    "number-called",
    handleNumberCalled
  );

  socket.off(
    "winning-pattern-selected",
    handleWinningPattern
  );

  if (socket.connected) {
    socket.emit(
      "leave-game",
      id
    );
  }
};
}, [id]);
  // --- Audio & Voice Initialization ---
  useEffect(() => {
    const updateVoices = () => {
      if (
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };

    updateVoices();

    if (
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContext) {
        const ctx = new AudioContext();

        shuffleAudioRef.current = {
          play: () => {
            if (ctx.state === "suspended") {
              ctx.resume();
            }

            const bufferSize = Math.floor(ctx.sampleRate * 1.5);

            const buffer = ctx.createBuffer(
              1,
              bufferSize,
              ctx.sampleRate
            );

            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
              data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = 1000;
            filter.Q.value = 3;

            const gain = ctx.createGain();

            gain.gain.setValueAtTime(
              0.5,
              ctx.currentTime
            );

            gain.gain.exponentialRampToValueAtTime(
              0.01,
              ctx.currentTime + 1.5
            );

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start();

            return new Promise((resolve) => {
              setTimeout(() => {
                if (
                  typeof shuffleAudioRef.current?.onended ===
                  "function"
                ) {
                  shuffleAudioRef.current.onended();
                }

                resolve();
              }, 1500);
            });
          },

          pause: () => {},

          currentTime: 0,

          onended: null
        };
      }
    } catch (e) {
      console.error(
        "Audio initialization failed:",
        e
      );

      shuffleAudioRef.current = null;
    }

    return () => {
      // Stop browser speech immediately
      if (
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }

      // Stop recorded audio immediately
      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.pause();
          activeAudioRef.current.currentTime = 0;
          activeAudioRef.current.onended = null;
          activeAudioRef.current.onerror = null;
        } catch (e) {
          console.error("Audio cleanup error:", e);
        }

        activeAudioRef.current = null;
      }

      // Stop shuffle audio
      if (shuffleAudioRef.current) {
        try {
          shuffleAudioRef.current.pause?.();
          shuffleAudioRef.current.onended = null;
        } catch (e) {
          console.error("Shuffle cleanup error:", e);
        }

        shuffleAudioRef.current = null;
      }
    };
  }, []);

// ============================================================
// 🛑 AUDIO CLEANUP
// ============================================================

// ============================================================
// 🛑 AUDIO CLEANUP
// ============================================================

// ============================================================
// 🛑 STOP AUDIO COMPLETELY
// Use ONLY when starting a NEW audio call.
// Do NOT use this during pause.
// ============================================================

// ============================================================
// 🛑 AUDIO CLEANUP
// ============================================================

function stopAndResetAudio() {
  const audio = activeAudioRef.current;

  if (!audio) {
    return;
  }

  console.log("🛑 STOPPING AUDIO:", audio.src);

  try {
    // Mark that this is an intentional stop.
    audio._intentionalStop = true;

    audio.pause();

    // This function is for COMPLETELY stopping audio,
    // NOT for pause/resume.
    audio.currentTime = 0;

    audio.onended = null;
    audio.onerror = null;

  } catch (error) {
    console.error("❌ AUDIO CLEANUP ERROR:", error);
  }

  // ==========================================================
  // DISCONNECT WEB AUDIO
  // ==========================================================

  try {
    if (audio._voiceNodes) {

      Object.values(audio._voiceNodes).forEach((node) => {

        try {
          if (
            node &&
            typeof node.disconnect === "function"
          ) {
            node.disconnect();
          }
        } catch (e) {}

      });

      audio._voiceNodes = null;
    }
  } catch (error) {
    console.warn(
      "⚠️ AUDIO NODE CLEANUP ERROR:",
      error
    );
  }

  // ==========================================================
  // CLEAR REFERENCES
  // ==========================================================

  audioSourceRef.current = null;
  bassFilterRef.current = null;

  if (activeAudioRef.current === audio) {
    activeAudioRef.current = null;
  }
}
// ============================================================
// 🎙️ VOICE DEPTH ENGINE
//
// IMPORTANT:
//
// VOICE SPEED and VOICE DEPTH are COMPLETELY INDEPENDENT.
//
// Speed controller:
//      → controls ONLY playbackRate
//
// Depth controller:
//      → controls pitch/bass/body/warmth
//
// Changing depth will NEVER modify the speed controller.
// ============================================================

// ============================================================
// 🎙️ VOICE DEPTH ENGINE
//
// IMPORTANT:
// VOICE SPEED AND VOICE DEPTH ARE COMPLETELY INDEPENDENT.
//
// Speed controller:
//     → controls audio.playbackRate ONLY
//
// Voice Depth:
//     → controls bass
//     → controls chest/body
//     → controls warmth
//     → controls compression
//
// DEPTH NEVER CHANGES playbackRate.
// ============================================================

function applyVoiceDepth(audio) {
  try {

    // ==========================================================
    // CREATE AUDIO CONTEXT
    // ==========================================================

    if (!audioContextRef.current) {
      audioContextRef.current =
        new (window.AudioContext ||
          window.webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    // ==========================================================
    // RESUME AUDIO CONTEXT
    // ==========================================================

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // ==========================================================
    // READ DEPTH
    // ==========================================================

    const rawDepth =
      Number(voiceDepthRef.current) || 0;

    // Your slider is -20 → +20
    const depth =
      Math.max(-20, Math.min(20, rawDepth));

    // ==========================================================
    // ⚠️ DO NOT TOUCH PLAYBACK RATE HERE
    // ==========================================================
    //
    // The speed controller already controls:
    //
    // audio.playbackRate = voiceSpeedRef.current
    //
    // Voice depth must NEVER modify it.
    //
    // ==========================================================

    audio.preservesPitch = true;

    // Keep whatever speed the speed controller selected.
    audio.playbackRate =
      Number(voiceSpeedRef.current) || 1;

    // ==========================================================
    // CREATE MEDIA SOURCE
    // ==========================================================

    const source =
      ctx.createMediaElementSource(audio);

    // ==========================================================
    // 🎙️ BASS / LOW FREQUENCY
    // ==========================================================

    const bassFilter =
      ctx.createBiquadFilter();

    bassFilter.type = "lowshelf";

    bassFilter.frequency.value = 120;

    // Positive depth = much more bass
    // Negative depth = less bass

    bassFilter.gain.value =
      depth * 1.15;

    // ==========================================================
    // 🎤 CHEST / VOCAL BODY
    // ==========================================================

    const bodyFilter =
      ctx.createBiquadFilter();

    bodyFilter.type = "peaking";

    bodyFilter.frequency.value = 180;

    bodyFilter.Q.value = 0.9;

    bodyFilter.gain.value =
      depth * 0.75;

    // ==========================================================
    // 🎤 LOW-MID PRESENCE
    // Makes the announcer sound thicker and bolder
    // ==========================================================

    const lowMidFilter =
      ctx.createBiquadFilter();

    lowMidFilter.type = "peaking";

    lowMidFilter.frequency.value = 280;

    lowMidFilter.Q.value = 0.8;

    lowMidFilter.gain.value =
      depth * 0.45;

    // ==========================================================
    // 🔥 WARMTH
    // ==========================================================

    const warmthFilter =
      ctx.createBiquadFilter();

    warmthFilter.type = "lowpass";

    // Keep enough high frequencies so speech stays clear.

    warmthFilter.frequency.value =
      depth > 0
        ? 7000
        : 12000;

    // ==========================================================
    // 🎚️ BROADCAST COMPRESSOR
    // ==========================================================

    const compressor =
      ctx.createDynamicsCompressor();

    compressor.threshold.value = -20;

    compressor.knee.value = 10;

    compressor.ratio.value =
      depth > 0
        ? 4.5
        : 3;

    compressor.attack.value = 0.003;

    compressor.release.value = 0.22;

    // ==========================================================
    // 🔊 OUTPUT GAIN
    // ==========================================================

    const outputGain =
      ctx.createGain();

    // Don't allow the depth control to become dangerously loud.

    const outputLevel =
      depth > 0
        ? 1.0
        : 0.95;

    outputGain.gain.value =
      outputLevel;

    // ==========================================================
    // 🔊 AUDIO CHAIN
    //
    // Audio
    //   ↓
    // Bass
    //   ↓
    // Vocal Body
    //   ↓
    // Low-Mid
    //   ↓
    // Warmth
    //   ↓
    // Compressor
    //   ↓
    // Output
    //   ↓
    // Speakers
    // ==========================================================

    source
      .connect(bassFilter)
      .connect(bodyFilter)
      .connect(lowMidFilter)
      .connect(warmthFilter)
      .connect(compressor)
      .connect(outputGain)
      .connect(ctx.destination);

    // ==========================================================
    // SAVE NODES ON AUDIO OBJECT
    // ==========================================================

    audio._voiceNodes = {
      source,
      bassFilter,
      bodyFilter,
      lowMidFilter,
      warmthFilter,
      compressor,
      outputGain
    };

    // ==========================================================
    // SAVE REFERENCES
    // ==========================================================

    audioSourceRef.current =
      source;

    bassFilterRef.current =
      bassFilter;

    // ==========================================================
    // DEBUG
    // ==========================================================

    console.log(
      "================================="
    );

    console.log(
      "🎙️ VOICE DEPTH:",
      depth
    );

    console.log(
      "⚡ VOICE SPEED:",
      voiceSpeedRef.current
    );

    console.log(
      "🎚️ PLAYBACK RATE:",
      audio.playbackRate
    );

    console.log(
      "🔊 BASS:",
      bassFilter.gain.value
    );

    console.log(
      "🎤 BODY:",
      bodyFilter.gain.value
    );

    console.log(
      "🎤 LOW-MID:",
      lowMidFilter.gain.value
    );

    console.log(
      "================================="
    );

    return audio._voiceNodes;

  } catch (error) {

    console.error(
      "❌ VOICE DEPTH ENGINE ERROR:",
      error
    );

    return null;
  }
}
// ============================================================
// 🎯 BINGO CALL PLAYBACK
// ============================================================
// ============================================================
// 🎯 BINGO CALL PLAYBACK
// ============================================================

async function playRecordedBingoCall(
  letter,
  number,
  onComplete = () => {}
) {

  // ==========================================================
  // CREATE UNIQUE GENERATION
  // ==========================================================

  const generationId =
    ++audioGenerationRef.current;

  const completeName =
    `${String(letter).trim().toLowerCase()}${String(number).trim().toLowerCase()}`;

  console.log(
    "🎯 NEW AUDIO GENERATION:",
    generationId,
    letter,
    number
  );

  // ==========================================================
  // REMEMBER THIS BALL
  //
  // VERY IMPORTANT:
  // Even if Pause happens while searching for the file,
  // we still remember which ball must resume.
  // ==========================================================

  pendingBingoCallRef.current = {
    letter,
    number,
    generationId,
    completeName
  };

  // ==========================================================
  // DO NOT PLAY WHILE PAUSED
  // ==========================================================

 
  // ==========================================================
  // STOP OLD AUDIO
  // ==========================================================

  const oldAudio =
    activeAudioRef.current;

  if (
    oldAudio &&
    !oldAudio.ended
  ) {

    console.log(
      "🛑 STOPPING OLD AUDIO:",
      oldAudio.src
    );

    try {
      oldAudio.pause();
    } catch (e) {}

  }

  // ==========================================================
  // OROMO FOLDER
  // ==========================================================

  const folder = "oromo";

  const letterName =
    String(letter)
      .trim()
      .toLowerCase();

  const numberName =
    String(number)
      .trim()
      .toLowerCase();

  const completePaths = [
    `/${folder}/${letterName}${numberName}.mp3`,
    `/${folder}/${letterName}${numberName}.wav`
  ];

  console.log(
    "🎙️ BINGO CALL:",
    `${letterName}${numberName}`
  );

  console.log(
    "🎙️ DEPTH:",
    voiceDepthRef.current
  );

  console.log(
    "⚡ SPEED:",
    voiceSpeedRef.current
  );

  // ==========================================================
  // FIND RECORDING
  // ==========================================================

  async function findCompleteRecording() {

    for (const path of completePaths) {

      // --------------------------------------------------------
      // GENERATION CHECK
      // --------------------------------------------------------

      if (
        generationId !==
        audioGenerationRef.current
      ) {

        console.log(
          "🛑 OLD AUDIO GENERATION CANCELLED:",
          generationId
        );

        return null;
      }

      // --------------------------------------------------------
      // IMPORTANT:
      //
      // DO NOT CANCEL THE PENDING BALL JUST BECAUSE GAME
      // IS PAUSED.
      //
      // We want Play to resume this SAME ball.
      // --------------------------------------------------------

      if (stateRef.current.paused) {

        console.log(
          "⏸️ PAUSED WHILE SEARCHING — KEEPING PENDING CALL:",
          completeName
        );

        return null;
      }

      try {

        const response =
          await fetch(
            path,
            {
              method: "HEAD",
              cache: "no-cache"
            }
          );

        if (response.ok) {

          console.log(
            "✅ FOUND:",
            path
          );

          return path;
        }

      } catch (error) {

        console.log(
          "❌ CHECK FAILED:",
          path
        );
      }
    }

    return null;
  }

  // ==========================================================
  // PLAY RECORDING
  // ==========================================================

  function playCompleteRecording(path, onFinished = () => {}) {

    return new Promise(
      (resolve, reject) => {

        // ====================================================
        // CHECK BEFORE CREATING AUDIO
        // ====================================================

        if (
          stateRef.current.paused
        ) {

          console.log(
            "⏸️ GAME PAUSED BEFORE AUDIO CREATION:",
            completeName
          );

          resolve({
            paused: true,
            completed: false
          });

          return;
        }

        // ====================================================
        // CHECK GENERATION
        // ====================================================

        if (
          generationId !==
          audioGenerationRef.current
        ) {

          console.log(
            "🛑 GENERATION NO LONGER CURRENT:",
            generationId
          );

          resolve({
            cancelled: true,
            completed: false
          });

          return;
        }

        // ====================================================
        // CREATE AUDIO
        // ====================================================

        const audio =
          new Audio(path);

        // ====================================================
        // VOLUME
        // ====================================================

        audio.volume =
          Math.max(
            0,
            Math.min(
              1,
              Number(volumeRef.current) || 1
            )
          );

        // ====================================================
        // SPEED
        // ====================================================

        const selectedSpeed =
          Number(voiceSpeedRef.current) || 1;

        audio.playbackRate =
          Math.max(
            0.5,
            Math.min(
              2.0,
              selectedSpeed
            )
          );

        // ====================================================
        // VOICE DEPTH
        // ====================================================

        const audioNodes =
          applyVoiceDepth(audio);

        // ====================================================
        // ACTIVE AUDIO
        // ====================================================

        activeAudioRef.current =
          audio;

        let finished = false;

        // ====================================================
        // CLEANUP
        // ====================================================

        const cleanup = () => {

          if (finished) {
            return;
          }

          finished = true;

          if (
            activeAudioRef.current === audio
          ) {

            activeAudioRef.current =
              null;
          }

          try {

            if (audio._voiceNodes) {

              Object.values(
                audio._voiceNodes
              ).forEach((node) => {

                try {

                  if (
                    node &&
                    typeof node.disconnect ===
                      "function"
                  ) {

                    node.disconnect();
                  }

                } catch (e) {}

              });

              audio._voiceNodes = null;
            }

          } catch (error) {

            console.warn(
              "⚠️ AUDIO NODE CLEANUP:",
              error
            );
          }

          if (
            audioSourceRef.current ===
            audioNodes?.source
          ) {

            audioSourceRef.current =
              null;
          }

          if (
            bassFilterRef.current ===
            audioNodes?.bassFilter
          ) {

            bassFilterRef.current =
              null;
          }

          audio.onended = null;
          audio.onerror = null;
        };

        // ====================================================
        // TIME DEBUG
        // ====================================================

        audio.addEventListener(
          "timeupdate",
          () => {

            if (
              activeAudioRef.current ===
              audio
            ) {

              console.log(
                "🎵 AUDIO TIME:",
                audio.currentTime
              );
            }

          }
        );

        // ====================================================
        // AUDIO ENDED
        // ====================================================

       audio.onended = () => {
  console.log(
    "✅ VOICE FINISHED:",
    completeName
  );

  cleanup();

  // Do NOT clear the pending call here.
  // The Bingo call completion handler owns that state.

  try {
    onFinished();
  } catch (error) {
    console.error(
      "❌ BINGO COMPLETION CALLBACK ERROR:",
      error
    );
  }

  resolve({
    completed: true
  });
};
        // ====================================================
        // AUDIO ERROR
        // ====================================================

        audio.onerror = (error) => {

          // --------------------------------------------------
          // PAUSE IS NOT AN ERROR
          // --------------------------------------------------

          if (
            stateRef.current.paused
          ) {

            console.log(
              "⏸️ AUDIO ERROR WHILE PAUSED — KEEPING AUDIO"
            );

            // DO NOT cleanup active audio here.
            // Pause/Resume still owns this object.

            resolve({
              paused: true,
              completed: false
            });

            return;
          }

          console.error(
            "❌ VOICE AUDIO ERROR:",
            path,
            error
          );

          cleanup();

          reject(
            new Error(
              `Could not play ${path}`
            )
          );
        };

        // ====================================================
        // PLAY
        // ====================================================

        audio.play()
          .then(() => {

            console.log(
              "▶️ PLAYING:",
              path
            );

            console.log(
              "🎙️ DEPTH:",
              voiceDepthRef.current
            );

            console.log(
              "⚡ SPEED:",
              voiceSpeedRef.current
            );

            console.log(
              "⚡ ACTUAL RATE:",
              audio.playbackRate
            );

            // ------------------------------------------------
            // IF PAUSE HAPPENED DURING play()
            // ------------------------------------------------

            if (
              stateRef.current.paused
            ) {

              console.log(
                "⏸️ AUDIO STARTED BUT GAME IS PAUSED"
              );

              return;
            }

          })
          .catch((error) => {

            // =================================================
            // ABORT ERROR CAUSED BY PAUSE
            // =================================================

           if (
  error?.name === "AbortError" &&
  stateRef.current.paused
) {
  console.log(
    "⏸️ PLAY INTERRUPTED BECAUSE GAME WAS PAUSED"
  );

  // IMPORTANT:
  // Pause is NOT completion.
  // Keep the playRecordedBingoCall promise alive.
  // The same audio object will continue after PLAY.
  // audio.onended will complete the call.

  return;
}

            console.error(
              "❌ AUDIO PLAY ERROR:",
              error
            );

            cleanup();

            reject(error);
          });

      }
    );
  }

  // ==========================================================
  // EXECUTE
  // ==========================================================

  try {

    const foundPath =
      await findCompleteRecording();
// ========================================================
// GENERATION CHECK AFTER AUDIO SEARCH
// ========================================================

if (
  generationId !==
  audioGenerationRef.current
) {

  console.log(
    "🛑 OLD GENERATION WILL NOT CONTINUE:",
    generationId,
    "CURRENT:",
    audioGenerationRef.current
  );

  return;
}


// ========================================================
// GAME PAUSED DURING SEARCH
// ========================================================

if (stateRef.current.paused) {

  console.log(
    "⏸️ GAME PAUSED WHILE FINDING AUDIO — KEEPING BALL:",
    completeName
  );

  pendingBingoCallRef.current = {
    letter,
    number,
    generationId,
    completeName,
    foundPath
  };

  // VERY IMPORTANT
  isDrawingBallRef.current = false;

  return;
}
    // ========================================================
    // GAME PAUSED DURING SEARCH
    // ========================================================

    if (
      stateRef.current.paused
    ) {

      console.log(
        "⏸️ GAME PAUSED WHILE FINDING AUDIO — KEEPING BALL:",
        completeName
      );

      // DO NOT CLEAR pendingBingoCallRef
      // DO NOT call onComplete
      // DO NOT generate another number

      return;
    }

    // ========================================================
    // GENERATION CHECK
    // ========================================================

    if (
      generationId !==
      audioGenerationRef.current
    ) {

      console.log(
        "🛑 OLD GENERATION WILL NOT PLAY:",
        generationId
      );

      return;
    }

    // ========================================================
    // PLAY FOUND RECORDING
    // ========================================================

    if (foundPath) {

    const result =
  await playCompleteRecording(
    foundPath,
    () => {
      console.log(
        "🔔 DIRECT AUDIO COMPLETION:",
        completeName
      );

      // This callback is intentionally only a completion signal.
      // The normal onComplete below remains responsible
      // for scheduling the next number.
    }
  );

      // ------------------------------------------------------
      // PAUSED
      // ------------------------------------------------------

    if (result?.paused) {

  console.log(
    "⏸️ CALL WAITING FOR RESUME:",
    completeName
  );

  isDrawingBallRef.current = false;

  return;
}

      // ------------------------------------------------------
      // COMPLETED
      // ------------------------------------------------------

      if (
        result?.completed
      ) {

        onComplete();
      }

    } else {

      console.error(
        `❌ NO RECORDING FOUND: ${completeName}`
      );

      // We don't want the game to silently continue.
      isDrawingBallRef.current =
        false;
    }

  } catch (error) {

  if (
    error?.name === "AbortError"
  ) {

    console.log(
      "⏸️ AUDIO ABORTED DURING PAUSE"
    );

    isDrawingBallRef.current = false;

  } else {

    console.error(
      "❌ BINGO VOICE ERROR:",
      error
    );

    isDrawingBallRef.current = false;
  }
}
 } // ==========================================================

 
function playShuffleSound(onComplete = () => {}) {
  const audioPath = "/oromo/shuffle.mp3";

  console.log("🎵 OROMO SHUFFLE:", audioPath);

 const audio = new Audio(audioPath);

// ==========================================================
// 🎵 DEBUG AUDIO POSITION
// ==========================================================

audio.addEventListener("timeupdate", () => {

  if (activeAudioRef.current === audio) {

    console.log(
      "🎵 AUDIO TIME:",
      audio.currentTime
    );

  }

});

// ==========================================================
// AUDIO SETTINGS
// ==========================================================

audio.volume =
  Number(volumeRef.current) || 1;

audio.playbackRate =
  Number(voiceSpeedRef.current) || 1;

audio.preservesPitch = true;

  activeAudioRef.current = audio;
  shuffleAudioRef.current = audio;

  audio.onended = () => {
    if (activeAudioRef.current === audio) {
      activeAudioRef.current = null;
    }

    if (shuffleAudioRef.current === audio) {
      shuffleAudioRef.current = null;
    }

    console.log("✅ OROMO SHUFFLE FINISHED");

    onComplete();
  };

  audio.onerror = () => {
    if (activeAudioRef.current === audio) {
      activeAudioRef.current = null;
    }

    if (shuffleAudioRef.current === audio) {
      shuffleAudioRef.current = null;
    }

    console.error("❌ OROMO SHUFFLE ERROR:", audioPath);

    onComplete();
  };

  audio.play()
    .then(() => {
      console.log(
        "▶️ OROMO SHUFFLE STARTED:",
        audioPath
      );
    })
    .catch((error) => {
      console.error(
        "❌ OROMO SHUFFLE PLAY ERROR:",
        error
      );

      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }

      if (shuffleAudioRef.current === audio) {
        shuffleAudioRef.current = null;
      }

      onComplete();
    });
}
  // --- Optimized Native Voice Selection ---
  function getSelectedVoice(langCode) {
    const availableVoices = voices.length ? voices : window.speechSynthesis.getVoices();
    if (!availableVoices || availableVoices.length === 0) return null;

    if (langCode === "om" || langCode === "om-ET") {
      const oromoVoice = availableVoices.find(v => v.lang.toLowerCase().includes("om") || v.lang.toLowerCase().includes("or") || v.lang.toLowerCase().includes("et"));
      if (oromoVoice) return oromoVoice;
    }

    const nativePriorities = [
      "Google UK English Male",
      "Google US English",
      "Microsoft David Online",
      "Microsoft George Online",
      "Daniel",
      "Oliver",
      "en-GB", 
      "en-US"
    ];

    for (let pattern of nativePriorities) {
      const found = availableVoices.find(v => (v.name.includes(pattern) || v.lang.includes(pattern)) && v.lang.startsWith("en"));
      if (found) return found;
    }

    return availableVoices.find(v => v.lang.startsWith("en")) || availableVoices[0];
  }

  function stopAllActiveAudio() {
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
      audioTimeoutRef.current = null;
    }
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }
    if (activeAudioRef.current) {
      activeAudioRef.current.onended = null;
      activeAudioRef.current.onerror = null;
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (shuffleAudioRef.current && typeof shuffleAudioRef.current.pause === 'function') {
      shuffleAudioRef.current.onended = null;
      shuffleAudioRef.current.pause();
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  function speakWithStyledVoice(text, onComplete = () => {}, options = {}) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onComplete();
      return;
    }

    window.speechSynthesis.resume();

    const currentGame = stateRef.current.game || game;
    const requestedLang = currentGame.speechLang || "en-US";

    const speech = new SpeechSynthesisUtterance(text);
    const selectedVoice = getSelectedVoice(requestedLang);

    if (selectedVoice) {
      speech.voice = selectedVoice;
      speech.lang = selectedVoice.lang || requestedLang;
    } else {
      speech.lang = requestedLang;
    }

    // Tuned for deep, booming, energetic, stadium-announcer delivery
    speech.rate = options.rate ?? 0.81;   // Energetic and punchy pacing
    speech.pitch = options.pitch ?? 0.90; // Deep and commanding pitch
    speech.volume = options.volume ?? 1.0; // Maximum power and volume

    speech.onend = () => {
      activeUtteranceRef.current = null;
      onComplete();
    };

    speech.onerror = () => {
      activeUtteranceRef.current = null;
      onComplete();
    };

    activeUtteranceRef.current = speech;
    window.speechSynthesis.speak(speech);
  }

 // --- Dynamic Arena Announcer Sequence ---
// --- Dynamic Arena Announcer Sequence ---
// --- Dynamic Arena Announcer Sequence ---
function speakBallSequence(
  letter,
  number,
  onSequenceFinished = () => {}
) {
  if (stateRef.current.paused) {
    console.log("⏸️ SPEAK SEQUENCE BLOCKED — GAME PAUSED");
    return;
  }

  const currentGame = stateRef.current.game || game;
  const activeVoiceMode =
    currentGame.voiceMode || currentGame.voice_mode;

  const activeSpeechLang =
    currentGame.speechLang || "en-US";

  // ==========================================
  // RECORDED OROMO
  // ==========================================
  if (activeVoiceMode === "recorded-oromo") {
    console.log(
      "🎙️ SPEAKING RECORDED OROMO:",
      letter,
      number
    );

    playRecordedBingoCall(
      letter,
      number,
      onSequenceFinished
    );

    return;
  }

  // ==========================================
  // RECORDED AMHARIC
  // ==========================================
  if (activeVoiceMode === "recorded") {
    console.log(
      "🎙️ SPEAKING RECORDED VOICE:",
      letter,
      number
    );

    playRecordedBingoCall(
      letter,
      number,
      onSequenceFinished
    );

    return;
  }

  // ==========================================
  // COMPUTER AMHARIC
  // ==========================================
  if (activeVoiceMode === "computer-amharic") {
    const amharicNumber =
      amharicPhoneticNumbers[number] ||
      String(number);

    const letterWord =
      spokenLetter[letter] || letter;

    const dramaticLetter =
      makeDramaticBingoText(letterWord);

    const dramaticNumber =
      makeDramaticBingoText(amharicNumber);

    console.log(
      `🎙️ DRAMATIC BINGO: ${letter} ${number}`
    );

    // LETTER
    speakWithStyledVoice(
      dramaticLetter,
      () => {
        if (stateRef.current.paused) {
          return;
        }

        setTimeout(() => {
          if (stateRef.current.paused) {
            return;
          }

          // NUMBER
          speakWithStyledVoice(
            dramaticNumber,
            () => {
              if (stateRef.current.paused) {
                return;
              }

              console.log(
                `🎯 DRAMATIC BINGO FINISHED: ${letter} ${number}`
              );

              onSequenceFinished();
            },
            {
              rate: 1.3,
              pitch: 0.5,
              volume: 1.0
            }
          );
        }, 450);
      },
      {
        rate: 1.2,
        pitch: 0.55,
        volume: 1.0
      }
    );

    return;
  }

  console.log(
    "⚠️ UNKNOWN VOICE MODE:",
    activeVoiceMode,
    "LANG:",
    activeSpeechLang
  );

  const playerName = footballLegends[number] || "";
  const isTwoDigit = number >= 10 && number <= 75;

  if (activeSpeechLang === "om-ET") {
    const oromoWord = afaanOromoNumbers[number] || number.toString();
    let revealText = `${letter}! ${oromoWord}!`;
    if (isTwoDigit) {
      const digits = String(number).split("");
      const separateDigitsStr = digits.map(d => afaanOromoDigitWords[d] || d).join("... ");
      revealText += `... ${separateDigitsStr}!`;
    }
    if (playerName) {
      revealText += `... ${playerName}!`;
    }

    speakWithStyledVoice(revealText, () => {
      if (!stateRef.current.paused) {
        onSequenceFinished();
      }
    }, { rate: 1.15, pitch: 0.65, volume: 1 });
    return;
  }

  // Professional live bingo cadence with dramatic pauses, deep booming voice, and maximum energy
  const fullNumberWord = number.toLocaleString("en-US");
  const letterWord = spokenLetter[letter] || letter;

  // Step 1: Call the Letter with high energy & deep booming voice
  speakWithStyledVoice(letterWord, () => {
    if (stateRef.current.paused) return;

    // Step 2: Call the Full Number with maximum force and clear pronunciation
    speakWithStyledVoice(fullNumberWord, () => {
      if (stateRef.current.paused) return;

      // Step 3: Announce separate digits and football legend nickname with booming stadium style
      let suffixParts = [];
      if (isTwoDigit) {
        const digits = String(number).split("");
        suffixParts.push(digits.map(d => digitWords[d] || d).join("... "));
      }
      if (playerName) {
        suffixParts.push(playerName);
      }

      const suffixText = suffixParts.join("... ");

      if (suffixText) {
        speakWithStyledVoice(suffixText, () => {
          if (!stateRef.current.paused) {
            onSequenceFinished();
          }
        }, { rate: 1.2, pitch: 0.6, volume: 1 });
      } else {
        if (!stateRef.current.paused) {
          onSequenceFinished();
        }
      }

    }, { rate: 1.15, pitch: 0.65, volume: 1 });

  }, { rate: 1.25, pitch: 0.7, volume: 1 });
}

function updateRunningCallInterval() {
  const audio = activeAudioRef.current;

  if (!audio || !(audio instanceof HTMLAudioElement)) {
    return;
  }

  /*
   * Cancel the old timer.
   */
  if (loopTimeoutRef.current !== null) {
    clearTimeout(loopTimeoutRef.current);
    loopTimeoutRef.current = null;
  }

  if (callIntervalTimerRef.current !== null) {
    clearTimeout(callIntervalTimerRef.current);
    callIntervalTimerRef.current = null;
  }

  /*
   * Read the NEW value immediately.
   */
  const interval =
    Number(callIntervalRef.current);

  const duration =
    Number(audio.duration || 0);

  const currentTime =
    Number(audio.currentTime || 0);

  if (!duration) {
    return;
  }

  /*
   * How much voice is still playing.
   */
  const remainingMs =
    Math.max(
      0,
      (duration - currentTime) * 1000
    );

  let delayMs;

  if (interval >= 0) {
    delayMs =
      remainingMs +
      (interval * 1000);
  } else {
    delayMs =
      Math.max(
        0,
        remainingMs +
        (interval * 1000)
      );
  }

  console.log(
    "🔄 INTERVAL CHANGED WHILE RUNNING:",
    interval,
    "SECONDS"
  );

  console.log(
    "🎵 AUDIO REMAINING:",
    (remainingMs / 1000).toFixed(2),
    "SECONDS"
  );

  console.log(
    "🚀 NEW NEXT-CALL DELAY:",
    (delayMs / 1000).toFixed(2),
    "SECONDS"
  );

  /*
   * SCHEDULE NEXT NUMBER
   */
  loopTimeoutRef.current =
    setTimeout(() => {
      loopTimeoutRef.current =
        null;

    if (stateRef.current.paused) {
  console.log("⏸️ PAUSED DURING CALL — KEEPING BALL PENDING");

  isDrawingBallRef.current = false;

  // Keep the ball so PLAY can resume it
  resumeAfterGenerationRef.current = false;

  return;
}

      console.log(
        "🚀 UPDATED INTERVAL: STARTING NEXT NUMBER"
      );

      isDrawingBallRef.current =
        false;

      generateNumber();
    }, delayMs);
}

function announceLetsGo(callback) {
  const currentGame = stateRef.current.game;
  if (currentGame.voiceMode === "recorded" ||
      currentGame.voiceMode === "recorded-oromo") {
    playRecordedAudio("letsgo", callback);
    return;
  }

  if (typeof window === "undefined" || !window.speechSynthesis) {
    callback();
    return;
  }
  window.speechSynthesis.resume();
  
  if (currentGame.voiceMode === "recorded-oromo") {
    playRecordedAudio("letsgo");
    return;
  }

  const greetingText = "Alright everyone, let's play bingo!";
  const speech = new SpeechSynthesisUtterance(greetingText);
  const selectedVoice = getSelectedVoice(currentGame.speechLang || "en-US");
  if (selectedVoice) speech.voice = selectedVoice;
  speech.rate = 0.8;
  speech.pitch = 0.65;
  speech.volume = 1.0;
  
  speech.onend = () => callback();
  speech.onerror = () => callback();
  
  window._activeUtterance = speech;
  window.speechSynthesis.speak(speech);
}

const togglePlayPause = () => {
  // ==========================================================
  // PLAY / PAUSE - STABLE SINGLE-CALL CONTROL
  // ==========================================================

  const actionId = ++playPauseActionRef.current;
  const isCurrentlyPaused = stateRef.current.paused;

  // ==========================================================
  // ⏸️ PAUSE
  // ==========================================================

  if (!isCurrentlyPaused) {
    console.log("⏸️ PAUSE");

    // IMPORTANT:
    // Update the ref immediately so every async callback
    // knows the game is paused.
    stateRef.current.paused = true;
    setPaused(true);

    // ----------------------------------------------------------
    // STOP ONLY THE NEXT-NUMBER TIMER
    // ----------------------------------------------------------

    if (loopTimeoutRef.current !== null) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;

      console.log("⏹️ NEXT NUMBER TIMER CANCELLED");
    }

    if (callIntervalTimerRef.current !== null) {
      clearTimeout(callIntervalTimerRef.current);
      callIntervalTimerRef.current = null;
    }

    // ==========================================================
    // 1. CURRENT HTML AUDIO
    // ==========================================================

    const audio = activeAudioRef.current;

    if (audio && !audio.ended) {
      const currentTime = Number(audio.currentTime) || 0;

      console.log("⏸️ PAUSING AUDIO:", audio.src);
      console.log("⏱️ SAVING POSITION:", currentTime);

      // Save the exact same Audio object.
      pausedAudioRef.current = {
        audio,
        fileName: audio.src
          .split("/")
          .pop()
          .split(".")[0]
          .toLowerCase(),
        time: currentTime,
      };

      try {
        audio.pause();
      } catch (error) {
        console.warn("⚠️ AUDIO PAUSE ERROR:", error);
      }

      // Keep this exact audio object alive.
      activeAudioRef.current = audio;

      console.log("🔒 CURRENT CALL LOCKED");
      return;
    }

    // ==========================================================
    // 2. NATIVE SPEECH
    // ==========================================================

    if (
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      activeUtteranceRef.current
    ) {
      console.log("⏸️ PAUSING NATIVE SPEECH");

      try {
        window.speechSynthesis.pause();
      } catch (error) {
        console.warn("⚠️ SPEECH PAUSE ERROR:", error);
      }

      return;
    }

    // ==========================================================
    // 3. AUDIO SEARCH / PENDING NUMBER
    // ==========================================================

    if (pendingBingoCallRef.current) {
      console.log(
        "⏸️ CURRENT NUMBER WAITING:",
        pendingBingoCallRef.current
      );

      // Do NOT remove the pending number.
      // Play will announce this SAME number.

      // Cancel any old async audio search.
      audioGenerationRef.current++;

      // The number already exists, so don't let the
      // generation lock block Play.
      isDrawingBallRef.current = false;

      console.log("🔒 PENDING NUMBER SAVED FOR RESUME");

      return;
    }

    // ==========================================================
    // 4. GENERATION STARTED BUT NO NUMBER YET
    // ==========================================================

    if (isDrawingBallRef.current) {
      console.log(
        "⏸️ GENERATION IN PROGRESS — CANCELLING CURRENT GENERATION"
      );

      generationCancelRef.current++;
      audioGenerationRef.current++;

      isDrawingBallRef.current = false;

      console.log("🛑 GENERATION CANCELLED");

      return;
    }

    console.log("⏸️ PAUSED — NOTHING CURRENTLY PLAYING");

    return;
  }

  // ==========================================================
  // ▶️ PLAY / RESUME
  // ==========================================================

  console.log("▶️ PLAY");

  // Update immediately.
  stateRef.current.paused = false;
  setPaused(false);

  // ==========================================================
  // 1. RESUME EXACT SAME PAUSED AUDIO
  // ==========================================================

  const pausedData = pausedAudioRef.current;

  if (pausedData && pausedData.audio) {
    const audio = pausedData.audio;

    // ----------------------------------------------------------
    // VERY IMPORTANT:
    //
    // Remove pausedData BEFORE calling audio.play().
    //
    // This prevents rapid Play → Play from starting multiple
    // play() promises for the same audio.
    //
    // If the user presses Pause again while play() is starting,
    // the Pause handler will create a fresh pausedData object.
    // ----------------------------------------------------------

    pausedAudioRef.current = null;

    // Make sure this is still the newest button action.
    if (actionId !== playPauseActionRef.current) {
      console.log("🛑 OLD PLAY ACTION IGNORED");
      return;
    }

    // ----------------------------------------------------------
    // Audio already finished
    // ----------------------------------------------------------

    if (audio.ended) {
      console.log("⚠️ PAUSED AUDIO ALREADY FINISHED");

      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }

      isDrawingBallRef.current = false;

      // Do NOT generate here.
      // The normal flow below will decide what to do.
    } else {
      // --------------------------------------------------------
      // Restore exact position
      // --------------------------------------------------------

      const savedTime = Number(pausedData.time) || 0;

      try {
        if (
          Number.isFinite(audio.duration) &&
          audio.duration > 0 &&
          savedTime >= 0 &&
          savedTime < audio.duration
        ) {
          audio.currentTime = savedTime;

          console.log(
            "⏱️ RESTORED AUDIO POSITION:",
            audio.currentTime
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ COULD NOT RESTORE AUDIO POSITION:",
          error
        );
      }

      // Keep same audio active.
      activeAudioRef.current = audio;

      // --------------------------------------------------------
      // Start the SAME audio
      // --------------------------------------------------------

      let resumePromise;

      try {
        resumePromise = audio.play();
      } catch (error) {
        console.error("❌ AUDIO RESUME ERROR:", error);

        // Put it back so the next Play can retry.
        if (!audio.ended) {
          pausedAudioRef.current = {
            audio,
            fileName: audio.src
              .split("/")
              .pop()
              .split(".")[0]
              .toLowerCase(),
            time: Number(audio.currentTime) || 0,
          };

          stateRef.current.paused = true;
          setPaused(true);
        }

        return;
      }

      resumePromise
        .then(() => {
          // ----------------------------------------------------
          // Ignore stale Play promises.
          // ----------------------------------------------------

          if (actionId !== playPauseActionRef.current) {
            console.log(
              "🛑 OLD RESUME PROMISE IGNORED"
            );
            return;
          }

          // ----------------------------------------------------
          // User pressed Pause while play() was starting.
          // ----------------------------------------------------

          if (stateRef.current.paused) {
            console.log(
              "⏸️ AUDIO STARTED BUT GAME IS PAUSED"
            );
            return;
          }

          console.log(
            "✅ AUDIO RESUMED:",
            audio.src,
            "TIME:",
            audio.currentTime
          );
        })
        .catch((error) => {
          // ----------------------------------------------------
          // AbortError is normal when Pause happens quickly.
          // ----------------------------------------------------

          if (error?.name === "AbortError") {
            console.log(
              "⏸️ RESUME ABORTED — PAUSE HANDLER WILL SAVE POSITION"
            );

            return;
          }

          console.error(
            "❌ AUDIO RESUME ERROR:",
            error
          );

          // Preserve current position if playback failed.
          if (!audio.ended) {
            pausedAudioRef.current = {
              audio,
              fileName: audio.src
                .split("/")
                .pop()
                .split(".")[0]
                .toLowerCase(),
              time: Number(audio.currentTime) || 0,
            };

            activeAudioRef.current = audio;

            stateRef.current.paused = true;
            setPaused(true);
          }
        });

      // ========================================================
      // VERY IMPORTANT:
      //
      // We are resuming the current number.
      // NEVER generate another number here.
      // ========================================================

      return;
    }
  }

  // ==========================================================
  // 2. RESUME NATIVE SPEECH
  // ==========================================================

  if (
    typeof window !== "undefined" &&
    window.speechSynthesis &&
    activeUtteranceRef.current
  ) {
    console.log("▶️ RESUMING NATIVE SPEECH");

    try {
      window.speechSynthesis.resume();
    } catch (error) {
      console.warn(
        "⚠️ SPEECH RESUME ERROR:",
        error
      );
    }

    return;
  }

  // ==========================================================
  // 3. ACTIVE AUDIO EXISTS
  // ==========================================================

  const activeAudio = activeAudioRef.current;

  if (
    activeAudio &&
    !activeAudio.ended
  ) {
    console.log(
      "▶️ ACTIVE AUDIO EXISTS:",
      activeAudio.src
    );

    // Only call play() if it is actually paused.
    if (activeAudio.paused) {
      let playPromise;

      try {
        playPromise = activeAudio.play();
      } catch (error) {
        console.error(
          "❌ ACTIVE AUDIO PLAY ERROR:",
          error
        );
        return;
      }

      playPromise
        .then(() => {
          if (
            actionId !== playPauseActionRef.current
          ) {
            console.log(
              "🛑 OLD ACTIVE AUDIO PLAY IGNORED"
            );
            return;
          }

          if (stateRef.current.paused) {
            console.log(
              "⏸️ AUDIO PLAYED BUT GAME IS PAUSED"
            );
            return;
          }

          console.log(
            "✅ ACTIVE AUDIO PLAYING:",
            activeAudio.currentTime
          );
        })
        .catch((error) => {
          if (error?.name === "AbortError") {
            console.log(
              "⏸️ ACTIVE AUDIO PLAY ABORTED"
            );
            return;
          }

          console.error(
            "❌ ACTIVE AUDIO PLAY ERROR:",
            error
          );
        });
    }

    // Never generate another number while current audio exists.
    return;
  }

  // ==========================================================
  // 4. GENERATION STILL IN PROGRESS
  // ==========================================================

  if (isDrawingBallRef.current) {
    console.log(
      "⏳ CALL GENERATION STILL IN PROGRESS"
    );

    return;
  }

  // ==========================================================
  // 5. PENDING BINGO CALL
  // ==========================================================

  if (pendingBingoCallRef.current) {
    const pending = pendingBingoCallRef.current;

    console.log(
      "▶️ RESUMING PENDING CALL:",
      pending
    );

    // ----------------------------------------------------------
    // IMPORTANT:
    //
    // Lock generation BEFORE starting the async audio search.
    //
    // This prevents:
    //
    // Play
    // Play
    // Play
    //
    // from launching the same pending call three times.
    // ----------------------------------------------------------

    isDrawingBallRef.current = true;

    playRecordedBingoCall(
      pending.letter,
      pending.number,
      () => {
        // ------------------------------------------------------
        // If user paused during this call:
        // ------------------------------------------------------

        if (stateRef.current.paused) {
          console.log(
            "⏸️ PENDING CALL FINISHED BUT GAME IS PAUSED"
          );

          isDrawingBallRef.current = false;

          return;
        }

        // ------------------------------------------------------
        // Current number is now completely announced.
        // ------------------------------------------------------

        pendingBingoCallRef.current = null;

        isDrawingBallRef.current = false;

        console.log(
          "✅ PENDING CALL FINISHED:",
          pending.letter,
          pending.number
        );

        // ------------------------------------------------------
        // Start next number ONLY ONCE.
        // ------------------------------------------------------

        generateNumber();
      }
    );

    return;
  }

  // ==========================================================
  // 6. NO CURRENT CALL
  // ==========================================================

  console.log(
    "▶️ NO AUDIO / NO GENERATION / NO PENDING CALL"
  );

  // ==========================================================
  // FIRST GAME SHUFFLE
  // ==========================================================

  if (!hasPlayedShuffleRef.current) {
    hasPlayedShuffleRef.current = true;

    sessionStorage.setItem(
      "bingo_shuffle_played",
      "true"
    );

    console.log(
      "🎵 PLAYING SHUFFLE — FIRST GAME START"
    );

    playShuffleSound(() => {
      if (stateRef.current.paused) {
        console.log(
          "⏸️ PAUSED DURING SHUFFLE"
        );

        return;
      }

      if (isDrawingBallRef.current) {
        console.log(
          "⏳ GENERATION ALREADY STARTED"
        );

        return;
      }

      generateNumber();
    });

    return;
  }

  // ==========================================================
  // NORMAL NEW NUMBER
  // ==========================================================

  console.log(
    "🚀 STARTING NEW NUMBER"
  );

  generateNumber();
};

// ==========================================
// END PAUSE / PLAY
// ==========================================
// ==========================================
// END PAUSE / PLAY
// ==========================================

useEffect(() => {
  const updatePhysics = () => {
    setCageBalls(prev => prev.map(ball => {
      let newX = ball.x + ball.dx * 3.2;
      let newY = ball.y + ball.dy * 3.2;
      let newDx = ball.dx;
      let newDy = ball.dy;

      const centerX = 50;
      const centerY = 50;
      const dist = Math.sqrt((newX - centerX) ** 2 + (newY - centerY) ** 2);

      if (dist > 38) {
        const angle = Math.atan2(newY - centerY, newX - centerX);
        newDx = -Math.cos(angle) * (1.5 + Math.random() * 1.5);
        newDy = -Math.sin(angle) * (1.5 + Math.random() * 1.5);
        newX = centerX + newDx * 12;
        newY = centerY + newDy * 12;
      }

      return { ...ball, x: newX, y: newY, dx: newDx, dy: newDy };
    }));
    animationRef.current = requestAnimationFrame(updatePhysics);
  };

  animationRef.current = requestAnimationFrame(updatePhysics);
  return () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };
}, [paused]);
  useEffect(() => {
  const handleOffline = () => {
    console.log("❌ OFFLINE");

    setPaused(true);

    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }

    isDrawingBallRef.current = false;
  };

  const handleOnline = () => {
    console.log("✅ INTERNET RESTORED");
  };

  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("online", handleOnline);
  };
}, []);

async function generateNumber() {
  const generationStart = Date.now();

  const myGenerationId =
    generationCancelRef.current;

  const currentGameId =
    stateRef.current.game?.game_id ||
    stateRef.current.game?.id;

  console.log(
    "🔥 GENERATE ENTERED",
    generationStart,
    "LOCK:",
    isDrawingBallRef.current,
    "CANCEL ID:",
    myGenerationId,
    "GAME:",
    currentGameId
  );

  if (stateRef.current.paused) {
    console.log(
      ">>> GENERATE BLOCKED - PAUSED"
    );
    return;
  }

  if (isDrawingBallRef.current) {
    console.log(
      "⏳ CALL GENERATION STILL IN PROGRESS"
    );
    return;
  }

  if (loopTimeoutRef.current) {
    console.log(
      ">>> GENERATE BLOCKED - LOOP ALREADY EXISTS"
    );
    return;
  }

  // =========================================================
  // MAKE SURE GAME ID EXISTS
  // =========================================================

  if (!currentGameId) {
    console.error(
      "❌ NO GAME ID AVAILABLE — CANNOT GENERATE NUMBER"
    );

    isDrawingBallRef.current = false;

    return;
  }

  // =========================================================
  // LOCK IMMEDIATELY
  // =========================================================

  isDrawingBallRef.current = true;

  // =========================================================
  // GENERATION VALIDATION
  // =========================================================

  const generationStillValid = () => {
    return (
      myGenerationId ===
        generationCancelRef.current &&
      !stateRef.current.paused
    );
  };

  try {
    // =========================================================
    // GET REMAINING NUMBERS
    // =========================================================

    const currentRemaining =
      remainingNumbersRef.current;

    if (
      !currentRemaining ||
      currentRemaining.length === 0
    ) {
      console.log(
        "🛑 NO REMAINING NUMBERS"
      );

      isDrawingBallRef.current = false;

      return;
    }

    // =========================================================
    // PICK RANDOM NUMBER
    // =========================================================

    const randomIndex = Math.floor(
      Math.random() *
        currentRemaining.length
    );

    const number =
      currentRemaining[randomIndex];

    // =========================================================
    // CHECK CANCELLATION
    // =========================================================

    if (!generationStillValid()) {
      console.log(
        "🛑 OLD GENERATION CANCELLED — STOPPING"
      );

      isDrawingBallRef.current = false;

      return;
    }

    // =========================================================
    // REMOVE NUMBER FROM REMAINING
    // =========================================================

    remainingNumbersRef.current =
      currentRemaining.filter(
        n => n !== number
      );

    // =========================================================
    // DETERMINE BINGO LETTER
    // =========================================================

    let letter = "B";

    if (number >= 16) {
      letter = "I";
    }

    if (number >= 31) {
      letter = "N";
    }

    if (number >= 46) {
      letter = "G";
    }

    if (number >= 61) {
      letter = "O";
    }

    const result =
      `${letter} ${number}`;

    // =========================================================
    // REMEMBER BALL
    // =========================================================

    seenBallsRef.current.add(result);

    // =========================================================
    // REMEMBER PENDING CALL
    // =========================================================

    pendingBingoCallRef.current = {
      letter,
      number,
      result
    };

    console.log(
      "💾 PENDING BINGO CALL:",
      pendingBingoCallRef.current
    );

    // =========================================================
    // CHECK AGAIN BEFORE STATE UPDATE
    // =========================================================

    if (!generationStillValid()) {
      console.log(
        "🛑 OLD GENERATION CANCELLED — STOPPING BEFORE STATE UPDATE"
      );

      isDrawingBallRef.current = false;

      return;
    }

    // =========================================================
    // UPDATE FRONTEND STATE
    // =========================================================

    const updatedCalled = [
      ...calledRef.current,
      result
    ];

    calledRef.current =
      updatedCalled;

    setCalled(updatedCalled);
    setCurrent(result);

    console.log(
      "🎯 CALLING NUMBER:",
      result,
      "FOR GAME:",
      currentGameId
    );

    // =========================================================
    // SAVE NUMBER TO BACKEND
    // =========================================================

    fetch(
      `${API_URL}/games/${currentGameId}/call-number`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          ball: result
        })
      }
    )
      .then(async response => {
        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            `Call-number API failed: ${response.status} ${errorText}`
          );
        }

        console.log(
          "✅ NUMBER SAVED IN BACKGROUND:",
          result
        );
      })
      .catch(err => {
        console.error(
          "❌ BACKGROUND NUMBER SAVE FAILED:",
          result,
          err
        );

        setPaused(true);

        if (
          loopTimeoutRef.current
        ) {
          clearTimeout(
            loopTimeoutRef.current
          );

          loopTimeoutRef.current =
            null;
        }

        isDrawingBallRef.current =
          false;

        alert(
          "Connection lost. Game paused."
        );
      });

    // =========================================================
    // CHECK BEFORE VOICE
    // =========================================================

    if (!generationStillValid()) {
      console.log(
        "🛑 OLD GENERATION CANCELLED — STOPPING BEFORE VOICE"
      );

      isDrawingBallRef.current = false;

      return;
    }

    // =========================================================
    // PLAY VOICE
    // =========================================================

  playRecordedBingoCall(letter, number, () => {

  console.log(
    "✅ CURRENT CALL FINISHED:",
    result
  );

  // The voice is definitely finished.
  isDrawingBallRef.current = false;

  // The number has now been fully announced.
  if (
    pendingBingoCallRef.current &&
    pendingBingoCallRef.current.letter === letter &&
    pendingBingoCallRef.current.number === number
  ) {
    pendingBingoCallRef.current = null;
  }
  // ==========================================================
  // IF PAUSED, DO NOT START THE NEXT NUMBER
  // ==========================================================

  if (stateRef.current.paused) {
    console.log(
      "⏸️ CALL FINISHED WHILE PAUSED — WAITING FOR PLAY"
    );

    return;
  }

  // ==========================================================
  // READ CURRENT CALL INTERVAL
  // ==========================================================

  const selectedSeconds =
    Number(callIntervalRef.current);

  const safeSeconds =
    Number.isFinite(selectedSeconds)
      ? selectedSeconds
      : 5;
        // =====================================================
        // PREVENT DUPLICATE TIMER
        // =====================================================

        if (
          loopTimeoutRef.current !==
          null
        ) {
          console.log(
            ">>> LOOP ALREADY SCHEDULED"
          );

          return;
        }

        // =====================================================
        // NEGATIVE = FAST CALL MODE
        // =====================================================

        if (safeSeconds < 0) {

          const overlapSeconds =
            Math.abs(
              safeSeconds
            );

          const fastDelayMs =
            Math.max(
              0,
              1000 -
                overlapSeconds *
                  1000
            );

          console.log(
            `⚡ FAST CALL MODE: ${safeSeconds}s`
          );

          console.log(
            `🚀 NEXT NUMBER STARTS IN: ${
              fastDelayMs / 1000
            } SECOND(S)`
          );

          loopTimeoutRef.current =
            setTimeout(() => {

              loopTimeoutRef.current =
                null;

              if (
                stateRef.current.paused
              ) {
                isDrawingBallRef.current =
                  false;

                return;
              }

              // Check cancellation
              if (
                myGenerationId !==
                generationCancelRef.current
              ) {
                console.log(
                  "🛑 OLD GENERATION TIMER CANCELLED"
                );

                isDrawingBallRef.current =
                  false;

                return;
              }

              isDrawingBallRef.current =
                false;

              console.log(
                "⚡ FAST CALL: STARTING NEXT NUMBER"
              );

              generateNumber();

            }, fastDelayMs);

          return;
        }

        // =====================================================
        // NORMAL / ZERO INTERVAL
        // =====================================================

        const delayMs =
          safeSeconds * 1000;

        console.log(
          `>>> NEXT NUMBER IN EXACTLY ${
            safeSeconds
          } SECOND(S)`
        );

        loopTimeoutRef.current =
          setTimeout(() => {

            loopTimeoutRef.current =
              null;

            if (
              stateRef.current.paused
            ) {
              isDrawingBallRef.current =
                false;

              return;
            }

            // Check cancellation
            if (
              myGenerationId !==
              generationCancelRef.current
            ) {
              console.log(
                "🛑 OLD GENERATION TIMER CANCELLED"
              );

              isDrawingBallRef.current =
                false;

              return;
            }

            isDrawingBallRef.current =
              false;

            console.log(
              ">>> TIMEOUT FIRED"
            );

            generateNumber();

          }, delayMs);
      }
    );

  } catch (err) {

    console.error(
      "❌ GENERATE NUMBER FAILED:",
      err
    );

    isDrawingBallRef.current =
      false;

    // Do NOT schedule another call here.
  }
}
  const checkWinner = async () => {
    if (!cartelaId.trim()) {
      alert("Please enter a Cartela ID first.");
      return;
    }

   setWinnerMessage(`Checking ${cartelaId}...`);
setVerificationStatus("CHECKING");

    try {
      const currentGame = stateRef.current.game;

      if (!currentGame) {
        alert("Game not loaded.");
        return;
      }

  const verifyGameId = currentGame?.game_id || currentGame?.id;

console.log("🔥 VERIFY GAME OBJECT:", currentGame);
console.log("🔥 VERIFY GAME ID:", verifyGameId);

if (!verifyGameId) {
  console.error("❌ MISSING game_id/id:", currentGame);
  setWinnerMessage("Game ID missing");
  return;
}

const response = await fetch(
  `${API_URL}/games/${verifyGameId}/verify-cartela`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cartelaId: cartelaId.trim(),
    }),
  }
);

const verificationData = await response.json();

if (!verificationData.sold) {
  setWinnerMessage(`ID ${cartelaId} NOT SOLD!`);
  setVerificationStatus("NOT_SOLD");

  if (
    currentGame.voiceMode === "recorded" ||
    currentGame.voiceMode === "recorded-oromo"
  ) {
    playRecordedAudio("notsold");
  } else {
    stopAllActiveAudio();

    const speech = new SpeechSynthesisUtterance(
      `Cartela ${cartelaId} not sold.`
    );

    speech.pitch = 0.65;
    speech.rate = 1.15;

    window.speechSynthesis.speak(speech);
  }

  return;
}

setCheckedCartela(verificationData.cartela);
setWinningCells(
  verificationData.winningCells || []
);

      if (verificationData.isWinner) {
        let patternName = "🎉 LINE BINGO!";

        if (verificationData.isFullHouse) {
          patternName = "🎉 FULL HOUSE!";
        } else if (verificationData.isFourCorners) {
          patternName = "⭐ FOUR CORNERS!";
        }

        setWinnerMessage(patternName);
        setVerificationStatus("WINNER");

        if (currentGame.voiceMode === "recorded" ||
  currentGame.voiceMode === "recorded-oromo") {
          playRecordedAudio("winner");
        } else {
          stopAllActiveAudio();
          const speech = new SpeechSynthesisUtterance(`Bingo! Cartela ${cartelaId} is a winner!`);
          speech.pitch = 0.6;
          speech.rate = 1.2; 
          window.speechSynthesis.speak(speech);
        }
      } else {
        setWinnerMessage("❌ No Bingo");
        setVerificationStatus("NOT_WINNER");

        if (currentGame.voiceMode === "recorded" ||
  currentGame.voiceMode === "recorded-oromo") {
          playRecordedAudio("notwinner");
        } else {
          stopAllActiveAudio();
          const speech = new SpeechSynthesisUtterance(`Cartela ${cartelaId} is not a winner yet.`);
          speech.pitch = 0.65;
          speech.rate = 1.15;
          window.speechSynthesis.speak(speech);
        }
      }
    } catch (err) {
      console.error("Verification Error:", err);
      setWinnerMessage("Verification error");
    }
  };

  const closeVerificationBoard = () => {
    setCheckedCartela(null);
    setVerificationStatus("");
    setWinnerMessage("");
    setCartelaId("");
  };

  async function reset() {
    stopAllActiveAudio();
    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    setCurrent("");
    setCalled([]);
    setWinnerMessage("");
    setCheckedCartela(null);
    setVerificationStatus("");
    remainingNumbersRef.current = Array.from({ length: 75 }, (_, i) => i + 1);
    setPaused(true);
    setCartelaId("");
    hasAnnouncedLetsGo.current = false;

    try {
      await fetch(`https://bingo-backend-ccn6.onrender.com/api/games/${game.id}/reset`, { method: "POST" });
    } catch (err) {
      console.error("Error resetting game state on server:", err);
    }
  }

  const getRowNumbers = (letter) => {
    const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
    const [start, end] = ranges[letter];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const isNumberCalled = (letter, num) => {
    return called.includes(`${letter} ${num}`);
  };

  const incomingHistoryBalls = called.length > 1 ? [...called].reverse().slice(1, 6) : [];
  // ============================================
  // AUTO CALL NUMBER API
  // ============================================
 

  
  // Auto-call every 6 seconds when NOT paused


  

 return (
  <div className={`bingo-wrapper ${tvMode ? 'tv-viewport' : ''}`}>

    {/* SMALL BACK BUTTON */}
    <button
      type="button"
      onClick={() => {
        // Stop the current game
        setPaused(true);

        // Stop any scheduled next-number timer
        if (loopTimeoutRef.current) {
          clearTimeout(loopTimeoutRef.current);
          loopTimeoutRef.current = null;
        }

        // Stop active audio
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
          activeAudioRef.current.currentTime = 0;
          activeAudioRef.current = null;
        }

        // Release drawing lock
        isDrawingBallRef.current = false;

        // Return to Cashier
        navigate(-1);
      }}
      style={{
        position: "absolute",
        top: "6px",
        left: "6px",
        zIndex: 9999,

        width: "28px",
        height: "28px",

        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.25)",

        background: "rgba(10,20,35,0.85)",
        color: "#ffffff",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        fontSize: "17px",
        fontWeight: "bold",

        cursor: "pointer",

        padding: 0,
        lineHeight: 1,

        boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
      }}
      title="Back to Cashier"
    >
      ←
    </button>

    <div 
      className="bingo-container"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        margin: 0,
        padding: 0
      }}
    >

        {/* --- 1. BINGO BOARD --- */}
        <section className="board-section" style={{ margin: 0, padding: 0 }}>
          <div className="bingo-board">
            {['B', 'I', 'N', 'G', 'O'].map((letter) => (
              <div key={letter} className="board-row">
                <div className={`letter-header ${letter.toLowerCase()}`}>{letter}</div>
                <div className="row-numbers">
                  {getRowNumbers(letter).map((num) => {
                    const active = isNumberCalled(letter, num);
                    const activeClass = active ? `active-${letter.toLowerCase()}` : '';
                    return (
                      <div key={num} className={`number-cell ${activeClass}`}>
                        {num}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 2. LEFT | MIDDLE | RIGHT DASHBOARD (TOUCHES BINGO BOARD IMMEDIATELY) --- */}
        <div 
          className="main-display" 
          style={{
            margin: '0',
            padding: '0',
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr 1fr',
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
         
          {/* 1. Left Wing: Check Winner Interface */}
          <div
            className="left-panel"
            style={{
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              height: "100%",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <input
                type="text"
                value={cartelaId}
                onChange={(e) => setCartelaId(e.target.value)}
                placeholder={t.cardIdPlaceholder}
                style={{
                  background: "rgba(12, 22, 45, 0.85)",
                  border: "1.5px solid #00ff37",
                  color: "#ffffff",
                  borderRadius: "30px",
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  outline: "none",
                  textAlign: "center",
                  height: "22px",
                  boxShadow: "0 0 8px rgba(0, 255, 55, 0.25)",
                }}
              />

              <button
                className="ctrl-btn green-border"
                style={{
                  justifyContent: "center",
                  padding: "2px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
                  borderRadius: "30px",
                  height: "22px",
                  boxShadow: "0 0 10px rgba(0, 255, 55, 0.3)",
                  cursor: "pointer"
                }}
                onClick={checkWinner}
              >
                <span>{t.verifyCard}</span>
              </button>
            </div>

            <div
              className="info-card"
              style={{
                padding: "6px",
                background: "rgba(13, 29, 45, 0.6)",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(4px)",
                boxShadow: "0 0 12px rgba(0, 200, 255, 0.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <button
                  className="ctrl-btn gold-border"
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: "800",
                    flex: 1,
                    justifyContent: "center",
                    borderRadius: "100px",
                    height: "26px",
                    color: "#000000",
                    boxShadow: "0 0 10px rgba(0, 200, 255, 0.4)",
                    cursor: "pointer"
                  }}
                  onClick={togglePlayPause}
                >
                  <span>{paused ? t.play : t.pause}</span>
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "4px" }}>
                <div
                  style={{
                    fontSize: "22px",
                    color: "#a0aec0",
                    fontWeight: "bold",
                    letterSpacing: "1px"
                  }}
                >
                  የጨዋታው ደራሽ
                </div>

                <div
                  style={{
                    fontSize: "40px",
                    color: "#00f0ff",
                    fontWeight: "900",
                    textShadow: "0 0 12px rgba(0, 240, 255, 0.5)",
                    lineHeight: "1.1"
                  }}
                >
                  {game.netIncome ? game.netIncome : game.prize} ብር
                </div>
              </div>
            </div>
          </div>

          {/* CENTER AREA: WINNING PATTERN (LEFT) + ROLLING MACHINE (RIGHT) */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              width: "100%",
            }}
          >   
            {checkedCartela && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 9999,
                  background: "rgba(0, 0, 0, 0.65)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "8px",
                  boxSizing: "border-box",
                }}
              >
                {/* MEDIUM VERIFICATION CARTELA */}
                <div
                  style={{
                    position: "relative",
                    width: "min(92vw, 480px)",
                    background: "#090f1d",
                    border:
                      verificationStatus === "WINNER"
                        ? "3px solid #00ff66"
                        : verificationStatus === "CHECKING"
                          ? "3px solid #00c8ff"
                          : "3px solid #ff3344",
                    borderRadius: "14px",
                    padding: "10px 12px 10px",
                    boxSizing: "border-box",
                    boxShadow:
                      verificationStatus === "WINNER"
                        ? "0 0 30px rgba(0,255,102,0.3)"
                        : "0 0 30px rgba(255,51,68,0.25)",
                  }}
                >
                  {/* CLOSE */}
                  <button
                    onClick={closeVerificationBoard}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "9px",
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: "#182236",
                      border: "1px solid #475569",
                      color: "#fff",
                      fontSize: "16px",
                      fontWeight: "900",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>

                  {/* STATUS */}
                  <div
                    style={{
                      textAlign: "center",
                      marginBottom: "6px",
                      paddingRight: "30px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "900",
                        color:
                          verificationStatus === "WINNER"
                            ? "#00ff66"
                            : "#ff3344",
                      }}
                    >
                      {verificationStatus === "WINNER"
                        ? `🎉 ${t.winner}!`
                        : "❌ NO BINGO YET"}
                    </div>

                    <div
                      style={{
                        marginTop: "1px",
                        fontSize: "12px",
                        color: "#94a3b8",
                        fontWeight: "700",
                      }}
                    >
                      Cartela #{checkedCartela.id || checkedCartela.cartelaId}
                    </div>
                  </div>

                  {/* B I N G O HEADER */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5, 1fr)",
                      gap: "4px",
                      marginBottom: "4px",
                    }}
                  >
                    {["B", "I", "N", "G", "O"].map((letter, index) => (
                      <div
                        key={index}
                        style={{
                          height: "26px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "6px",
                          background: "#111c31",
                          border: "2px solid #00c8ff",
                          color: "#00c8ff",
                          fontSize: "16px",
                          fontWeight: "900",
                        }}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>

                  {/* CARTELA */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5, 1fr)",
                      gap: "4px",
                    }}
                  >
                    {checkedCartela.matrix.map((row, rIdx) =>
                      row.map((cell, cIdx) => {
                        const isFree = cell === "FREE";

                        const isWinnerCell =
                          winningCells.includes(`${rIdx}-${cIdx}`);

                        let num = cell;

                        if (!isFree) {
                          if (typeof cell === "string") {
                            const parts = cell.trim().split(/\s+/);
                            num = parts[1] || cell;
                          }

                          num = Number(num);
                        }

                        const isCalled =
                          !isFree &&
                          called.some((item) => {
                            const parts = String(item).trim().split(/\s+/);

                            const calledNumber =
                              parts.length > 1
                                ? Number(parts[1])
                                : Number(parts[0]);

                            return calledNumber === num;
                          });

                        return (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            style={{
                              height: "38px",
                              background: isFree
                                ? "#FFD700"
                                : isWinnerCell
                                ? "#FF0000"
                                : isCalled
                                ? "#00C853"
                                : "#1E293B",
                              color: isFree ? "#000" : "#fff",
                              border: isWinnerCell
                                ? "2px solid #FF6666"
                                : isCalled
                                ? "2px solid #00ff66"
                                : isFree
                                ? "2px solid #FFD700"
                                : "1px solid #334155",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              boxSizing: "border-box",
                              boxShadow: isWinnerCell
                                ? "0 0 14px rgba(255,0,0,0.8)"
                                : isCalled
                                ? "0 0 10px rgba(0,255,102,0.5)"
                                : "none",
                            }}
                          >
                            {/* CHECK MARK */}
                            {isCalled && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "2px",
                                  right: "3px",
                                  width: "13px",
                                  height: "13px",
                                  borderRadius: "50%",
                                  background: "#00ff66",
                                  color: "#000",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "9px",
                                  fontWeight: "900",
                                }}
                              >
                                ✓
                              </div>
                            )}

                            {/* NUMBER */}
                            <span
                              style={{
                                fontSize: isFree ? "11px" : "18px",
                                fontWeight: "900",
                                lineHeight: "1",
                              }}
                            >
                              {isFree ? "FREE" : num}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* LEGEND */}
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      justifyContent: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#cbd5e1",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          background: "#00C853",
                          border: "1.5px solid #00ff66",
                          borderRadius: "2px",
                        }}
                      />
                      Called
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          background: "#1E293B",
                          border: "1px solid #334155",
                          borderRadius: "2px",
                        }}
                      />
                      Not Called
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          background: "#FFD700",
                          borderRadius: "2px",
                        }}
                      />
                      Free
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* 1. LEFT SIDE: WINNING PATTERN PREVIEW */}
            {activeWinningPattern && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  animation: "winningPatternPulse 1.5s ease-in-out infinite",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "900",
                    color: "#ffd700",
                    letterSpacing: "1px",
                  }}
                >
             🏆 {activeWinningPattern} PATTERN
{activeWinningPattern > 1 ? "S" : ""}
                </div>

                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "3px",
                    padding: "5px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "2px solid #ffd700",
                    boxShadow: "0 0 15px rgba(255, 215, 0, 0.5)",
                    boxSizing: "border-box",
                  }}
                >
                  {Array.from({ length: 25 }).map((_, index) => {
                    const row = Math.floor(index / 5);
                    const col = index % 5;
                    const cellKey = `${row}-${col}`;

                    const highlighted =
                      displayedWinningPatterns?.includes(cellKey) ?? false;

                    return (
                      <div
                        key={index}
                        style={{
                          borderRadius: "2px",
                         background:
  row === 2 && col === 2
    ? "#22c55e"   // ⭐ CENTER / FREE SPACE
    : highlighted
      ? "#ffd700" // 🏆 Winning pattern
      : "rgba(100, 116, 139, 0.25)",
                          boxShadow: highlighted
                            ? "0 0 7px rgba(255, 215, 0, 0.9)"
                            : "none",
                          transition: "all 0.3s ease",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. RIGHT SIDE: ROLLING MACHINE CAGE */}
            <div className="cage-container">
              <div className="cage-sphere">
                <div className="glass-reflection-light"></div>
                <div className="glass-reflection-dark"></div>

                {cageBalls?.map((ball) => (
                  <div
                    key={ball.id}
                    className="mini-ball"
                    style={{
                      left: `${ball.x}%`,
                      top: `${ball.y}%`,
                      backgroundColor: ball.color,
                    }}
                  >
                    <span className="mini-ball-num">{ball.num}</span>
                  </div>
                ))}
              </div>

              <div className="machine-handle"></div>
              <div className="ball-exit">
                {current && (
                  <div className="called-ball">
                    {current.includes(" ") ? current.split(" ")[1] : current}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Right Wing: High-Visibility Current Called Display */}
         <div
  className="ball-column"
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "200%",
    height: "200px",
    boxSizing: "border-box",
    borderLeft: "1px solid rgba(255,255,255,0.05)",
  }}
>
            <span style={{ fontSize: '17px', fontWeight: 'bold', color: '#ff5aa5', letterSpacing: '1px', marginBottom: '2px' }}>
              {t.currentBall}
            </span>
            
            <div className="current-ball-display">
              <div className="neon-ball-inner">
                {current ? (
                  <>
                    <span className="ball-letter">{current.split(" ")[0]}</span>
                    <span className="ball-number">{current.split(" ")[1]}</span>
                  </>
                ) : (
                  <span className="ball-letter" style={{ fontSize: '18px', letterSpacing: '0.5px', color: '#8c9cb3' }}>
                    {t.ready}
                  </span>
                )}
              </div>
            </div>

            <div className="indicator-dots" style={{ marginTop: '2px', gap: '3px', display: 'flex' }}>
              <div className="dot" style={{ width: '4px', height: '4px', background: !paused ? '#00ff66' : '#8c9cb3' }} />
              <div className="dot" style={{ width: '4px', height: '4px', background: !paused ? '#00ff66' : '#8c9cb3' }} />
            </div>
          </div>

        </div>

        {/* --- 3. CALLED BALL HISTORY (TOUCHES DASHBOARD IMMEDIATELY) --- */}
        <div
          className="called-section"
          style={{
            width: "100%",
            margin: "0",
            padding: "6px",
            boxSizing: "border-box",
            background: "rgba(0,0,0,0.25)",
            borderRadius: "0 0 10px 10px",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              marginBottom: "5px",
              color: "#8c9cb3",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            ({called.length}/75)
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "6px",
              alignItems: "center",
              minHeight: "52px",
              width: "100%",
              overflow: "hidden",
            }}
          >
            {incomingHistoryBalls.length > 0 ? (
              incomingHistoryBalls.map((ballStr, idx) => {
                const parts = String(ballStr).trim().split(/\s+/);
                const letter = parts[0];
                const num = parts[1];

                const theme =
                  columnColorStyles[letter] || {
                    border: "2px solid #fff",
                    labelBg: "#fff",
                    textShadow: "0 0 5px #fff",
                  };

                return (
                  <div
                    key={`${ballStr}-${idx}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#0d162d",
                      border: theme.border,
                      borderRadius: "5px",
                      width: "60px",
                      height: "60px",
                      flexShrink: 0,
                      position: "relative",
                      opacity: Math.max(0.45, 1 - idx * 0.12),
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        background: theme.labelBg,
                        color: "#000",
                        fontSize: "18px",
                        fontWeight: "900",
                        textAlign: "center",
                        lineHeight: "15px",
                        borderRadius: "3px 3px 0 0",
                      }}
                    >
                      {letter}
                    </div>

                    <div
                      style={{
                        fontSize: "40px",
                        fontWeight: "900",
                        color: "#fff",
                        textShadow: theme.textShadow,
                        marginTop: "8px",
                      }}
                    >
                      {num}
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  fontSize: "15px",
                  color: "#4b5970",
                  fontStyle: "italic",
                }}
              >
                {t.waitingToBegin}
              </div>
            )}
          </div>
        </div>

        {/* --- 4. REMAINING UI / FOOTER CONSOLE BAR (TOUCHES CALLED BALLS IMMEDIATELY) --- */}
        <footer 
          className="game-top-bar" 
          style={{ 
            display: 'flex', 
            justify: 'space-between', 
            alignItems: 'center', 
            background: 'rgba(0,0,0,0.3)',
            margin: '0',
            padding: '6px'
          }}
        >
          <div className="call-interval-control">
            <div className="call-interval-header">
              <span>CALL SPEED</span>
              <div className="call-interval-adjust">
                {/* MINUS */}
                <button
                  type="button"
                  className="interval-minus"
                  onClick={() => {
                    const current = Number(callInterval);
                    const safeCurrent = Number.isFinite(current) ? current : 5;
                    const newValue = Math.max(0, safeCurrent - 1);
                    setCallInterval(newValue);
                    console.log("➖ CALL SPEED:", newValue, "SECONDS");
                  }}
                >
                  −
                </button>

                {/* VALUE */}
                <strong className="interval-value">
                  {Number(callInterval)}s
                </strong>

                {/* PLUS */}
                <button
                  type="button"
                  className="interval-plus"
                  onClick={() => {
                    const current = Number(callInterval);
                    const safeCurrent = Number.isFinite(current) ? current : 5;
                    const newValue = Math.min(15, safeCurrent + 1);
                    setCallInterval(newValue);
                    console.log("➕ CALL SPEED:", newValue, "SECONDS");
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>🔊 Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(volume * 100)}
              onChange={(e) => {
                const newVolume = Number(e.target.value) / 100;
                setVolume(newVolume);
                volumeRef.current = newVolume;
                if (activeAudioRef.current) {
                  activeAudioRef.current.volume = newVolume;
                }
              }}
              style={{
                width: "130px",
                cursor: "pointer",
              }}
            />
            <span style={{ minWidth: "45px" }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
 <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#fff", fontWeight: "600" }}>
              Voice Speed
            </span>
            <button
              onClick={decreaseVoiceSpeed}
              style={{
                padding: "6px 12px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              −
            </button>
            <span style={{
              minWidth: "50px",
              textAlign: "center",
              color: "#fff",
              fontWeight: "bold"
            }}>
              {voiceSpeed.toFixed(1)}×
            </span>
            <button
              onClick={increaseVoiceSpeed}
              style={{
                padding: "6px 12px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              +
            </button>
          </div>

         
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
           <div style={{
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px"
}}>
  <span style={{
    fontSize: "11px",
    fontWeight: "bold",
    color: "#00f0ff"
  }}>
    🎙️ VOICE DEPTH
  </span>

  <input
    type="range"
    min="-20"
    max="40"
    step="1"
    value={voiceDepth}
    onChange={(e) => {
      const value = Number(e.target.value);

      setVoiceDepth(value);
      voiceDepthRef.current = value;

      const cashierId =
        localStorage.getItem("logged_in_cashier");

      if (cashierId) {
        localStorage.setItem(
          `cashier_voice_depth_${cashierId}`,
          String(value)
        );
      }

      console.log("🎙️ NEW VOICE DEPTH:", value);
    }}
    style={{
      width: "120px",
      height: "6px",
      cursor: "pointer"
    }}
  />

  <span style={{
    fontSize: "10px",
    color: "#ffd700"
  }}>
    {voiceDepth > 0
      ? `Deep +${voiceDepth}`
      : voiceDepth < 0
      ? `High ${voiceDepth}`
      : "Normal"}
  </span>
</div>
            {/* Voice Mode Selector */}
            <select
              value="recorded-oromo"
              onChange={() => {
                setGame(prev => ({
                  ...prev,
                  voiceMode: "recorded-oromo",
                  speechLang: "oromo"
                }));
              }}
              style={{
                background: '#0c162d',
                border: '1px solid #00c8ff',
                color: '#fff',
                borderRadius: '4px',
                padding: '2px 4px',
                fontSize: '9px',
                fontWeight: 'bold',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="recorded-oromo">
                🟢 voice
              </option>
            </select>
          </div>
        </footer>

    </div>
  </div>
);   } 