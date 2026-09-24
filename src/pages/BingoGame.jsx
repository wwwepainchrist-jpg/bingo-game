import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { API_URL } from "../config";
import "./BingoGame.css";
import { io } from "socket.io-client";
import {
  saveCalledBallOffline,
  saveGameOffline,
} from "../offline/offlineService";
import { offlineDB } from "../offline/db";
  // Add this if not already imported
// --- Phonetic & Legend Data ---
// ==========================================================
// 🎙️ DRAMATIC BINGO ANNOUNCER
// Makes the existing pronunciation longer and more dramatic
// ==========================================================

// ==========================================================
// 🎙️ FAST BINGO ANNOUNCER
// Short vowel extension — energetic, NOT slow
// ==========================================================

// --- Afaan Oromo Number Words ---








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

  const location = useLocation();

  const passedGame = location.state?.game;

  // ============================================================
// 🎙️ GET PERMANENT CASHIER VOICE
// ============================================================

function getSavedCashierVoice() {
  try {
    const currentUserRaw =
      localStorage.getItem("currentUser");

    if (!currentUserRaw) {
      return "recorded-oromo";
    }

    const currentUser =
      JSON.parse(currentUserRaw);

    const cashierId = currentUser?.username;

    if (!cashierId) {
      return "recorded-oromo";
    }

    const voiceKey =
      `cashier_voice_selection_${cashierId}`;

    const savedVoice =
      localStorage.getItem(voiceKey);

    const validVoices = [
      "recorded-oromo",
      "voice2",
      "voice3",
      "voice4",
      "voice5",
      "voice6",
    ];

    if (validVoices.includes(savedVoice)) {
      console.log(
        "🎙️ INITIAL CASHIER VOICE:",
        savedVoice
      );

      return savedVoice;
    }

    return "recorded-oromo";

  } catch (error) {
    console.error(
      "❌ FAILED TO LOAD CASHIER VOICE:",
      error
    );

    return "recorded-oromo";
  }
}

  const [game, setGame] = useState(() => {
  const initialVoice = getSavedCashierVoice();

  return {
    prize: "00 Birr",
    id: id || "101",
    soldCartelas: passedGame?.soldCartelas || [],
    voiceMode: initialVoice,
    speechLang:
      initialVoice === "recorded-oromo"
        ? "om-ET"
        : "en-US",
    language: "en",
  };
});

  // ============================================================
// 🎙️ PERMANENT VOICE FOR THIS CASHIER
// ============================================================



  // ============================================================
// 🎙️ LOAD SAVED VOICE FOR THIS CASHIER
// ============================================================


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
// ============================================================
// 🎵 NEXT BINGO AUDIO PRELOADER
// Keeps the next ball's MP3 ready before it is displayed.
// ============================================================
// ============================================================
// 🎵 NEXT BINGO BALL / AUDIO PRELOAD
// ============================================================
const nextBingoBallRef = useRef(null);
const nextBingoAudioRef = useRef(null);
const nextBingoAudioPathRef = useRef(null);
const nextBingoAudioReadyRef = useRef(false);

  const [cageBalls, setCageBalls] = useState(INITIAL_BALLS);
 const [blinkingNumber, setBlinkingNumber] = useState(null);

const firstGamePlayRef = useRef(true);
const bingoBlinkIntervalRef = useRef(null);
const bingoBlinkTimeoutRef = useRef(null);

// ==========================================================
// 🎰 FIRST GAME ROLLING EFFECT
// Runs ONLY once at the beginning of each new game
// ==========================================================
// ==========================================================
// 🎰 RANDOM BINGO NUMBER BLINK
// ONLY ON FIRST PLAY OF A NEW GAME
// ==========================================================

// ==========================================================
// 🎰 RANDOM BINGO BOARD BLINK
// ONLY DURING INITIAL SHUFFLE
// ==========================================================

const startRandomBingoBlink = () => {
  // Only first play of a NEW game
  if (!firstGamePlayRef.current) {
    return;
  }

  // Clean up anything left over
  if (bingoBlinkTimeoutRef.current) {
    clearTimeout(bingoBlinkTimeoutRef.current);
    bingoBlinkTimeoutRef.current = null;
  }

  if (bingoBlinkIntervalRef.current) {
    clearInterval(bingoBlinkIntervalRef.current);
    bingoBlinkIntervalRef.current = null;
  }

  console.log("🎰 BOARD BLINK TIMER STARTED");

  // Wait 2 seconds
  bingoBlinkTimeoutRef.current = setTimeout(() => {

    if (stateRef.current.paused) {
      console.log("⏸️ BLINK NOT STARTED - GAME PAUSED");
      return;
    }

    if (!firstGamePlayRef.current) {
      return;
    }

    console.log("🎰 RANDOM NUMBER BLINK STARTED");

    bingoBlinkIntervalRef.current = setInterval(() => {

      if (
        stateRef.current.paused ||
        !firstGamePlayRef.current
      ) {
        return;
      }

      const randomNumber =
        Math.floor(Math.random() * 75) + 1;

      setBlinkingNumber(randomNumber);

    }, 180);

  }, 2000);
};


const stopRandomBingoBlink = () => {

  console.log("🛑 STOPPING RANDOM NUMBER BLINK");

  if (bingoBlinkTimeoutRef.current) {
    clearTimeout(bingoBlinkTimeoutRef.current);
    bingoBlinkTimeoutRef.current = null;
  }

  if (bingoBlinkIntervalRef.current) {
    clearInterval(bingoBlinkIntervalRef.current);
    bingoBlinkIntervalRef.current = null;
  }

  setBlinkingNumber(null);

  // IMPORTANT:
  // This game has now used its initial rolling effect.
  firstGamePlayRef.current = false;
};
  const hasAnnouncedLetsGo = useRef(false);
  const animationRef = useRef(null);
  const shuffleAudioRef = useRef(null);
  const isDrawingBallRef = useRef(false);
  const loopTimeoutRef = useRef(null);
const audioGenerationInProgressRef = useRef(false);
const audioLoadingRef = useRef(false);
  const remainingNumbersRef = useRef(Array.from({ length: 75 }, (_, i) => i + 1));
 const lastGenerationTimeRef = useRef(0);
 const startupTimeoutRef = useRef(null);
  const activeAudioRef = useRef(null);
  const pausedAudioRef = useRef(null);
  const audioTimeoutRef = useRef(null);
  const audioGenerationRef = useRef(0);
  const calledRef = useRef(called);
  const stateRef = useRef({ called, paused, speed, current, game });
  const [volume, setVolume] = useState(0.7);
  const volumeRef = useRef(0.7);
 const [audioCurrentTime, setAudioCurrentTime] = useState(0);
const [audioDuration, setAudioDuration] = useState(0);
const preloadedVoicesCacheRef = useRef({}); // Tracks { [path]: audioObject }

  const selectedWinningPattern =
  location.state?.winningPatternCount ??
  location.state?.game?.winningPatternCount ??
  1;
  const [activeWinningPattern, setActiveWinningPattern] =
  useState(selectedWinningPattern);

  const [showSoldCartelas, setShowSoldCartelas] = useState(false);

const soldCartelaSource =
  Array.isArray(passedGame?.soldCartelas)
    ? passedGame.soldCartelas
    : Array.isArray(game?.soldCartelas)
      ? game.soldCartelas
      : [];

const soldCartelaIds = soldCartelaSource
  .map(cartela =>
    Number(
      typeof cartela === "object"
        ? cartela.id
        : cartela
    )
  )
  .filter(Number.isFinite)
  .sort((a, b) => a - b);
const [voiceSpeed, setVoiceSpeed] = useState(1.0);
const voiceSpeedRef = useRef(1.0);
const TARGET_GENERATION_INTERVAL_MS = 400;
const [winningCells, setWinningCells] = useState([]);
const [displayedWinningPatterns, setDisplayedWinningPatterns] = useState([]);
const audioContextRef = useRef(null);
const audioSourceRef = useRef(null);
const bassFilterRef = useRef(null);
const [showGameControls, setShowGameControls] = useState(false);
const SHUFFLE_PLAYED_KEY = "bingo_shuffle_played";
const pendingBingoCallRef = useRef(null);
const playPauseActionRef = useRef(0);
// Add this near your other useRef allocations at the top
const globalAudioInstanceRef = useRef(null);

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
  // 1. BASE PATTERNS GENERATION
  // ============================================================

  const horizontalPatterns = [];
  for (let row = 0; row < 5; row++) {
    const cells = [];
    for (let col = 0; col < 5; col++) {
      cells.push(`${row}-${col}`);
    }
    horizontalPatterns.push(cells);
  }

  const verticalPatterns = [];
  for (let col = 0; col < 5; col++) {
    const cells = [];
    for (let row = 0; row < 5; row++) {
      cells.push(`${row}-${col}`);
    }
    verticalPatterns.push(cells);
  }

  const diagonalPatterns = [
    ["0-0", "1-1", "2-2", "3-3", "4-4"],
    ["0-4", "1-3", "2-2", "3-1", "4-0"],
  ];

  const cornerPatterns = [
    ["0-0", "0-4", "4-0", "4-4"],
    ["1-1", "1-3", "3-1", "3-3"],
  ];

  const fullHousePattern = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      fullHousePattern.push(`${row}-${col}`);
    }
  }

  // 14 distinct patterns total in the pool
  const basePatternsPool = [
    ...horizontalPatterns,
    ...verticalPatterns,
    ...diagonalPatterns,
    ...cornerPatterns,
  ];

  // ============================================================
  // 2. DETERMINE COMBINATIONS BASED ON SELECTION
  // ============================================================

  let combinations = [];
  const choice = String(activeWinningPattern).toLowerCase().trim();

  if (choice === "horizontal" || choice === "row" || choice === "rows") {
    combinations = horizontalPatterns;
  } else if (choice === "vertical" || choice === "column" || choice === "columns") {
    combinations = verticalPatterns;
  } else if (choice === "diagonal" || choice === "diagonals") {
    combinations = diagonalPatterns;
  } else if (choice === "corners" || choice === "corner") {
    combinations = cornerPatterns;
  } else if (choice === "full_house" || choice === "fullhouse") {
    combinations = [fullHousePattern];
  } else {
    // ============================================================
    // NUMERIC PATTERN CHOICE (Handles 1 to 10+ Patterns)
    // ============================================================
    const requiredCount = Math.max(1, Number(activeWinningPattern) || 1);

    // Generate unique sliding combinations of size `requiredCount` (including 10)
    for (let start = 0; start < basePatternsPool.length; start++) {
      const combinedCells = [];

      for (let offset = 0; offset < requiredCount; offset++) {
        const index = (start + offset) % basePatternsPool.length;
        combinedCells.push(...basePatternsPool[index]);
      }

      // De-duplicate cells for this specific combination
      combinations.push([...new Set(combinedCells)]);
    }
  }

  console.log(
    `🏆 PATTERN CHOICE: ${activeWinningPattern} | GENERATED COMBINATIONS:`,
    combinations.length
  );

  // ============================================================
  // 3. ANIMATION LOOP
  // ============================================================

  winningPatternIndexRef.current = 0;

  const showNextCombination = () => {
    if (stateRef.current.paused || !combinations.length) {
      winningPatternAnimationRef.current = null;
      return;
    }

    const currentIndex = winningPatternIndexRef.current;
    const currentCombination = combinations[currentIndex];

    setDisplayedWinningPatterns(currentCombination);

    winningPatternIndexRef.current = (currentIndex + 1) % combinations.length;

    winningPatternAnimationRef.current = setTimeout(() => {
      winningPatternAnimationRef.current = null;
      showNextCombination();
    }, 1000);
  };

  if (!stateRef.current.paused) {
    showNextCombination();
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  return () => {
    if (winningPatternAnimationRef.current !== null) {
      clearTimeout(winningPatternAnimationRef.current);
      winningPatternAnimationRef.current = null;
    }
  };
}, [activeWinningPattern, paused]);


const nextGenerationTimeRef = useRef(null);
// Add this near your other useRef anchors at the top of your file
const audioFailsafeTimeoutRef = useRef(null);


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
const hasPlayedShuffleRef = useRef(false);
const callIntervalChangeRef = useRef(null);
  // ============================================
  // CALL NUMBER API (prevents spam)
  // ============================================

const [callIntervalTimeLeft, setCallIntervalTimeLeft] = useState(0);


  
  // ============================================
  // VOICE SPEED
  // ============================================
  const decreaseVoiceSpeed = () => {
    setVoiceSpeed(prev => Math.max(0.5, +(prev - 0.1).toFixed(1)));
  };

  const increaseVoiceSpeed = () => {
    setVoiceSpeed(prev => Math.min(2.0, +(prev + 0.1).toFixed(1)));
  };
// Dynamic countdown tracking for the interval pacing delay between numbers
// Synchronizes the countdown state loop every full second
useEffect(() => {
  if (paused || loopTimeoutRef.current === null) {
    setCallIntervalTimeLeft(0);
    return;
  }

  const targetTime = Date.now() + (Number(callIntervalRef.current) * 1000);
  
  // Set interval to update every 1000 milliseconds (1 second) instead of 100ms
  const timer = setInterval(() => {
    const remaining = Math.max(0, (targetTime - Date.now()) / 1000);
    setCallIntervalTimeLeft(remaining);
    
    if (remaining <= 0) {
      clearInterval(timer);
    }
  }, 1000);

  return () => clearInterval(timer);
}, [current, paused, callInterval]);



  useEffect(() => {
  console.log("🧹 NEW GAME DETECTED:", id);

  generationCancelRef.current++;

  isDrawingBallRef.current = false;

  if (loopTimeoutRef.current) {
    clearTimeout(loopTimeoutRef.current);
    loopTimeoutRef.current = null;
  }

  if (audioFailsafeTimeoutRef.current) {
    clearTimeout(audioFailsafeTimeoutRef.current);
    audioFailsafeTimeoutRef.current = null;
  }

  if (startupTimeoutRef.current) {
    clearTimeout(startupTimeoutRef.current);
    startupTimeoutRef.current = null;
  }

  lastGenerationTimeRef.current = 0;

  seenBallsRef.current.clear();

  calledRef.current = [];

  remainingNumbersRef.current =
    Array.from({ length: 75 }, (_, i) => i + 1);

  stopAllActiveAudio();

  console.log("✅ GAME ENGINE RESET COMPLETE");
}, [id]);
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


// ============================================================
// 🎙️ LOAD PERMANENT VOICE FOR THIS CASHIER
// ============================================================

useEffect(() => {
  const currentUserRaw =
    localStorage.getItem("currentUser");

  if (!currentUserRaw) {
    console.log(
      "🎙️ NO CURRENT USER — DEFAULTING TO OROMO"
    );
    return;
  }

  let currentUser;

  try {
    currentUser = JSON.parse(currentUserRaw);
  } catch (error) {
    console.error(
      "❌ FAILED TO READ CURRENT USER:",
      error
    );
    return;
  }

  // Only use the cashier username
  const cashierId = currentUser?.username;

  if (!cashierId) {
    console.log(
      "🎙️ NO CASHIER USERNAME — DEFAULTING TO OROMO"
    );
    return;
  }

  const voiceKey =
    `cashier_voice_selection_${cashierId}`;

  const savedVoice =
    localStorage.getItem(voiceKey);

  console.log(
    "🎙️ PERMANENT CASHIER VOICE CHECK:",
    {
      cashier: cashierId,
      voiceKey,
      savedVoice,
    }
  );

  if (
    savedVoice &&
    [
      "recorded-oromo",
      "voice2",
      "voice3",
      "voice4",
      "voice5",
      "voice6",
    ].includes(savedVoice)
  ) {
    setGame((prev) => ({
      ...prev,
      voiceMode: savedVoice,
      speechLang:
        savedVoice === "recorded-oromo"
          ? "om-ET"
          : "en-US",
    }));

    console.log(
      "✅ PERMANENT VOICE RESTORED:",
      savedVoice
    );
  } else {
    console.log(
      "🎙️ NO SAVED VOICE — OROMO REMAINS DEFAULT"
    );
  }
}, []);





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
      // =====================================================
      // OFFLINE MODE — LOAD GAME FROM INDEXEDDB
      // =====================================================
      if (!navigator.onLine) {
        console.log(
          "📴 OFFLINE MODE — LOADING GAME FROM INDEXEDDB:",
          id
        );

        const localGame = await offlineDB.games.get(String(id));

        if (!localGame) {
          console.error(
            "❌ OFFLINE GAME NOT FOUND IN INDEXEDDB:",
            id
          );
          return;
        }

        console.log(
          "💾 OFFLINE GAME LOADED:",
          localGame
        );

        // ================================================
        // RESTORE GAME
        // ================================================
        setGame(prev => {
          const restoredVoiceMode =
            localGame.voice_mode ||
            localGame.voiceMode ||
            prev.voiceMode ||
            "recorded";

          const restoredSpeechLang =
            localGame.speech_lang ||
            localGame.speechLang ||
            prev.speechLang ||
            "en-US";

          const restoredVoiceSpeed =
            localGame.voice_speed ||
            localGame.voiceSpeed ||
            prev.voiceSpeed ||
            1;

          return {
            ...prev,

            id:
              localGame.game_id ||
              localGame.id ||
              id,

            game_id:
              localGame.game_id ||
              localGame.id ||
              id,

            date:
              localGame.date ||
              localGame.created_at,

            created_at:
              localGame.created_at,

            game_date:
              localGame.game_date ||
              localGame.created_at,

            cashier:
              localGame.cashier ||
              localGame.cashier_id,

            cashier_id:
              localGame.cashier_id ||
              localGame.cashier,

            house:
              localGame.house ||
              localGame.house_id,

            house_id:
              localGame.house_id ||
              localGame.house,

            bet:
              Number(localGame.bet) || 0,

            grossIncome:
              Number(localGame.grossIncome) || 0,

            // ============================================
            // NET INCOME
            // ============================================
            netIncome:
              Number(
                localGame.netIncome ??
                localGame.prize ??
                0
              ),

            prize:
              Number(
                localGame.prize ??
                localGame.netIncome ??
                0
              ),

            commission:
              Number(localGame.commission) || 0,

            commissionDeducted:
              Number(
                localGame.commissionDeducted ??
                localGame.commission_deducted ??
                0
              ),

            house_commission:
              Number(
                localGame.house_commission ??
                localGame.commissionDeducted ??
                0
              ),

            status:
              localGame.status ||
              "Active",

            // ============================================
            // SOLD CARTELAS
            // ============================================
            soldCartelas:
              localGame.soldCartelas ||
              prev.soldCartelas ||
              passedGame?.soldCartelas ||
              [],

            cardsSold:
              Number(
                localGame.cardsSold ??
                localGame.cards_sold ??
                0
              ),

            cards_sold:
              Number(
                localGame.cards_sold ??
                localGame.cardsSold ??
                0
              ),

            // ============================================
            // PATTERNS
            // ============================================
            selectedPatterns:
              localGame.selectedPatterns ||
              [],

            winningPatternCount:
              Number(
                localGame.winningPatternCount || 0
              ),

            // ============================================
            // VOICE
            // ============================================
            voiceMode:
              restoredVoiceMode,

            speechLang:
              restoredSpeechLang,

            voiceSpeed:
              restoredVoiceSpeed,
          };
        });

        // =================================================
        // RESTORE CALLED BALLS FROM INDEXEDDB
        // =================================================
        const localBalls =
          await offlineDB.calledBalls
            .where("game_id")
            .equals(String(id))
            .sortBy("called_at");

        /*
         * Your generateNumber() stores the actual number
         * in IndexedDB.
         *
         * Convert it back to the same format used by
         * your existing online called-number state:
         *
         * B3, I24, N37, G52, O67
         */
        const restoredCalled = localBalls.map(ball => {
          const number = Number(ball.number);

          let letter = "";

          if (number >= 1 && number <= 15) {
            letter = "B";
          } else if (number >= 16 && number <= 30) {
            letter = "I";
          } else if (number >= 31 && number <= 45) {
            letter = "N";
          } else if (number >= 46 && number <= 60) {
            letter = "G";
          } else if (number >= 61 && number <= 75) {
            letter = "O";
          }

          return `${letter}${number}`;
        });

        console.log(
          "💾 OFFLINE CALLED NUMBERS:",
          restoredCalled
        );

        // ================================================
        // RESTORE REACT STATE
        // ================================================
        setCalled(restoredCalled);

        // ================================================
        // RESTORE REF USED BY generateNumber()
        // ================================================
        calledRef.current = restoredCalled;

        // ================================================
        // RESTORE CURRENT BALL
        // ================================================
        if (restoredCalled.length > 0) {
          setCurrent(
            restoredCalled[
              restoredCalled.length - 1
            ]
          );
        } else {
          setCurrent(null);
        }

        // ================================================
        // REBUILD REMAINING NUMBERS
        // ================================================
        const calledNumberValues = new Set(
          localBalls.map(ball =>
            Number(ball.number)
          )
        );

        const allNumbers = Array.from(
          { length: 75 },
          (_, index) => index + 1
        );

        const remainingNumbers =
          allNumbers.filter(
            number =>
              !calledNumberValues.has(number)
          );

        remainingNumbersRef.current =
          remainingNumbers;

        // ================================================
        // LOG OFFLINE RESTORE
        // ================================================
        console.log(
          "📦 RESTORED CALLED COUNT:",
          restoredCalled.length
        );

        console.log(
          "📦 RESTORED LAST BALL:",
          restoredCalled.length > 0
            ? restoredCalled[
                restoredCalled.length - 1
              ]
            : null
        );

        console.log(
          "📦 REMAINING NUMBERS:",
          remainingNumbers.length
        );

        console.log(
          "✅ OFFLINE GAME RESTORE COMPLETE:",
          id
        );

        // ================================================
        // IMPORTANT:
        // DO NOT CALL SERVER WHILE OFFLINE
        // ================================================
        return;
      }

      // =====================================================
      // ONLINE MODE — KEEP YOUR EXISTING SERVER LOGIC
      // =====================================================
      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
      ) {
        console.log(
          `🔥 FETCH ACTIVE GAME: ${id} (attempt ${attempt}/${maxAttempts})`
        );

        const response = await fetch(
          `${API_URL}/games/active/${id}`
        );

        // ================================================
        // GAME FOUND
        // ================================================
        if (response.ok) {
          const data = await response.json();

          console.log(
            "✅ ACTIVE GAME FROM BACKEND:",
            data
          );

          console.log(
            "🎱 CALLED NUMBERS FROM BACKEND:",
            data.calledNumbers
          );

          setGame(prev => {
  // 🎙️ CASHIER VOICE IS LOCAL — NEVER TAKE IT FROM GAME/BACKEND
  const savedVoice = getSavedCashierVoice();

  const restoredSpeechLang =
    savedVoice === "recorded-oromo"
      ? "om-ET"
      : "en-US";
            const restoredVoiceSpeed =
              data.voice_speed ||
              data.voiceSpeed ||
              prev.voiceSpeed ||
              1;

            return {
              ...prev,

              id:
                data.game_id,

              game_id:
                data.game_id,

              date:
                data.date,

              cashier:
                data.cashier,

              house:
                data.house,

              bet:
                data.bet,

              prize:
                data.prize,

              // Keep Net available online too
              netIncome:
                data.netIncome ??
                data.prize,

              commission:
                data.commission,

              commissionDeducted:
                data.commission_deducted,

              status:
                data.status,

              // =========================================
              // KEEP SOLD CARTELAS
              // =========================================
              soldCartelas:
                data.soldCartelas ??
                data.sold_cartelas ??
                prev.soldCartelas ??
                passedGame?.soldCartelas ??
                [],

              voiceMode:
  savedVoice,

speechLang:
  restoredSpeechLang,

              voiceSpeed:
                restoredVoiceSpeed,
            };
          });

          // ==========================================
          // RESTORE CALLED NUMBERS AFTER REFRESH
          // ==========================================

          const restoredCalled =
            Array.isArray(data.calledNumbers)
              ? data.calledNumbers
              : [];

          // ==========================================
          // RESTORE REACT STATE
          // ==========================================

          setCalled(restoredCalled);

          // ==========================================
          // RESTORE REF
          // ==========================================

          calledRef.current =
            restoredCalled;

          // ==========================================
          // RESTORE LAST CALLED NUMBER
          // ==========================================

          if (restoredCalled.length > 0) {
            setCurrent(
              restoredCalled[
                restoredCalled.length - 1
              ]
            );
          } else {
            setCurrent(null);
          }

          // ==========================================
          // REBUILD REMAINING NUMBERS
          // ==========================================

          const calledNumberValues =
            new Set(
              restoredCalled.map(ball => {
                const parts =
                  ball.trim().split(/\s+/);

                return Number(parts[1]);
              })
            );

          const allNumbers =
            Array.from(
              { length: 75 },
              (_, index) => index + 1
            );

          const remainingNumbers =
            allNumbers.filter(
              number =>
                !calledNumberValues.has(number)
            );

          remainingNumbersRef.current =
            remainingNumbers;

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
              ? restoredCalled[
                  restoredCalled.length - 1
                ]
              : null
          );

          console.log(
            "📦 REMAINING NUMBERS:",
            remainingNumbers.length
          );

          // ==========================================
          // SUCCESS
          // ==========================================

          return;
        }

        // ==============================================
        // GAME NOT READY
        // ==============================================

        if (response.status === 404) {
          console.log(
            `⏳ GAME NOT READY — retrying in ${retryDelay}ms...`
          );

          if (attempt < maxAttempts) {
            await new Promise(resolve =>
              setTimeout(
                resolve,
                retryDelay
              )
            );
          }

          continue;
        }

        // ==============================================
        // OTHER SERVER ERROR
        // ==============================================

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

    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }

    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
      audioTimeoutRef.current = null;
    }

    if (audioFailsafeTimeoutRef.current) {
      clearTimeout(audioFailsafeTimeoutRef.current);
      audioFailsafeTimeoutRef.current = null;
    }

    if (startupTimeoutRef.current) {
      clearTimeout(startupTimeoutRef.current);
      startupTimeoutRef.current = null;
    }
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
    // ==========================================
    // STOP AFFAN RECORDED OROMO AUDIO
    // ==========================================

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

    // ==========================================
    // STOP SHUFFLE AUDIO
    // ==========================================

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
// 🎵 PRELOAD NEXT BINGO VOICE
// Loads the next Oromo MP3 in a SEPARATE audio object.
// This never touches the currently playing audio.
// ============================================================


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
    if (!audio) return null;

    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) {
        return null;
      }

      audioContextRef.current =
        new AudioContextClass();
    }

    const ctx = audioContextRef.current;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const depth = Math.max(
      -20,
      Math.min(
        11,
        Number(voiceDepthRef.current) || 0
      )
    );

    // =====================================
    // ALREADY CREATED
    // UPDATE LIVE VALUES
    // =====================================

    if (audio._voiceNodes) {

      audio._voiceNodes.bassFilter.gain.value =
        depth * 3;

      audio._voiceNodes.bodyFilter.gain.value =
        depth * 2;

      audio._voiceNodes.lowMidFilter.gain.value =
        depth * 1.5;

      audio._voiceNodes.warmthFilter.frequency.value =
        depth > 0
          ? 4500
          : 12000;

      audio._voiceNodes.compressor.ratio.value =
        depth > 0
          ? 8
          : 3;

      console.log(
        "🎙️ DEPTH UPDATED:",
        depth
      );

      return audio._voiceNodes;
    }

    // =====================================
    // CREATE SOURCE
    // =====================================

    const source =
      ctx.createMediaElementSource(audio);

    const bassFilter =
      ctx.createBiquadFilter();

    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 175;
    bassFilter.gain.value = depth * 2;

    const bodyFilter =
      ctx.createBiquadFilter();

    bodyFilter.type = "peaking";
    bodyFilter.frequency.value = 150;
    bodyFilter.Q.value = 1;
    bodyFilter.gain.value = depth * 1;

    const lowMidFilter =
      ctx.createBiquadFilter();

    lowMidFilter.type = "peaking";
    lowMidFilter.frequency.value = 200;
    lowMidFilter.Q.value = 1;
    lowMidFilter.gain.value = depth * 0.4;

    const warmthFilter =
      ctx.createBiquadFilter();

    warmthFilter.type = "lowpass";
    warmthFilter.frequency.value =
      depth > 0
        ? 10000
        : 14000;

    const compressor =
      ctx.createDynamicsCompressor();

    compressor.threshold.value = -24;
    compressor.ratio.value =
      depth > 0
        ? 4
        : 2;

    const outputGain =
      ctx.createGain();

    outputGain.gain.value = 1;

    source.connect(bassFilter);
    bassFilter.connect(bodyFilter);
    bodyFilter.connect(lowMidFilter);
    lowMidFilter.connect(warmthFilter);
    warmthFilter.connect(compressor);
    compressor.connect(outputGain);
    outputGain.connect(ctx.destination);

    const nodes = {
      source,
      bassFilter,
      bodyFilter,
      lowMidFilter,
      warmthFilter,
      compressor,
      outputGain
    };

    audio._voiceNodes = nodes;

    bassFilterRef.current = bassFilter;

    console.log(
      "🎙️ DEPTH ENGINE CREATED:",
      depth
    );

    return nodes;

  } catch (error) {
    console.error(
      "❌ VOICE DEPTH ERROR:",
      error
    );

    return null;
  }
}

function resetNextBingoPreload() {

  nextBingoBallRef.current = null;

  nextBingoAudioReadyRef.current = false;
  nextBingoAudioPathRef.current = null;

  const audio = nextBingoAudioRef.current;

  if (audio) {

    try {
      audio.pause();
      audio.oncanplay = null;
      audio.onloadstart = null;
      audio.onerror = null;
      audio.removeAttribute("src");
      audio.load();
    } catch (e) {}

  }

  nextBingoAudioRef.current = null;

  console.log(
    "🧹 NEXT BINGO PRELOAD RESET"
  );
}



function preloadNextBingoVoice(letter, number) {
  const letterName = String(letter).trim().toLowerCase();
  const numberName = String(number).trim();
  const path = `/oromo/${letterName}${numberName}.wav`;

  // Already loading/loaded this exact voice path in our cache map
  if (preloadedVoicesCacheRef.current[path]) {
    console.log("🎵 NEXT VOICE ALREADY PRELOADING/PRELOADED IN CACHE:", path);
    return;
  }

  // Clean old cache entries to protect device memory limits (keep last 3 items max)
  const cachedPaths = Object.keys(preloadedVoicesCacheRef.current);
  if (cachedPaths.length > 3) {
    const oldestPath = cachedPaths[0];
    try {
      preloadedVoicesCacheRef.current[oldestPath].pause();
      preloadedVoicesCacheRef.current[oldestPath].removeAttribute("src");
      preloadedVoicesCacheRef.current[oldestPath].load();
    } catch (e) {}
    delete preloadedVoicesCacheRef.current[oldestPath];
  }

  const audio = new Audio();
  audio.preload = "auto";
  audio.src = path;

  const selectedVolume = Number(volumeRef.current);
  audio.volume = Math.max(0, Math.min(1, Number.isFinite(selectedVolume) ? selectedVolume : 1));

  const selectedSpeed = Number(voiceSpeedRef.current);
  audio.playbackRate = Math.max(0.5, Math.min(2.0, Number.isFinite(selectedSpeed) ? selectedSpeed : 1));
  audio.defaultPlaybackRate = audio.playbackRate;

  // Store the active audio instance inside our cache dictionary instantly
  preloadedVoicesCacheRef.current[path] = audio;

  console.log("📦 PRELOADING EXACT NEXT VOICE TO CACHE MAP:", path, Date.now());

  audio.onloadstart = () => {
    console.log("📥 NEXT VOICE LOAD START:", path, Date.now());
  };

  audio.oncanplay = () => {
    console.log("✅ NEXT VOICE READY IN CACHE MAP:", path, Date.now());
  };

  audio.onloadeddata = () => {
    console.log("📥 NEXT VOICE DATA LOADED:", path, Date.now());
  };

  audio.onerror = (error) => {
    console.error("❌ NEXT VOICE PRELOAD FAILED:", path, error);
    delete preloadedVoicesCacheRef.current[path]; // Remove failed asset records completely
  };

  audio.load();
}

// ============================================================
// 🎯 BINGO CALL PLAYBACK
// ============================================================
// ============================================================
// 🎯 BINGO CALL PLAYBACK (RESTORED & ENHANCED)
// ============================================================
async function playRecordedBingoCall(
  letter,
  number,
  onComplete = () => {},
  resumeTime = 0,
  preloadedAudioParam = null // Renamed local parameter to avoid shadow variable conflicts
) {
  const generationId = ++audioGenerationRef.current;

  const completeName =
    `${String(letter).trim().toLowerCase()}${String(number).trim().toLowerCase()}`;

  console.log(
    "📞 playRecordedBingoCall ENTER:",
    completeName,
    Date.now()
  );

  console.log(
    "🎯 NEW AUDIO GENERATION:",
    generationId,
    letter,
    number
  );

  // ============================================================
  // LOCK CURRENT BALL
  // ============================================================

  pendingBingoCallRef.current = {
    letter,
    number,
    result: `${letter} ${number}`,
  };

  // ============================================================
  // PAUSE CHECK
  // ============================================================

  if (stateRef.current.paused) {
    console.log(
      "⏸️ GAME PAUSED — ABORTING PLAYBACK LIFE CYCLE CONTEXT"
    );

    isDrawingBallRef.current = false;
    return;
  }

  // ============================================================
  // STOP OLD AUDIO
  // ============================================================

  const oldAudio = activeAudioRef.current;

  if (oldAudio && !oldAudio.ended) {
    console.error(
      "🚨 AUDIO INTERRUPTED BEFORE FINISHING!",
      "\n🎵 CUT PATH URL:",
      oldAudio.src,
      "\n⏱️ TIME POSITION WHEN CUT:",
      oldAudio.currentTime.toFixed(2),
      "seconds"
    );

    try {
      oldAudio.pause();
      oldAudio.onended = null;
      oldAudio.onerror = null;
    } catch (e) {}
  }

  // ============================================================
  // BUILD AUDIO PATH
  // ============================================================

  // ============================================================
// 🎙️ SELECT VOICE FOLDER
// ============================================================

const voiceFolderMap = {
  "recorded-oromo": "oromo",
  "voice2": "voice2",
  "voice3": "voice3",
  "voice4": "voice4",
  "voice5": "voice5",
  "voice6": "voice6",
};

// Get the voice selected for this cashier/game
const selectedVoice = game?.voiceMode || "recorded-oromo";

const folder =
  voiceFolderMap[selectedVoice] || "oromo";

const letterName = String(letter).trim().toLowerCase();
const numberName = String(number).trim().toLowerCase();

const finalPath =
  `/${folder}/${letterName}${numberName}.wav`;

console.log("🎙️ SELECTED BINGO VOICE:", {
  selectedVoice,
  folder,
  file: `${letterName}${numberName}.wav`,
  finalPath,
});

  try {

    // ============================================================
    // ♻️ CHECK FOR PRELOADED AUDIO FROM CACHE DICTIONARY MAP
    // ============================================================

    let preloadedAudio = null;
    const cachedAudioInstance = preloadedVoicesCacheRef.current[finalPath];

    console.log("🔎 DICTIONARY CACHE PRELOAD CHECK:", {
      finalPath,
      audioExistsInMap: !!cachedAudioInstance,
      readyState: cachedAudioInstance?.readyState ?? null,
    });

    // Check if the file is loaded and ready inside the map cache
    if (cachedAudioInstance && cachedAudioInstance.readyState === 4) {
      
      preloadedAudio = cachedAudioInstance;

      console.log(
        "♻️ USING PRELOADED BINGO VOICE FROM CACHE MAP:",
        finalPath,
        "readyState:",
        preloadedAudio.readyState
      );

      // Clean the dictionary key immediately to release memory tracking
      delete preloadedVoicesCacheRef.current[finalPath];

    } else {

      console.log(
        "📦 NO MATCHING READY AUDIO IN CACHE MAP (FALLBACK TO SEQUENTIAL NETWORK FETCH):",
        finalPath
      );
      
      // If it exists but wasn't finished loading, clear it from cache so it can reload clean
      if (cachedAudioInstance) {
        delete preloadedVoicesCacheRef.current[finalPath];
      }
    }

    // ============================================================
    // SEND AUDIO TO PLAYBACK
    // ============================================================

    console.log(
      "📦 SENDING TO playCompleteRecording:",
      completeName,
      "preloaded:",
      !!preloadedAudio,
      "readyState:",
      preloadedAudio?.readyState ?? "none",
      Date.now()
    );

    // ============================================================
    // PLAY AUDIO
    // ============================================================

    const result = await playCompleteRecording(
      finalPath,
      () => {
        console.log(
          "🔔 DIRECT AUDIO COMPLETION:",
          completeName
        );
      },
      resumeTime,
      preloadedAudio
    );

    // ============================================================
    // GENERATION SAFETY
    // ============================================================

    if (generationId !== audioGenerationRef.current) {

      console.log(
        "🛑 OBSELETE GENERATION TIMELINE BLOCKED:",
        generationId
      );

      if (loopTimeoutRef.current === null) {

        setTimeout(() => {

          if (!stateRef.current.paused) {

            console.log(
              "🚀 AUTO-RECOVERY HOOK: FORCING ADVANCEMENT PAST STALE BLOCKED THREAD"
            );

            isDrawingBallRef.current = false;

            generateNumber();
          }

        }, 1000);
      }

      return;
    }

    // ============================================================
    // PAUSED RESULT
    // ============================================================

    if (
      result?.paused ||
      stateRef.current.paused
    ) {

      console.log(
        "⏸️ CALL WAITING FOR RESUME SEPARATION:",
        completeName
      );

      isDrawingBallRef.current = false;

      return;
    }

    // ============================================================
    // AUDIO COMPLETED
    // ============================================================

    if (result?.completed) {
      onComplete();
    }

  } catch (error) {

    console.error(
      "❌ CRITICAL ANNOUNCER ROUTING REJECTION EXCEPTION:",
      error
    );

    isDrawingBallRef.current = false;

    onComplete();
  }
}






function playCompleteRecording(
  path,
  onFinished = () => {},
  resumeTime = 0,
  preloadedAudio = null
) {
  return new Promise((resolve, reject) => {

    const completeName =
      typeof path === "string"
        ? path.split("/").pop()
        : "unknown-audio";

    const generationId = audioGenerationRef.current;

    // ============================================================
    // 1. INITIAL STATE CHECKS
    // ============================================================

    if (stateRef.current.paused) {
      console.log("⏸️ GAME PAUSED BEFORE AUDIO CREATION:", completeName);
      resolve({ paused: true, completed: false });
      return;
    }

    if (generationId !== audioGenerationRef.current) {
      console.log("🛑 GENERATION NO LONGER CURRENT:", generationId);
      resolve({ cancelled: true, completed: false });
      return;
    }

    // ============================================================
    // 2. SELECT AUDIO OBJECT
    // ============================================================
    let audio;

    if (preloadedAudio) {
      audio = preloadedAudio;
      console.log(
        "♻️ PRELOADED AUDIO OBJECT TRANSFERRED TO PLAYBACK:",
        completeName,
        "readyState:",
        audio.readyState
      );
      globalAudioInstanceRef.current = audio;
    } else {
      if (!globalAudioInstanceRef.current) {
        globalAudioInstanceRef.current = new Audio();
        globalAudioInstanceRef.current.preload = "auto";
      }
      audio = globalAudioInstanceRef.current;
      console.log("📦 NORMAL AUDIO OBJECT USED:", completeName);
    }

    let finished = false;
    let started = false;

    // ============================================================
    // 3. CLEANUP
    // ============================================================
    const cleanup = () => {
      if (finished) {
        return;
      }
      finished = true;

      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }

      // Remove all handlers installed by this playback.
      audio.onended = null;
      audio.onerror = null;
      audio.onpause = null;
      audio.onwaiting = null;
      audio.onstalled = null;
      audio.oncanplay = null;
      audio.onloadstart = null;
      audio.ontimeupdate = null;
      audio.ondurationchange = null;
      audio.onloadedmetadata = null;

      try {
        audio.pause();
      } catch (error) {
        // Ignore pause errors safely.
      }

      // 🛡️ RE-RENDERING FRAME GUARD: Only clear state variables if another ball has not overtaken this thread loop
      if (generationId === audioGenerationRef.current) {
        setAudioCurrentTime(0);
        setAudioDuration(0);
      } else {
        console.log("🛡️ BYPASSED WIPING STATE: Next ball has already claimed the UI countdown tracker!");
      }

      console.log("🧹 AUDIO SOURCE WIPED CLEAN:", completeName);
    };

    // ============================================================
    // 4. REMOVE OLD EVENT HANDLERS
    // ============================================================
    audio.onended = null;
    audio.onerror = null;
    audio.onpause = null;
    audio.onwaiting = null;
    audio.onstalled = null;
    audio.oncanplay = null;
    audio.onloadstart = null;
    audio.ontimeupdate = null;
    audio.ondurationchange = null;
    audio.onloadedmetadata = null;

    // ============================================================
    // 5. SOURCE SETUP
    // ============================================================
    if (!preloadedAudio) {
      audio.src = path;
      audio.preload = "auto";
      console.log("📦 NORMAL AUDIO SOURCE LOADING:", completeName);
    } else {
      console.log(
        "♻️ PRELOADED AUDIO SOURCE REUSED:",
        completeName,
        "readyState:",
        audio.readyState
      );
    }

    // ============================================================
    // 6. INITIAL UI AUDIO STATE
    // ============================================================
    setAudioCurrentTime(resumeTime);
    
    // ⚡ FIX 1: Instantly inject the duration from preloaded memory instead of clearing it to 0
    if (audio.duration && Number.isFinite(audio.duration)) {
      setAudioDuration(audio.duration);
    } else {
      setAudioDuration(0);
    }

    // ============================================================
    // 7. LIVE AUDIO TIME UPDATES
    // ============================================================
    audio.ontimeupdate = () => {
      setAudioCurrentTime(audio.currentTime || 0);
    };

    audio.ondurationchange = () => {
      setAudioDuration(audio.duration || 0);
    };

    // ⚡ FIX 2: Safeguard loader to extract asset length variations asynchronously
    audio.onloadedmetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    // ============================================================
    // 8. LOAD START DIAGNOSTIC
    // ============================================================
    audio.onloadstart = () => {
      console.log("📥 LOAD START:", completeName, Date.now());
    };

    // ============================================================
    // 9. VOLUME
    // ============================================================
    const selectedVolume = Number(volumeRef.current);
    audio.volume = Math.max(0, Math.min(1, Number.isFinite(selectedVolume) ? selectedVolume : 1));

    // ============================================================
    // 10. PLAYBACK SPEED
    // ============================================================
    const selectedSpeed = Number(voiceSpeedRef.current);
    audio.playbackRate = Math.max(0.5, Math.min(2, Number.isFinite(selectedSpeed) ? selectedSpeed : 1));
    audio.defaultPlaybackRate = audio.playbackRate;

    // ============================================================
    // 11. MARK AS ACTIVE AUDIO
    // ============================================================
    activeAudioRef.current = audio;

    // ============================================================
    // 12. START PLAYBACK
    // ============================================================
    const startPlayback = () => {
      if (finished || started) {
        return;
      }

      if (stateRef.current.paused) {
        cleanup();
        resolve({ paused: true, completed: false });
        return;
      }

      if (generationId !== audioGenerationRef.current) {
        cleanup();
        resolve({ cancelled: true, completed: false });
        return;
      }

  started = true;

      if (resumeTime > 0) {
        try {
          audio.currentTime = Number(resumeTime);
          console.log("🎯 RESUME POSITION:", completeName, resumeTime, "seconds");
        } catch (error) {
          console.warn("⚠️ RESUME POSITION SET FAILED:", error);
        }
      }

      console.log(
        "🚀 STARTING RECORDED VOICE:",
        completeName,
        "readyState:",
        audio.readyState,
        Date.now()
      );

      let playPromise;
      try {
        playPromise = audio.play();
      } catch (error) {
        console.error("❌ AUDIO.PLAY() ERROR:", error);
        cleanup();
        reject(error);
        return;
      }

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("▶️ AUDIO ACTUALLY PLAYING:", completeName, Date.now());
            // ⚡ FIX 3: Safety backup state refresh right as sound output begins
            if (audio.duration && Number.isFinite(audio.duration)) {
              setAudioDuration(audio.duration);
            }
          })
          .catch((error) => {
            if (error && error.name === "AbortError") {
              console.log("⏸️ AUDIO PLAYBACK ABORTED:", completeName);
              cleanup();
              resolve({ paused: true, completed: false });
              return;
            }
            console.error("❌ AUDIO PLAY PROMISE ERROR:", error);
            cleanup();
            reject(error);
          });
      }
    };

    // ============================================================
    // 13. CAN PLAY HANDLER
    // ============================================================
    audio.oncanplay = () => {
      console.log(
        "✅ CAN PLAY:",
        completeName,
        Date.now(),
        "readyState:",
        audio.readyState
      );
      startPlayback();
    };

    // ============================================================
    // 14. WAITING
    // ============================================================
    audio.onwaiting = () => {
      console.warn("⏳ AUDIO WAITING:", completeName, "time:", audio.currentTime.toFixed(3));
    };

    // ============================================================
    // 15. STALLED
    // ============================================================
    audio.onstalled = () => {
      console.warn("🚨 AUDIO STALLED:", completeName);
    };

    // ============================================================
    // 16. AUDIO FINISHED
    // ============================================================
    audio.onended = () => {
      if (finished) {
        return;
      }
      console.log("✅ VOICE FINISHED:", completeName, Date.now());
      cleanup();

      try {
        onFinished();
      } catch (error) {
        console.error("❌ COMPLETION CALLBACK ERROR:", error);
      }

      resolve({ completed: true });
    };

       // ============================================================
    // 17. AUDIO ERROR
    // ============================================================
    audio.onerror = (error) => {
      if (finished) {
        return;
      }

      if (stateRef.current.paused) {
        cleanup();
        resolve({ paused: true, completed: false });
        return;
      }

      if (generationId !== audioGenerationRef.current) {
        cleanup();
        resolve({ cancelled: true, completed: false });
        return;
      }

      console.error("❌ VOICE AUDIO ERROR:", path, error);
      cleanup();
      reject(new Error(`Could not play ${path}`));
    };

    // ============================================================
    // 18. NORMAL AUDIO LOAD
    // ============================================================
    if (!preloadedAudio) {
      audio.load();
      console.log("📦 NORMAL AUDIO LOAD TRIGGERED:", completeName);
    } else {
      console.log(
        "⚡ SKIPPING audio.load() — PRELOADED AUDIO:",
        completeName,
        "readyState:",
        audio.readyState
      );
    }

    // ============================================================
    // 19. ALREADY READY?
    // ============================================================
    if (audio.readyState >= 3) {
      console.log(
        "⚡ AUDIO ALREADY READY — STARTING IMMEDIATELY:",
        completeName,
        "readyState:",
        audio.readyState
      );
      startPlayback();
    }
  });
}

    // end of playCompleteRecording

  // ==========================================================
  // 🎵 VERIFICATION AUDIO
  // ==========================================================
function playRecordedAudio(fileName, onComplete = () => {}) {
  const folder =
    stateRef.current.game?.voiceMode === "recorded-oromo"
      ? "oromo"
      : "amharic";

  const audioPath = `/${folder}/${fileName}.wav`;

  console.log(
    "🎵 VERIFICATION AUDIO SYSTEM TRIGGERED:",
    audioPath
  );

  const verificationInstance = new Audio(audioPath);

  verificationInstance.preload = "auto";

  const calculatedVolume =
    (Number(volumeRef.current) || 0.7) * 1.2;

  verificationInstance.volume = Math.max(
    0,
    Math.min(1, calculatedVolume)
  );

  verificationInstance.playbackRate = Math.max(
    1,
    Math.min(
      2,
      (Number(voiceSpeedRef.current) || 1) * 1.15
    )
  );

  verificationInstance.onended = () => {
    try {
      verificationInstance.pause();
      verificationInstance.src = "";
    } catch {}

    console.log(
      "✅ VERIFICATION SOUND LIFE CYCLE TERMINATED CLEANLY:",
      audioPath
    );

    verificationInstance.onended = null;
    verificationInstance.onerror = null;

    onComplete();
  };

  verificationInstance.onerror = (error) => {
    try {
      verificationInstance.pause();
      verificationInstance.src = "";
    } catch {}

    console.error(
      "❌ VERIFICATION AUDIO CHANNEL FAILURE EXCEPTION:",
      audioPath,
      error
    );

    verificationInstance.onended = null;
    verificationInstance.onerror = null;

    onComplete();
  };

  const playPromise = verificationInstance.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log(
          "▶️ VERIFICATION AUDIO STREAM RESOLVED SUCCESSFULLY:",
          audioPath
        );
      })
      .catch((err) => {
        console.warn(
          "⚠️ VERIFICATION AUDIO INTERRUPTED:",
          err.message
        );

        onComplete();
      });
  }
}

  
 
function playShuffleSound(onFinished = () => {}) {
  console.log("🎵 INITIALIZING CAGE SHUFFLE AUDIO CHANNEL RESOURCE");
  
  const audio = new Audio("/oromo/shuffle.wav");
  audio.preload = "auto";
  
  // Bind the channel to our global component reference so togglePlayPause can control it
  shuffleAudioRef.current = audio;

  audio.onended = () => {
    console.log("🧹 CAGE SHUFFLE TRACK ENDED NATURALLY");
    shuffleAudioRef.current = null;
    sessionStorage.removeItem("paused_shuffle_timestamp"); // Flush clean tracking cache
    
    // Execute our callback pipeline route link
    try {
      onFinished();
    } catch(error) {
      console.error("❌ SHUFFLE COMPLETION HANDSHAKE ERROR:", error);
    }
  };

  audio.onerror = (error) => {
    console.error("❌ SHUFFLE TRACK CRITICAL LOADING FAILURE EXCEPTION:", error);
    shuffleAudioRef.current = null;
    sessionStorage.removeItem("paused_shuffle_timestamp");
    
    // Failsafe auto-rescue: If the shuffle sound file crashes or fails to load,
    // fire the completion hook anyway so the game room doesn't stay frozen!
    onFinished();
  };

  // Safe promise-wrapped stream execution execution thread
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("▶️ SHUFFLE AUDIO CURRENTLY SPINNING SUCCESSFULLY");
      })
      .catch((err) => {
        console.warn("⚠️ Shuffle element blocked or muted by browser protocols:", err.message);
        // Fallback auto-advance execution trigger
        onFinished();
      });
  }
}


   
function stopAllActiveAudio() {

  if (audioTimeoutRef.current) {
    clearTimeout(audioTimeoutRef.current);
    audioTimeoutRef.current = null;
  }

  // STOP RECORDED OROMO AUDIO
  if (activeAudioRef.current) {
    activeAudioRef.current.onended = null;
    activeAudioRef.current.onerror = null;
    activeAudioRef.current.pause();
    activeAudioRef.current.currentTime = 0;
    activeAudioRef.current = null;
  }

  // STOP SHUFFLE AUDIO
  if (
    shuffleAudioRef.current &&
    typeof shuffleAudioRef.current.pause === "function"
  ) {
    shuffleAudioRef.current.onended = null;
    shuffleAudioRef.current.pause();
    shuffleAudioRef.current.currentTime = 0;
    shuffleAudioRef.current = null;
  }
}

 // --- Dynamic Arena Announcer Sequence ---
// --- Dynamic Arena Announcer Sequence ---
// --- Dynamic Arena Announcer Sequence ---
function speakBallSequence(
  letter,
  number,
  onSequenceFinished = () => {}
) {
  if (stateRef.current
.paused) {
    console.log("⏸️ SPEAK SEQUENCE BLOCKED — GAME PAUSED");
    return;
  }

  console.log(
    "🎙️ PLAYING AFFAN RECORDED OROMO:",
    letter,
    number
  );

  // ONLY AFFAN RECORDED OROMO
  playRecordedBingoCall(
    letter,
    number,
    onSequenceFinished
  );
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
  playRecordedAudio("letsgo", callback);
}

 
const togglePlayPause = () => {
  const actionId = ++playPauseActionRef.current;
  const isCurrentlyPaused = stateRef.current.paused;

  // ==========================================================
  // ⏸️ PAUSE ENGINE
  // ==========================================================
  if (!isCurrentlyPaused) {
    console.log("⏸️ PAUSE");

    stateRef.current.paused = true;
    setPaused(true);

    if (loopTimeoutRef.current !== null) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }

    if (audioFailsafeTimeoutRef.current !== null) {
      clearTimeout(audioFailsafeTimeoutRef.current);
      audioFailsafeTimeoutRef.current = null;
    }

    // Capture the precise millisecond marker if the shuffle track is running
    if (shuffleAudioRef.current) {
      try { 
        const currentShuffleTime = Number(shuffleAudioRef.current.currentTime) || 0;
        console.log("⏸️ PAUSING CAGE SHUFFLE BACKGROUND TRACK MID-RUN AT POSITION:", currentShuffleTime);
        
        sessionStorage.setItem("paused_shuffle_timestamp", String(currentShuffleTime));
        shuffleAudioRef.current.pause(); 
      } catch(e){}
    }

    const audio = activeAudioRef.current;
    if (audio && !audio.ended) {
      const currentTime = Number(audio.currentTime) || 0;
      console.log("⏸️ PAUSING ACTIVE ANNOUNCER VOICE ELEMENT:", audio.src, "AT POSITION:", currentTime);
      
      const currentBallStr = stateRef.current.current || "";
const parts = currentBallStr.trim().split(/\s+/);

const extractedLetter = parts[0] || "";
const extractedNumber = Number(parts[1]) || 0;

console.log(
  "💾 PAUSE SNAPSHOT:",
  extractedLetter,
  extractedNumber,
  currentTime
);

      pausedAudioRef.current = {
        audio,
        letter: extractedLetter,
        number: extractedNumber,
        time: currentTime,
      };

      try {
        audio.pause();
      } catch (error) {}
      
      isDrawingBallRef.current = false;
      return;
    }

    if (pendingBingoCallRef.current || isDrawingBallRef.current) {
      console.log("⏸️ DRAW ENGINE DISARMED MID-FLIGHT");
      audioGenerationRef.current++; 
      isDrawingBallRef.current = false;
      return;
    }
    return;
  }

  // ==========================================================
  // ▶️ PLAY / RESUME ENGINE (TRUE SEAMLESS RESUMPTION)
  // ==========================================================
  console.log("▶️ PLAY");

  stateRef.current.paused = false;
  setPaused(false);

 // 🎰 ONLY FIRST PLAY OF NEW GAME
if (firstGamePlayRef.current) {
  startRandomBingoBlink();
}

  // 🎵 INITIAL MATCH LAUNCH GATING RESTRUCTURE
  if (!hasPlayedShuffleRef.current) {
    hasPlayedShuffleRef.current = true;
    sessionStorage.setItem("bingo_shuffle_played", "true");
    sessionStorage.removeItem("paused_shuffle_timestamp"); 

    console.log("🚀 INITIAL MATCH LAUNCH: FIRING SHUFFLE TRACK ONLY");

    // ✅ FIX: Fire the shuffle track, but do NOT call generateNumber() here!
    // The number generator is now passed safely as a completion hook inside playShuffleSound.
   playShuffleSound(() => {
  console.log("🏁 SHUFFLE AUDIO FINISHED");

  // 🛑 STOP RANDOM NUMBER BLINKING
  stopRandomBingoBlink();

  if (stateRef.current.paused) {
    console.log("⏸️ GAME IS PAUSED - NOT GENERATING NUMBER");
    return;
  }

  console.log("🎯 GENERATING NUMBER 1 NOW");

  isDrawingBallRef.current = false;

  generateNumber();
});
    return;
  }

  // 🎵 TRUE SHUFFLE RESUME VALVE (If unpausing mid-shuffle before any numbers dropped)
  const currentRemainingPool = remainingNumbersRef.current || [];
  if (currentRemainingPool.length === 75) {
    const savedShuffleTimeStr = sessionStorage.getItem("paused_shuffle_timestamp");
    const resumeShuffleTime = savedShuffleTimeStr ? Number(savedShuffleTimeStr) : 0;
    
    console.log(`🚀 INITIAL SHUFFLE RESUME VALVE: CONTINUING CAGE SOUND FROM POSITION: ${resumeShuffleTime}s`);
    
    if (shuffleAudioRef.current) {
      try { 
        if (resumeShuffleTime > 0) {
          shuffleAudioRef.current.currentTime = resumeShuffleTime;
        }
        shuffleAudioRef.current.play(); 
      } catch(e){
        // Dynamic rescue if the object instance dropped out entirely
        isDrawingBallRef.current = false;
        generateNumber();
      }
    } else {
      isDrawingBallRef.current = false;
      generateNumber();
    }
    return;
  }

  // True voice audio resume gating snapshot
  const pausedData = pausedAudioRef.current;
  if (pausedData && pausedData.audio) {
    const resumeLetter = pausedData.letter;
    const resumeNumber = pausedData.number;
    const resumeTime = pausedData.time || 0;
    
    pausedAudioRef.current = null; 
    pendingBingoCallRef.current = null;

    if (actionId !== playPauseActionRef.current) return;

    if (resumeLetter && resumeNumber) {
      console.log(`🚀 TRUE RESUME: REPLAYING INTERRUPTED BALL ${resumeLetter} ${resumeNumber} FROM POSITION: ${resumeTime}s`);
      isDrawingBallRef.current = true;
      
      playRecordedBingoCall(resumeLetter, resumeNumber, () => {
        isDrawingBallRef.current = false;
        if (stateRef.current.paused) return;
        generateNumber();
      }, resumeTime);
      return;
    }
  }

  if (isDrawingBallRef.current) {
    console.log("⏳ CALL GENERATION STILL IN PROGRESS");
    return;
  }

  console.log("🚀 ADVANCING ENGINE TIMELINE SAFELY");
  generateNumber();
};














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


// ============================================================
// 🎵 PRELOAD THE EXACT RESERVED NEXT BINGO VOICE
// ============================================================


function getBingoLetter(number) {
  if (number <= 15) return "B";
  if (number <= 30) return "I";
  if (number <= 45) return "N";
  if (number <= 60) return "G";
  return "O";
}
// ==========================================================
// NETWORK RETRY HELPER (Runs silently on a background thread)
// ==========================================================
// ==========================================================
// NETWORK RETRY HELPER (Runs silently on a background thread)
// ==========================================================
// ==========================================================
// 📡 1. NETWORK RETRY HELPER (Runs silently in the background)
// ==========================================================
async function saveBallWithRetry(gameId, ball, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${API_URL}/games/${gameId}/call-number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ball })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return true; // Save succeeded
    } catch (err) {
      console.warn(`⚠️ Save Ball Retry ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  return false; // Failed all 3 attempts
}

// ==========================================================
// 🎱 2. AUTHORITATIVE GENERATOR ENGINE (Blazing 0s Instant Mode)
// ==========================================================
// Declare this variable outside the function or right above it in your file to track times


async function generateNumber() {
  const generationStart = Date.now();
  const myGenerationId = generationCancelRef.current;
  const currentGameId = stateRef.current.game?.game_id || stateRef.current.game?.id || id;

  console.log("🔥 GENERATE ENTERED", generationStart, "LOCK:", isDrawingBallRef.current, "CANCEL ID:", myGenerationId, "GAME:", currentGameId);

  // ✅ CRITICAL TIMESTAMP PROTECTION: Bypasses duplicate double-click triggers instantly
  if (generationStart - lastGenerationTimeRef.current < 800) {
    console.warn("🚫 DOUBLE-FIRE PREVENTED: DROPPING DUPLICATE REQUEST MARKS INTERCEPTED");
    return;
  }
  lastGenerationTimeRef.current = generationStart;

  // Core safety guardrails
  if (stateRef.current.paused) {
    console.log(">>> GENERATE BLOCKED - PAUSED");
    return;
  }

  if (isDrawingBallRef.current) {
    console.log("⏳ CALL GENERATION STILL IN PROGRESS");
    return;
  }

  if (loopTimeoutRef.current) {
    console.log(">>> GENERATE BLOCKED - LOOP ALREADY EXISTS");
    return;
  }

  if (!currentGameId) {
    console.error("❌ NO GAME ID AVAILABLE — CANNOT GENERATE NUMBER");
    isDrawingBallRef.current = false;
    return;
  }

  // Claim the drawing loop lock atomically
  isDrawingBallRef.current = true;

  const generationStillValid = () => {
    return myGenerationId === generationCancelRef.current && !stateRef.current.paused;
  };

  try {
    let result = "";
    let letter = "";
    let number = 0;
    let isFirstBallOfGame = false;

// ============================================================
// 🎵 CAPTURE PRELOADED AUDIO FOR THE CURRENT BALL
// ============================================================

let preloadedAudioForCurrentBall = null;

if (
  nextBingoBallRef.current &&
  nextBingoAudioRef.current &&
  nextBingoAudioPathRef.current
) {
  const expectedPath =
    `/oromo/${String(nextBingoBallRef.current.letter)
      .trim()
      .toLowerCase()}${String(nextBingoBallRef.current.number)
      .trim()
      .toLowerCase()}.wav`;

  if (
    nextBingoAudioPathRef.current === expectedPath
  ) {
    preloadedAudioForCurrentBall =
      nextBingoAudioRef.current;

    console.log(
      "♻️ CAPTURED PRELOADED AUDIO FOR CURRENT BALL:",
      expectedPath,
      "readyState:",
      preloadedAudioForCurrentBall.readyState
    );

    // Detach the current-ball audio from the NEXT-ball slot.
    nextBingoAudioRef.current = null;
    nextBingoAudioPathRef.current = null;
    nextBingoAudioReadyRef.current = false;
  }
}
    // Absolute Business Protection: Clear pending flags to force clean selections
    pendingBingoCallRef.current = null;

    // ============================================================
// 🎯 GET CURRENT BALL
// ============================================================

let selectedBall = nextBingoBallRef.current;

// ------------------------------------------------------------
// If a ball was already reserved/preloaded, consume it.
// ------------------------------------------------------------
if (selectedBall) {

  console.log(
    "♻️ CONSUMING PRELOADED NEXT BALL:",
    selectedBall.result
  );

  number = selectedBall.number;
  letter = selectedBall.letter;
  result = selectedBall.result;

  nextBingoBallRef.current = null;

}
else
   {

  // ----------------------------------------------------------
  // No reserved ball yet — choose normally.
  // ----------------------------------------------------------

  const currentRemaining = remainingNumbersRef.current;

  if (!currentRemaining || currentRemaining.length === 0) {
    console.log("🎉 ALL BINGO NUMBERS HAVE BEEN CALLED");
    return;
  }

  if (currentRemaining.length === 75) {
    isFirstBallOfGame = true;
  }

  const randomIndex = Math.floor(
    Math.random() * currentRemaining.length
  );

  number = currentRemaining[randomIndex];

  if (!generationStillValid()) {
    return;
  }

  remainingNumbersRef.current =
    currentRemaining.filter(n => n !== number);

  letter = getBingoLetter(number);

  result = `${letter} ${number}`;

  seenBallsRef.current.add(result);

  console.log(
    "🎲 FIRST/NORMAL BALL SELECTED:",
    result
  );
}


// ============================================================
// 🚀 RESERVE THE NEXT BALL IMMEDIATELY
// ============================================================
//
// IMPORTANT:
// The reserved ball is removed from remainingNumbersRef NOW.
// Therefore it cannot accidentally be selected twice.
//
// Its MP3 begins loading while the CURRENT voice is playing.
// ============================================================

// ============================================================
// 🚀 RESERVE THE NEXT BALL
// ============================================================

if (
  !nextBingoBallRef.current &&
  remainingNumbersRef.current &&
  remainingNumbersRef.current.length > 0
) {

  const remainingAfterCurrent =
    remainingNumbersRef.current;

  const nextIndex = Math.floor(
    Math.random() * remainingAfterCurrent.length
  );

  const nextNumber =
    remainingAfterCurrent[nextIndex];

  const nextLetter =
    getBingoLetter(nextNumber);

  const nextResult =
    `${nextLetter} ${nextNumber}`;

  remainingNumbersRef.current =
    remainingAfterCurrent.filter(
      n => n !== nextNumber
    );

  nextBingoBallRef.current = {
    number: nextNumber,
    letter: nextLetter,
    result: nextResult,
  };

  console.log(
    "🎯 NEXT BALL RESERVED:",
    nextResult
  );

  preloadNextBingoVoice(
    nextLetter,
    nextNumber
  );
}
    // Synchronize both arrays and Refs simultaneously
    const updatedCalled = [...calledRef.current, result];
    calledRef.current = updatedCalled;
    setCalled(updatedCalled);
    setCurrent(result);
console.log(
  "🎯 NUMBER DISPLAYED:",
  result,
  Date.now()
);
    stateRef.current.called = updatedCalled;
    stateRef.current.current = result;

    // Unblocked background persistence network write
    saveBallWithRetry(currentGameId, result, 3).then((saved) => {
      if (!saved) console.error("❌ BACKEND TRANSACTION LOSS WARNING:", result);
      else console.log("✅ NUMBER SECURED ON SERVER CLOUD:", result);
    });
// ==========================================================
// 💾 OFFLINE COPY
// Saves the same ball locally as a backup.
// DOES NOT replace the existing server save.
// ==========================================================

saveCalledBallOffline(currentGameId, number)
  .then(() => {
    console.log(
      "💾 OFFLINE COPY SAVED:",
      currentGameId,
      result
    );
  })
  .catch((offlineError) => {
    console.error(
      "⚠️ OFFLINE BALL SAVE FAILED:",
      offlineError
    );
  });
            if (!generationStillValid() || !result) {
      isDrawingBallRef.current = false;
      return;
    }

    // Dynamic initial startup shuffle countdown parameter valve
    if (isFirstBallOfGame) {
      console.log("⏳ HOLDING FIRST BALL ANNOUNCEMENT VOICE FOR SHUFFLE MUSIC TO FINISH: 5.5s");
      
      startupTimeoutRef.current = setTimeout(() => {
        executeBingoVoicePlayback(letter, number, result, myGenerationId, generationStillValid);
      }, 0);

    } else {
      // 🚀 SPEED MODE FIX: Fire synchronously immediately inside the same engine frame!
      executeBingoVoicePlayback(letter, number, result, myGenerationId, generationStillValid);
    }

  } catch (err) {
    console.error("❌ GENERATE NUMBER CRITICAL CONTAINER FAULT EXCEPTION:", err);
    isDrawingBallRef.current = false;
  }
}

function executeBingoVoicePlayback(letter, number, result, myGenerationId, generationCheckFn) {
  if (typeof generationCheckFn === 'function' && !generationCheckFn()) {
    isDrawingBallRef.current = false;
    return;
  }

  if (audioFailsafeTimeoutRef.current !== null) {
    clearTimeout(audioFailsafeTimeoutRef.current);
    audioFailsafeTimeoutRef.current = null;
  }

  audioFailsafeTimeoutRef.current = setTimeout(() => {
    const audio = activeAudioRef.current;
    if (typeof generationCheckFn === 'function' && !generationCheckFn()) return;
    if (stateRef.current.paused) return;
    if (audio && !audio.paused && !audio.ended) return;
    isDrawingBallRef.current = false;
  }, 8000);

  console.log("🎤 STARTING BINGO VOICE:", result, Date.now());

  // 🚀 HOOK INTO THE TIMELINE EVENT TRCKERS BEFORE PLAYBACK BEGINS
  const targetPath = `/oromo/${String(letter).trim().toLowerCase()}${String(number).trim().toLowerCase()}.wav`;
  const cachedInstance = preloadedVoicesCacheRef.current[targetPath] || activeAudioRef.current;

  if (cachedInstance) {
    // 1. Sync the duration hook instantly when the asset opens
    const updateDuration = () => {
      if (Number.isFinite(cachedInstance.duration)) {
        setAudioDuration(cachedInstance.duration);
      }
    };

    // 2. Continually map the ticking elapsed seconds into your React state
    const updateTimeTick = () => {
      setAudioCurrentTime(cachedInstance.currentTime || 0);
    };

    // Bind event hooks directly to the audio channel instance
    cachedInstance.addEventListener("durationchange", updateDuration);
    cachedInstance.addEventListener("loadedmetadata", updateDuration);
    cachedInstance.addEventListener("timeupdate", updateTimeTick);
    
    // Run immediate safety snapshots in case it loaded early
    if (cachedInstance.duration) {
      setAudioDuration(cachedInstance.duration);
    }
  }

  playRecordedBingoCall(
    letter,
    number,
    () => {
      if (myGenerationId !== generationCancelRef.current) return;

      if (audioFailsafeTimeoutRef.current !== null) {
        clearTimeout(audioFailsafeTimeoutRef.current);
        audioFailsafeTimeoutRef.current = null;
      }

      isDrawingBallRef.current = false;

      // 🧹 CLEANUP STATE TIMELINES ON FINISH
      setAudioCurrentTime(0);
      setAudioDuration(0);

      if (stateRef.current.paused) return;

      const selectedSeconds = Number(callIntervalRef.current);
      const safeSeconds = Number.isFinite(selectedSeconds) ? selectedSeconds : 0;

      if (loopTimeoutRef.current !== null) return;

      if (safeSeconds === 0) {
        console.log("🚀 SPEED IS 0s: DRAWING NEXT BALL ABSOLUTE INSTANTLY");
        if (!stateRef.current.paused && myGenerationId === generationCancelRef.current) {
          generateNumber();
        }
        return;
      }

      const delayMs = safeSeconds * 1000;
      loopTimeoutRef.current = setTimeout(() => {
        loopTimeoutRef.current = null;
        if (stateRef.current.paused || myGenerationId !== generationCancelRef.current) return;
        generateNumber();
      }, delayMs);
    }
  );
}












// ==========================================================
// AUTHORITATIVE GENERATOR ENGINE (SANDBOXED INSTANT MODE)
// ==========================================================


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

    const verifyGameId =
      currentGame?.game_id ||
      currentGame?.id;

    console.log(
      "🔥 VERIFY GAME OBJECT:",
      currentGame
    );

    console.log(
      "🔥 VERIFY GAME ID:",
      verifyGameId
    );

    if (!verifyGameId) {
      console.error(
        "❌ MISSING game_id/id:",
        currentGame
      );

      setWinnerMessage("Game ID missing");
      return;
    }


   
// =====================================================
// OFFLINE VERIFICATION
// =====================================================

if (!navigator.onLine) {

  console.log("📴 OFFLINE CARTELA VERIFICATION:", cartelaId);

  const enteredCartelaId =
    String(cartelaId).trim();

  // ===================================================
  // 1. GET LOCAL GAME
  // ===================================================

  const localGame =
    await offlineDB.games.get(
      String(verifyGameId)
    );

  console.log(
    "💾 OFFLINE GAME:",
    localGame
  );

  // Use the currently loaded game first,
  // then local DB as fallback.
  const gameForVerification =
    localGame || currentGame;

  if (!gameForVerification) {

    console.error(
      "❌ OFFLINE GAME NOT FOUND:",
      verifyGameId
    );

    setWinnerMessage(
      "Game not found offline"
    );

    setVerificationStatus(
      "ERROR"
    );

    return;
  }

  // ===================================================
  // 2. WINNING PATTERN REQUIREMENT
  // SAME LOGIC AS BACKEND
  // ===================================================

  const rawWinningPatternCount =
    gameForVerification
      ?.winning_pattern_count ??
    gameForVerification
      ?.winningPatternCount;

  const isFullHouseRequired =
    String(
      rawWinningPatternCount
    ).toUpperCase() ===
    "FULL_HOUSE";

  const winningPatternCount =
    isFullHouseRequired
      ? null
      : Math.max(
          1,
          Number(
            rawWinningPatternCount
          ) || 1
        );

  console.log(
    "🔒 OFFLINE WINNING PATTERN REQUIREMENT:",
    winningPatternCount
  );

  console.log(
    "🔒 OFFLINE FULL HOUSE REQUIRED:",
    isFullHouseRequired
  );

  // ===================================================
  // 3. CHECK CARTELA WAS SOLD
  // SAME PURPOSE AS BACKEND
  // ===================================================

  const soldCartelas =
    gameForVerification?.soldCartelas ||
    [];

  console.log(
    "💾 LOCAL SOLD CARTELAS:",
    soldCartelas
  );

  const soldCartela =
    soldCartelas.find(
      (cartela) => {

        const localId =
          typeof cartela === "object"
            ? (
                cartela.cartelaId ??
                cartela.cartela_id ??
                cartela.id
              )
            : cartela;

        return (
          String(localId).trim() ===
          enteredCartelaId
        );
      }
    );

  // ===================================================
  // 4. NOT SOLD
  // ===================================================

  if (!soldCartela) {

    console.log(
      "❌ CARTELA WAS NOT SOLD IN THIS GAME"
    );

    setWinnerMessage(
      `ID ${enteredCartelaId} NOT SOLD!`
    );

    setVerificationStatus(
      "NOT_SOLD"
    );

    if (
      currentGame.voiceMode === "recorded" ||
      currentGame.voiceMode === "recorded-oromo"
    ) {

      const folder =
        currentGame.voiceMode ===
        "recorded-oromo"
          ? "oromo"
          : "amharic";

      playRecordedBingoCall(
        `/${folder}/notsold.wav`
      );

    } else {

      stopAllActiveAudio();

      const speech =
        new SpeechSynthesisUtterance(
          `Cartela ${enteredCartelaId} not sold.`
        );

      speech.pitch = 0.65;
      speech.rate = 1.15;

      window.speechSynthesis.speak(
        speech
      );
    }

    return;
  }

  console.log(
    "✅ CARTELA IS SOLD OFFLINE:",
    soldCartela
  );

  // ===================================================
  // 5. LOAD CARTELA MATRIX
  // ===================================================

  let matrix =
    soldCartela.matrix;

  // If matrix is stored under another field,
  // support it without changing online behavior.
  if (
    typeof matrix === "string"
  ) {
    try {
      matrix =
        JSON.parse(matrix);
    } catch (e) {
      console.error(
        "❌ INVALID OFFLINE MATRIX:",
        e
      );
      matrix = null;
    }
  }

  // ===================================================
  // 6. FALLBACK: BUILD MATRIX FROM B/I/N/G/O
  // ===================================================

  if (
    !matrix &&
    soldCartela.numbers
  ) {

    let numbers =
      soldCartela.numbers;

    if (
      typeof numbers === "string"
    ) {
      try {
        numbers =
          JSON.parse(numbers);
      } catch (e) {
        console.error(
          "❌ INVALID OFFLINE NUMBERS:",
          e
        );
        numbers = null;
      }
    }

    if (
      numbers &&
      typeof numbers === "object"
    ) {

      const letters = [
        "B",
        "I",
        "N",
        "G",
        "O",
      ];

      matrix = [];

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

          const value =
            numbers[letter]?.[row];

          if (
            row === 2 &&
            col === 2
          ) {

            boardRow.push(
              "FREE"
            );

          } else {

            boardRow.push(
              `${letter} ${value}`
            );
          }
        }

        matrix.push(
          boardRow
        );
      }
    }
  }

  if (!matrix) {

    console.error(
      "❌ OFFLINE CARTELA MATRIX NOT FOUND:",
      soldCartela
    );

    setWinnerMessage(
      "Cartela data error"
    );

    setVerificationStatus(
      "ERROR"
    );

    return;
  }

  console.log(
    "🎫 OFFLINE CARTELA MATRIX:",
    matrix
  );

  // ===================================================
  // 7. LOAD CALLED BALLS
  // SAME LOGIC AS BACKEND
  // ===================================================

  const localBalls =
    await offlineDB.calledBalls
      .where("game_id")
      .equals(
        String(verifyGameId)
      )
      .sortBy("called_at");

  console.log(
    "🎱 OFFLINE CALLED BALLS:",
    localBalls
  );

  // ===================================================
  // 8. BUILD CALLED NUMBER SET
  // ===================================================

  const calledSet =
    new Set();

  for (
    const ball of localBalls
  ) {

    const rawBall =
      typeof ball === "object"
        ? ball.number
        : ball;

    const number =
      parseInt(
        String(rawBall)
          .trim()
          .split(/\s+/)
          .pop(),
        10
      );

    if (
      !Number.isNaN(number)
    ) {
      calledSet.add(number);
    }
  }

  console.log(
    "🎱 OFFLINE CALLED NUMBERS:",
    Array.from(calledSet)
  );

  // ===================================================
  // 9. SAME MARKED() FUNCTION AS BACKEND
  // ===================================================

  function marked(cell) {

    if (
      cell === "FREE"
    ) {
      return true;
    }

    const cellNumber =
      parseInt(
        String(cell)
          .trim()
          .split(/\s+/)
          .pop(),
        10
      );

    if (
      Number.isNaN(cellNumber)
    ) {
      return false;
    }

    const result =
      calledSet.has(
        cellNumber
      );

    console.log(
      `OFFLINE MARK CHECK | ${cell} | number=${cellNumber} | marked=${result}`
    );

    return result;
  }

  // ===================================================
  // 10. CHECKED MATRIX FOR DISPLAY
  // ===================================================

  const checkedMatrix =
    matrix.map(
      (row) =>
        row.map(
          (cell) => {

            const value =
              typeof cell === "object"
                ? cell.number
                : cell;

            const number =
              Number(value);

            return {
              value: cell,
              number,
              marked:
                cell === "FREE" ||
                String(value)
                  .toUpperCase() ===
                  "FREE" ||
                number === 0 ||
                calledSet.has(
                  number
                ),
            };
          }
        )
    );

  console.log(
    "🎫 OFFLINE CHECKED MATRIX:",
    checkedMatrix
  );

  // ===================================================
  // 11. SHOW CARTELA
  // SAME STRUCTURE AS ONLINE
  // ===================================================

  setCheckedCartela({

    id:
      soldCartela.cartelaId ??
      soldCartela.cartela_id ??
      soldCartela.id,

    cartelaId:
      soldCartela.cartelaId ??
      soldCartela.cartela_id ??
      soldCartela.id,

    matrix:
      matrix,
  });

  // ===================================================
  // 12. WINNING PATTERNS
  // SAME LOGIC AS BACKEND
  // ===================================================

  const winningPatterns = [];

  // ===================================================
  // HORIZONTAL LINES
  // ===================================================

  let horizontalCount = 0;

  for (
    let row = 0;
    row < 5;
    row++
  ) {

    let complete = true;

    for (
      let col = 0;
      col < 5;
      col++
    ) {

      if (
        !marked(
          matrix[row][col]
        )
      ) {

        complete = false;
        break;
      }
    }

    if (complete) {

      horizontalCount++;

      const patternCells = [];

      for (
        let col = 0;
        col < 5;
        col++
      ) {

        patternCells.push(
          `${row}-${col}`
        );
      }

      winningPatterns.push(
        patternCells
      );
    }
  }

  const horizontalWinner =
    horizontalCount > 0;

  // ===================================================
  // VERTICAL LINES
  // ===================================================

  let verticalCount = 0;

  for (
    let col = 0;
    col < 5;
    col++
  ) {

    let complete = true;

    for (
      let row = 0;
      row < 5;
      row++
    ) {

      if (
        !marked(
          matrix[row][col]
        )
      ) {

        complete = false;
        break;
      }
    }

    if (complete) {

      verticalCount++;

      const patternCells = [];

      for (
        let row = 0;
        row < 5;
        row++
      ) {

        patternCells.push(
          `${row}-${col}`
        );
      }

      winningPatterns.push(
        patternCells
      );
    }
  }

  const verticalWinner =
    verticalCount > 0;

  // ===================================================
  // DIAGONALS
  // ===================================================

  let diag1Winner = true;

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    if (
      !marked(
        matrix[i][i]
      )
    ) {

      diag1Winner = false;
      break;
    }
  }

  let diag2Winner = true;

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    if (
      !marked(
        matrix[i][4 - i]
      )
    ) {

      diag2Winner = false;
      break;
    }
  }

  let diagonalCount = 0;

  if (diag1Winner) {

    diagonalCount++;

    const patternCells = [];

    for (
      let i = 0;
      i < 5;
      i++
    ) {

      patternCells.push(
        `${i}-${i}`
      );
    }

    winningPatterns.push(
      patternCells
    );
  }

  if (diag2Winner) {

    diagonalCount++;

    const patternCells = [];

    for (
      let i = 0;
      i < 5;
      i++
    ) {

      patternCells.push(
        `${i}-${4 - i}`
      );
    }

    winningPatterns.push(
      patternCells
    );
  }

  const diagonalWinner =
    diagonalCount > 0;

  // ===================================================
  // FOUR CORNERS
  // ===================================================

  const fourCornersWinner =
    marked(matrix[0][0]) &&
    marked(matrix[0][4]) &&
    marked(matrix[4][0]) &&
    marked(matrix[4][4]);

  if (
    fourCornersWinner
  ) {

    winningPatterns.push([
      "0-0",
      "0-4",
      "4-0",
      "4-4",
    ]);
  }

  // ===================================================
  // FOUR CORNERS NEAR STAR
  // ===================================================

  const fourCornersNearStarWinner =
    marked(matrix[1][1]) &&
    marked(matrix[1][3]) &&
    marked(matrix[3][1]) &&
    marked(matrix[3][3]);

  if (
    fourCornersNearStarWinner
  ) {

    winningPatterns.push([
      "1-1",
      "1-3",
      "3-1",
      "3-3",
    ]);
  }

  // ===================================================
  // FULL HOUSE
  // ===================================================

  let fullHouseWinner = true;

  for (
    let row = 0;
    row < 5;
    row++
  ) {

    for (
      let col = 0;
      col < 5;
      col++
    ) {

      if (
        !marked(
          matrix[row][col]
        )
      ) {

        fullHouseWinner = false;
        break;
      }
    }

    if (
      !fullHouseWinner
    ) {
      break;
    }
  }

  if (
    fullHouseWinner
  ) {

    const patternCells = [];

    for (
      let row = 0;
      row < 5;
      row++
    ) {

      for (
        let col = 0;
        col < 5;
        col++
      ) {

        patternCells.push(
          `${row}-${col}`
        );
      }
    }

    winningPatterns.push(
      patternCells
    );
  }

  // ===================================================
  // 13. COUNT COMPLETED PATTERNS
  // ===================================================

  const completedWinningPatterns =
    winningPatterns.length;

  // ===================================================
  // 14. FINAL WINNER
  // SAME LOGIC AS BACKEND
  // ===================================================

  const isWinner =
    isFullHouseRequired
      ? fullHouseWinner
      : completedWinningPatterns >=
        winningPatternCount;

  // ===================================================
  // 15. ONLY REQUIRED PATTERNS BECOME RED
  // SAME LOGIC AS BACKEND
  // ===================================================

  const winningCells =
    isFullHouseRequired
      ? winningPatterns
          .flat()
      : winningPatterns
          .slice(
            0,
            winningPatternCount
          )
          .flat();

  console.log(
    "================================="
  );

  console.log(
    "📴 OFFLINE BINGO VERIFICATION RESULT"
  );

  console.log(
    "Cartela:",
    enteredCartelaId
  );

  console.log(
    "Horizontal count:",
    horizontalCount
  );

  console.log(
    "Vertical count:",
    verticalCount
  );

  console.log(
    "Diagonal count:",
    diagonalCount
  );

  console.log(
    "Four Corners:",
    fourCornersWinner
  );

  console.log(
    "Four Corners Near Star:",
    fourCornersNearStarWinner
  );

  console.log(
    "Full House:",
    fullHouseWinner
  );

  console.log(
    "COMPLETED PATTERNS:",
    completedWinningPatterns
  );

  console.log(
    "REQUIRED PATTERNS:",
    winningPatternCount
  );

  console.log(
    "FINAL WINNER:",
    isWinner
  );

  console.log(
    "WINNING CELLS:",
    winningCells
  );

  console.log(
    "================================="
  );

  // ===================================================
  // 16. SAVE WINNING CELLS
  // ===================================================

  setWinningCells(
    winningCells
  );

  // ===================================================
  // 17. OFFLINE WINNER
  // SAME RESULT FLOW AS ONLINE
  // ===================================================

  if (isWinner) {

    let patternName =
      "🎉 LINE BINGO!";

    if (
      isFullHouseRequired ||
      fullHouseWinner
    ) {

      patternName =
        "🎉 FULL HOUSE!";

    } else if (
      fourCornersWinner
    ) {

      patternName =
        "⭐ FOUR CORNERS!";

    } else if (
      fourCornersNearStarWinner
    ) {

      patternName =
        "⭐ FOUR CORNERS NEAR STAR!";

    }

    setWinnerMessage(
      patternName
    );

    setVerificationStatus(
      "WINNER"
    );

    if (
      currentGame.voiceMode === "recorded" ||
      currentGame.voiceMode === "recorded-oromo"
    ) {

      const folder =
        currentGame.voiceMode ===
        "recorded-oromo"
          ? "oromo"
          : "amharic";

      playRecordedBingoCall(
        `/${folder}/winner.wav`
      );

    } else {

      stopAllActiveAudio();

      const speech =
        new SpeechSynthesisUtterance(
          `Bingo! Cartela ${enteredCartelaId} is a winner!`
        );

      speech.pitch = 0.6;
      speech.rate = 1.2;

      window.speechSynthesis.speak(
        speech
      );
    }

    return;
  }

  // ===================================================
  // 18. OFFLINE NOT WINNER
  // ===================================================

  setWinnerMessage(
    "❌ No Bingo"
  );

  setVerificationStatus(
    "NOT_WINNER"
  );

  if (
    currentGame.voiceMode === "recorded" ||
    currentGame.voiceMode === "recorded-oromo"
  ) {

    const folder =
      currentGame.voiceMode ===
      "recorded-oromo"
        ? "oromo"
        : "amharic";

    playRecordedBingoCall(
      `/${folder}/notwinner.wav`
    );

  } else {

    stopAllActiveAudio();

    const speech =
      new SpeechSynthesisUtterance(
        `Cartela ${enteredCartelaId} is not a winner yet.`
      );

    speech.pitch = 0.65;
    speech.rate = 1.15;

    window.speechSynthesis.speak(
      speech
    );
  }

  return;
}

    // =====================================================
    // ONLINE VERIFICATION
    // =====================================================

    const response = await fetch(
      `${API_URL}/games/${verifyGameId}/verify-cartela`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          cartelaId:
            cartelaId.trim(),
        }),
      }
    );

    const verificationData =
      await response.json();

    // -----------------------------------------------------
    // NOT SOLD
    // -----------------------------------------------------

    if (!verificationData.sold) {

      setWinnerMessage(
        `ID ${cartelaId} NOT SOLD!`
      );

      setVerificationStatus(
        "NOT_SOLD"
      );

     // 🎙️ PLAY THE CASHIER'S SELECTED VOICE
playRecordedAudio("notsold");

      return;
    }

    // -----------------------------------------------------
    // ONLINE SOLD CARTELA
    // -----------------------------------------------------

    setCheckedCartela(
      verificationData.cartela
    );

    setWinningCells(
      verificationData.winningCells ||
        []
    );

    // -----------------------------------------------------
    // ONLINE WINNER
    // -----------------------------------------------------

    if (verificationData.isWinner) {

      let patternName =
        "🎉 LINE BINGO!";

      if (
        verificationData.isFullHouse
      ) {

        patternName =
          "🎉 FULL HOUSE!";

      } else if (
        verificationData.isFourCorners
      ) {

        patternName =
          "⭐ FOUR CORNERS!";
      }

      setWinnerMessage(
        patternName
      );

      setVerificationStatus(
        "WINNER"
      );

    // 🎙️ PLAY THE CASHIER'S SELECTED VOICE
playRecordedAudio("winner");

    } else {

      // ---------------------------------------------------
      // ONLINE NOT WINNER
      // ---------------------------------------------------

      setWinnerMessage(
        "❌ No Bingo"
      );

      setVerificationStatus(
        "NOT_WINNER"
      );

     // 🎙️ PLAY THE CASHIER'S SELECTED VOICE
playRecordedAudio("notwinner");
    }

  } catch (err) {

    console.error(
      "Verification Error:",
      err
    );

    setWinnerMessage(
      "Verification error"
    );

    setVerificationStatus(
      "ERROR"
    );
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
 <div className="bingo-wrapper">
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

        fontSize: "30px",
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
 {/* =======================================================
    1. MASTER BINGO GRID (STAYS UP TOP FULL WIDTH)
    ======================================================= */}
{/* =======================================================
    1. MASTER LAYOUT CONTAINER (BOARD + SIDEBAR ROW)
    ======================================================= */}
<div 
  style={{ 
    display: "flex", 
    alignItems: "flex-start",     /* Aligns the top edge of the board with the top edge of the widgets */
    justifyContent: "center",     /* Centers the whole layout on the screen */
    gap: "20px",                  /* Horizontal distance between the board and the sidebar */
    margin: "0 auto", 
    width: "max-content",
    padding: "10px"
  }}
>
 <div 
  style={{ 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "stretch", 
    width: "100%", 
  }} 
>
  {/* ---------------------------------------------------
      A: MASTER BINGO GRID (LEFT SIDE)
      --------------------------------------------------- */}
  {/* ============================================================
    LEFT SIDE — BINGO BOARD + CALLING HISTORY
    ============================================================ */}

<div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    flexShrink: 0,
    width: "max-content",
  }}
>

 {/* ================= BINGO BOARD ================= */}

<section
  className="board-section"
  style={{
    margin: "0 0 50px 0",
    padding: 0,
  }}
>
 <div className="bingo-board">
    {['B', 'I', 'N', 'G', 'O'].map((letter) => (
      <div key={letter} className="board-row">

        <div className={`letter-header ${letter.toLowerCase()}`}>
          {letter}
        </div>

        <div className="row-numbers">
          {getRowNumbers(letter).map((num) => {
            const active = isNumberCalled(letter, num);

            const activeClass = active
              ? `active-${letter.toLowerCase()}`
              : '';

            // 🎰 RANDOM ROLLING NUMBER
            const isBlinking = blinkingNumber === num;

            return (
              <div
                key={num}
                className={`number-cell ${activeClass} ${
                  isBlinking ? "random-blink-number" : ""
                }`}
              >
                {num}
              </div>
            );
          })}
        </div>

      </div>
    ))}
  </div>
</section>
 {/* ============================================================ 
    3. CALLED BALL HISTORY + LARGE CURRENT BALL 
    ============================================================ */} 
 
<div 
  className="called-section" 
  style={{ 
   
 
    background: "rgb(0, 0, 0)", 
  width: "100%", 
    margin: "0", 
    padding: "8px 10px", 
    boxSizing: "border-box", 
    borderRadius: "0 0 10px 10px", 
 
    display: "flex", 
    alignItems: "center", 
 
    gap: "100px", 
 
    overflow: "hidden", 
  }} 
> 
 
  {/* ============================================================ 
      LEFT — LARGE CURRENT BALL 
      ============================================================ */} 
 
  <div 
    style={{ 
      width: "210px", 
      minWidth: "210px", 
      height: "165px", 
 
      display: "flex", 
      flexDirection: "column", 
 
      alignItems: "center", 
      justifyContent: "center", 
 
      boxSizing: "border-box", 
 
      border: "2px solid rgba(244, 237, 240, 0.8)", 
 
      borderRadius: "12px", 
 
      background: 
        "linear-gradient(145deg, rgba(255,90,165,0.10), rgba(0,0,0,0.55))", 
 
      boxShadow: 
        "0 0 15px rgba(255,90,165,0.25)", 
 
      flexShrink: 0, 
    }} 
  > 
 
    {/* CURRENT BALL TITLE */} 
 
    
 
    {/* ======================================================== 
        LARGE CURRENT BALL 
        ======================================================== */} 
 
    <div 
      style={{ 
        width: "217px", 
        height: "217px", 
 
        borderRadius: "50%", 
 
        display: "flex", 
 
        alignItems: "center", 
        justifyContent: "center", 
 
        background: 
          "radial-gradient(circle at 35% 30%, #ffffff 0%, #f4f5f7 48%, #cfd4dc 100%)", 
 
        border: 
          "5px solid #f5e9ee", 
 
        boxShadow: 
          ` 
          0 0 10px rgba(255,90,165,0.9), 
          0 0 25px rgba(255,90,165,0.55), 
          inset 0 2px 5px rgba(255,255,255,0.95), 
          inset 0 -6px 8px rgba(0,0,0,0.2), 
          0 4px 10px rgba(0,0,0,0.55) 
          `, 
 
        flexShrink: 0, 
 
        transform: current 
          ? "scale(1.08)" 
          : "scale(1)", 
 
        transition: 
          "transform 0.25s ease, box-shadow 0.25s ease", 
      }} 
    > 
 
      {current ? ( 
 
        <div 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
 
            alignItems: "center", 
            justifyContent: "center", 
 
            lineHeight: "1", 
 
            color: "#172033", 
 
            fontWeight: "900", 
          }} 
        > 
 
          {/* CURRENT LETTER */} 
 
          <span 
            style={{ 
              fontSize: "55px", 
              fontWeight: "900", 
 
              lineHeight: "1", 
 
              marginBottom: "4px", 
            }} 
          > 
            {current.split(" ")[0]} 
          </span> 
 
 
          {/* CURRENT NUMBER */} 
 
          <span 
            style={{ 
              fontSize: "120px", 
              fontWeight: "900", 
 
              lineHeight: "0.9", 
            }} 
          > 
            {current.split(" ")[1]} 
          </span> 
 
        </div> 
 
      ) : ( 
 
        <span 
          style={{ 
            fontSize: "18px", 
 
            letterSpacing: "0.5px", 
 
            color: "#000000", 
 
            fontWeight: "bold", 
          }} 
        > 
          {t.ready} 
        </span> 
 
      )} 
 
    </div> 
 
 
    {/* STATUS DOTS */} 
 
    <div 
      style={{ 
        marginTop: "5px", 
 
        gap: "3px", 
 
        display: "flex", 
      }} 
    > 
 
      <div 
        style={{ 
          width: "4px", 
          height: "4px", 
 
          borderRadius: "50%", 
 
          background: 
            !paused 
              ? "#00ff66" 
              : "#8c9cb3", 
        }} 
      /> 
 
      <div 
        style={{ 
          width: "4px", 
          height: "4px", 
 
          borderRadius: "50%", 
 
          background: 
            !paused 
              ? "#00ff66" 
              : "#8c9cb3", 
        }} 
      /> 
 
    </div> 
 
  </div> 
 
 
  {/* ============================================================ 
      MIDDLE — CALLING HISTORY 
      ============================================================ */} 
 
  <div 
    style={{ 
      flex: "1", 
 
      minWidth: "0", 
 
      display: "flex", 
      flexDirection: "column", 
 
      justifyContent: "center", 
 
      overflow: "hidden", 
    }} 
  > 
  {/* CALLING HISTORY TITLE + COUNT */} 
 
    <div 
      style={{ 
        display: "flex", 
 
        alignItems: "center", 
 
        gap: "10px", 
 
        marginBottom: "5px", 
 
        color: "#8c9cb3", 
 
        fontWeight: "bold", 
      }} 
    > 
 
      <span 
        style={{ 
          fontSize: "20px", 
 
          color: "#00f0ff", 
 
          fontWeight: "900", 
 
          letterSpacing: "1px", 
        }} 
      > 
        
      </span> 
 
 
      <span 
        style={{ 
          fontSize: "12px", 
 
          color: "#070707", 
 
          fontWeight: "900", 
        }} 
      > 
        {called.length}
      </span> 
 
    </div> 
 
 
   
    {/* ======================================================== 
        HISTORY BALLS 
        ======================================================== */} 
 
    <div 
      style={{ 
        display: "flex", 
 
        justifyContent: "flex-start", 
 
        alignItems: "center", 
 
        gap: "8px", 
 
        minHeight: "115px", 
 
        width: "100%", 
 
        overflow: "hidden", 
      }} 
    > 
 
      {incomingHistoryBalls.length > 0 ? ( 
 
        incomingHistoryBalls.map((ballStr, idx) => { 
 
          const parts = 
            String(ballStr) 
              .trim() 
              .split(/\s+/); 
 
          const letter = parts[0]; 
 
          const num = parts[1]; 
 
 
          /* ================================================== 
             BINGO BALL COLORS 
             ================================================== */ 
 
          const ballColors = { 
 
            B: { 
              border: "#35a9ff", 
              glow: "rgba(53,169,255,0.55)", 
            }, 
 
            I: { 
              border: "#f2d35c", 
              glow: "rgba(242,211,92,0.55)", 
            }, 
 
            N: { 
              border: "#35a9ff", 
              glow: "rgba(53,169,255,0.55)", 
            }, 
 
            G: { 
              border: "#35d68a", 
              glow: "rgba(53,214,138,0.55)", 
            }, 
 
            O: { 
              border: "#ff6b6b", 
              glow: "rgba(255,107,107,0.55)", 
            }, 
 
          }; 
 
 
          const ball = 
            ballColors[letter] || { 
 
              border: "#ffffff", 
 
              glow: 
                "rgba(255,255,255,0.4)", 
 
            }; 
 
 
          return ( 
 
            <div 
              key={`${ballStr}-${idx}`} 
              style={{ 
                width: "210px", 
                height: "210px", 
 
                minWidth: "105px", 
 
                borderRadius: "50%", 
 
                border: 
                  `4px solid ${ball.border}`, 
 
                background: 
                  "radial-gradient(circle at 35% 30%, #ffffff 0%, #f4f5f7 55%, #d8dce2 100%)", 
 
                boxShadow: 
                  ` 
                  0 0 7px ${ball.glow}, 
                  inset 0 1px 3px rgba(255,255,255,0.9), 
                  inset 0 -3px 5px rgba(0,0,0,0.18), 
                  0 2px 4px rgba(0,0,0,0.45) 
                  `, 
 
                display: "flex", 
 
                flexDirection: "column", 
 
                alignItems: "center", 
 
                justifyContent: "center", 
 
                boxSizing: "border-box", 
 
                opacity: 
                  Math.max( 
                    0.55, 
                    1 - idx * 0.08 
                  ), 
 
                flexShrink: 0, 
              }} 
            > 
 
              {/* LETTER */} 
 
              <div 
                style={{ 
                  fontSize: "80px", 
 
                  fontWeight: "900", 
 
                  color: "#000000", 
 
                  lineHeight: "1", 
 
                  marginBottom: "3px", 
                }} 
              > 
                {letter} 
              </div> 
 
 
              {/* NUMBER */} 
 
              <div 
                style={{ 
                  fontSize: "110px", 
 
                  fontWeight: "900", 
 
                  color: "#000000", 
 
                  lineHeight: "0.9", 
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
            fontSize: "20px", 
 
            color: "#4b5970", 
 
            fontStyle: "italic", 
          }} 
        > 
          {t.waitingToBegin} 
        </div> 
 
      )} 
 
    </div> 
   {/* ============================================================
    RIGHT — SHOW/HIDE SOLD CARTELAS BUTTON
    ============================================================ */}

<button
  type="button"
  onClick={() => setShowSoldCartelas((prev) => !prev)}
  title={showSoldCartelas ? "Hide sold Cartelas" : "Show sold Cartelas"}
  style={{
    width: "28px",
    height: "28px",
    minWidth: "28px",
    minHeight: "28px",

    borderRadius: "6px",
    border: "1px solid rgba(0,240,255,0.8)",

    background: "#0b1320",
    color: "#00f0ff",

    cursor: "pointer",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: "35px",
    fontWeight: "900",

    padding: 0,
    margin: 0,
    lineHeight: 1,

    position: "absolute",
    right: "6px",
    top: "60%",
    transform: "translateY(-50%)",

    zIndex: 1000001,

    boxShadow: "0 2px 8px rgba(0,0,0,0.6)",

    flexShrink: 0,
  }}
>
  {showSoldCartelas ? "◀" : "▶"}
</button>
</div> </div> </div>


  </div> 
 


 

{/* ============================================================
    RIGHT SIDE — KEEP YOUR EXISTING VERTICAL COLUMN HERE
    ============================================================ */}

{/* 🚨 STRICTLY FORCED VERTICAL COLUMN */}

<div 
  style={{ 
    display: "flex", 
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center", 
    gap: "16px",
    flexShrink: 0,
    width: "max-content"
  }}
>
 {/* =======================================================
    🏆 ITEM 1: WINNING PATTERN PREVIEW CARD
    ======================================================= */}
{activeWinningPattern && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px",
      width: "100%"
    }}
  >
    {/* 🏆 TITLE */}
    <div
      style={{
        fontSize: "11px",
        fontWeight: "900",
        color: "#ffffff", /* Fixed to white for dark backgrounds */
        letterSpacing: "0.7px",
        marginBottom: "2px",
        textAlign: "center",
      }}
    >
      🏆 {activeWinningPattern} PATTERN
      {activeWinningPattern > 1 ? "S" : ""}
    </div>

    {/* 🎟️ BINGO CARD MATRIX */}
    <div
      style={{
        width: "250px",
        height: "320px",
        background: "#dce8f2",
        border: "2px solid #657789",
        borderRadius: "6px",
        overflow: "hidden",
        boxSizing: "border-box",
        boxShadow: "0 2px 5px rgba(0,0,0,0.18)",
      }}
    >
      {/* 🔤 BINGO HEADER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          height: "27px",
          background: "#536b82",
          borderBottom: "2px solid #71869a",
        }}
      >
        {["B", "I", "N", "G", "O"].map((letter) => (
          <div
            key={letter}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0054b8",
              fontSize: "12px",
              fontWeight: "900",
              textShadow: "0 1px 1px rgba(0,0,0,0.25)",
              borderRight: "1px solid rgba(255,255,255,0.18)",
              boxSizing: "border-box",
            }}
          >
            {letter}
          </div>
        ))}
      </div>

      {/* 🔲 5 × 5 GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gridTemplateRows: "repeat(5, 1fr)",
          width: "100%",
          height: "calc(100% - 27px)",
          background: "#dce8f2",
        }}
      >
        {Array.from({ length: 25 }).map((_, index) => {
          const row = Math.floor(index / 5);
          const col = index % 5;
          const cellKey = `${row}-${col}`;

          const highlighted = displayedWinningPatterns?.includes(cellKey) ?? false;

          return (
            <div
              key={index}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: highlighted ? "#cbdbea" : "#e3edf5",
                borderRight: col < 4 ? "1px solid #91a5b8" : "none",
                borderBottom: row < 4 ? "1px solid #91a5b8" : "none",
                boxSizing: "border-box",
              }}
            >
              {/* 🔵 WINNING CIRCLE */}
              {highlighted && (
                <div
                  style={{
                    width: "72%",
                    height: "72%",
                    maxWidth: "24px",
                    maxHeight: "24px",
                    minWidth: "11px",
                    minHeight: "11px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 35% 30%, #4d9cff, #0066d6 65%, #0054b8)",
                    border: "1px solid #004fa8",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

    {/* =======================================================
        💙 ITEM 2: LEFT PANEL INTERFACE (CONTROLS & INCOME)
        ======================================================= */}
    <div
      className="left-panel"
      style={{
        padding: "6px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        borderTop: "1px solid rgba(255,255,255,0.05)", /* Subtle top line separating from Item 1 */
        width: "95%",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* CARD ID VERIFICATION SLOT */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <input
          type="text"
          value={cartelaId}
          onChange={(e) => setCartelaId(e.target.value)}
          placeholder={t.cardIdPlaceholder}
          style={{
            background: "rgba(12, 22, 45, 0.85)",
            border: "1.5px solid #edf6ef",
            color: "#ffffff",
            borderRadius: "30px",
            padding: "3px 10px",
            fontSize: "27px",
            fontWeight: "bold",
            outline: "none",
            textAlign: "center",
            height: "45px",
            boxShadow: "0 0 8px rgba(0, 255, 55, 0.25)",
          }}
        />

        <button
          className="ctrl-btn green-border"
          style={{
            justifyContent: "center",
            padding: "2px",
            fontSize: "18px",
            background: "rgb(25, 111, 216)",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            borderRadius: "30px",
            height: "22px",
            boxShadow: "0 0 10px rgba(0, 84, 184, 0.3)",
            cursor: "pointer"
          }}
          onClick={checkWinner}
        >
          <span>{t.verifyCard}</span>
        </button>
      </div>

      {/* PLAY/PAUSE ACTION AND INCOME STATUS CARD */}
      <div
        className="info-card"
        style={{
          padding: "6px",
          background: "rgba(13, 29, 45, 0.6)",
          borderRadius: "14px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(4px)",
          boxShadow: "0 0 12px rgba(8, 7, 7, 0.95)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <button
            className="ctrl-btn gold-border"
            style={{
              padding: "2px 8px",
              fontSize: "17px",
              fontWeight: "800",
              background: "#2278e1",
              flex: 1,
              justifyContent: "center",
              borderRadius: "100px",
              height: "26px",
              color: "#ffffffff",
              boxShadow: "0 0 10px rgba(245, 243, 243, 0.94)",
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
            fontSize: "65px",
            color: "#ffffffff",
            fontWeight: "bold",
            letterSpacing: "1px"
          }}
        >
           ደራሽ
        </div>

        <div
          style={{
            fontSize: "70px",
            color: "#ffffffff",
            fontWeight: "900",
            textShadow: "0 0 12px rgba(2, 2, 2, 0.07)",
            lineHeight: "1.1"
          }}
        >
          {game.netIncome ? game.netIncome : game.prize}
        </div>
      </div>
    </div>
  </div>
  {/* =======================================================
        ITEM 3: High-Visibility Current Called Display
        ======================================================= */}
  {/* CALLING HISTORY TITLE + COUNT */}

<div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    marginBottom: "5px",
    color: "#8c9cb3",
    fontWeight: "bold",
  }}
>
  {/* TOTAL CALLS */}
  <span
    style={{
      fontSize: "28px",
      color: "#ffffff",
      fontWeight: "900",
      letterSpacing: "2px",
      lineHeight: "1",
    }}
  >
    TOTAL CALLS
  </span>

  {/* NUMBER */}
  <span
    style={{
      fontSize: "140px",
      color: "#ffffff",
      fontWeight: "900",
      lineHeight: "0.9",
    }}
  >
    {called.length}
  </span>
</div>
   
    {/* =======================================================
        🎙️ ITEM 4: TEXT-ONLY COUNTDOWN DISPLAY
        ======================================================= */}
    {/* =======================================================
    🎙️ ITEM 4: RECTANGULAR EDITABLE COUNTDOWN DISPLAY
    ======================================================= */}
{(() => {
  // 🎨 EDITABLE STYLE CONFIGURATION VARIABLES
  const BOX_WIDTH = "50%";        // Width of the rectangle box container
  const BOX_HEIGHT = "100px";     // Height of the rectangle box container
  const BOX_BG = "#09090a";       // Background color
  const BOX_BORDER = "1px solid rgba(12, 12, 12, 0)";
  const BOX_RADIUS = "8px";       // Box corner roundness

  const FONT_SIZE = "90px";       // Countdown font size
  const FONT_WEIGHT = "3000";     // Countdown font weight

  // Editable individual state text colors
  const COLOR_PAUSED = "#ffffffff";
  const COLOR_VOICE = "#ffffffff";
  const COLOR_DELAY = "#fffffffffff";
  const COLOR_DEFAULT = "#ffffffff";

  return (
    <div
      style={{
        width: "100%",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        paddingTop: "12px",
        marginTop: "4px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        className="countdown-rectangular-box"
        style={{
          fontStyle: "normal",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          justifyContent: "center",
          flexShrink: 0,
          width: BOX_WIDTH,
          height: BOX_HEIGHT,
          background: BOX_BG,
          border: BOX_BORDER,
          borderRadius: BOX_RADIUS,
          boxSizing: "border-box",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.9)",
        }}
      >

        {/* NEXT CALL */}
        <div
          style={{
            color: "#ffffff",
            fontSize: "24px",
            fontWeight: "900",
            lineHeight: "1",
            marginBottom: "6px",
          }}
        >
          NEXT CALL
        </div>

        {/* COUNTDOWN */}
        {paused ? (

          /* Paused - show nothing */
          null

        ) : current && audioDuration > 0 && audioCurrentTime < audioDuration ? (

          /* Voice playback countdown */
          <span
            style={{
              color: COLOR_VOICE,
              fontSize: FONT_SIZE,
              fontWeight: FONT_WEIGHT,
              display: "inline-flex",
              alignItems: "baseline",
              lineHeight: "1",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {/* Seconds number */}
            <span
              style={{
                display: "inline-block",
                minWidth: "1.2ch",
                textAlign: "right",
              }}
            >
              {Math.ceil(
                Math.max(0, audioDuration - audioCurrentTime)
              )}
            </span>

            {/* s stays beside the number */}
            <span
              style={{
                display: "inline-block",
                marginLeft: "4px",
              }}
            >
              s
            </span>
          </span>

        ) : current && callIntervalTimeLeft > 0 ? (

          /* Delay pacing interval countdown */
          <span
            style={{
              color: COLOR_DELAY,
              fontSize: FONT_SIZE,
              fontWeight: FONT_WEIGHT,
              display: "inline-flex",
              alignItems: "baseline",
              lineHeight: "1",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {/* Hourglass */}
            <span
              style={{
                display: "inline-block",
                marginRight: "8px",
              }}
            >
              ⏳
            </span>

            {/* Seconds number */}
            <span
              style={{
                display: "inline-block",
                minWidth: "1.2ch",
                textAlign: "right",
              }}
            >
              {Math.ceil(callIntervalTimeLeft)}
            </span>

            {/* s */}
            <span
              style={{
                display: "inline-block",
                marginLeft: "4px",
              }}
            >
              s
            </span>
          </span>

        ) : (

          /* Call finished - hide countdown completely */
          null

        )}

      </div>
    </div>
  );
})()}
  </div> {/* Closes vertical column wrapper */}
</div> {/* Closes horizontal side-by-side board wrapper */}
  
  {/* =======================================================
    2. MIDDLE CONTROLS ROW (TOUCHING IMMEDIATELY UNDER THE BOARD)
    ======================================================= */}
<div 
  style={{ 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", /* Packs everything closely into the center */
    gap: "20px",              /* Tight spacing between items */
    margin: "0 auto",         /* Centers the container horizontally */
    padding: "4px 24px",      /* Small padding to keep things compact */
    width: "max-content",     /* Prevents container from stretching across the screen */
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.05)"
  }}
>
  
  {/* 💡 PASTE YOUR MIDDLE ITEMS (LIKE THE BALL MIXER) DIRECTLY IN HERE */}




          
         {/* ============================================================
    CENTER AREA: WINNING PATTERN (LEFT) + ROLLING MACHINE (RIGHT)
    ============================================================ */}
<div
  style={{
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
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
      {/* ========================================================
          VERIFICATION CARTELA
          CHANGE ONLY width / height BELOW
          EVERYTHING INSIDE WILL GROW WITH IT
          ======================================================== */}
      <div
        style={{
          position: "relative",

          /* ======================================================
             ⭐ MAIN SIZE CONTROL ⭐
             Change these two values.
             Example:
             700px x 700px
             800px x 800px
             900px x 750px
             ====================================================== */
          width: "700px",
          height: "700px",

          maxWidth: "92vw",
          maxHeight: "92vh",

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

          display: "flex",
          flexDirection: "column",

          overflow: "hidden",
        }}
      >
        {/* ======================================================
            CLOSE
            ====================================================== */}
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

            zIndex: 10,

            padding: 0,
          }}
        >
          ✕
        </button>

        {/* ======================================================
            STATUS
            ====================================================== */}
        <div
          style={{
            textAlign: "center",

            marginBottom: "1%",
            paddingRight: "30px",

            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: "clamp(16px, 2.5vw, 30px)",
              fontWeight: "900",

              color:
                verificationStatus === "WINNER"
                  ? "#00ff66"
                  : "#ff3344",

              lineHeight: "1.1",
            }}
          >
            {verificationStatus === "WINNER"
              ? `🎉 ${t.winner}!`
              : "❌ NO BINGO YET"}
          </div>

          <div
            style={{
              marginTop: "1px",

              fontSize: "clamp(12px, 1.5vw, 20px)",
              color: "#94a3b8",
              fontWeight: "700",

              lineHeight: "1.1",
            }}
          >
            Cartela #{checkedCartela.id || checkedCartela.cartelaId}
          </div>
        </div>

        {/* ======================================================
            B I N G O HEADER
            ====================================================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",

            gap: "0.6%",

            width: "100%",

            height: "8%",

            marginBottom: "0.6%",

            flexShrink: 0,

            boxSizing: "border-box",
          }}
        >
          {["B", "I", "N", "G", "O"].map((letter, index) => (
            <div
              key={index}
              style={{
                width: "100%",
                height: "100%",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                borderRadius: "6px",

                background: "#111c31",

                border: "2px solid #00c8ff",

                color: "#00c8ff",

                /*
                 * Header text grows with popup width
                 */
                fontSize: "clamp(16px, 3vw, 36px)",

                fontWeight: "900",

                boxSizing: "border-box",

                lineHeight: "1",
              }}
            >
              {letter}
            </div>
          ))}
        </div>

        {/* ======================================================
            CARTELA
            ====================================================== */}
        <div
          style={{
            display: "grid",

            gridTemplateColumns: "repeat(5, 1fr)",
            gridTemplateRows: "repeat(5, 1fr)",

            gap: "0.6%",

            width: "100%",

            /*
             * The 5 rows share the available height.
             */
            flex: "1 1 auto",

            minHeight: 0,

            boxSizing: "border-box",
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
                    /*
                     * IMPORTANT:
                     * No fixed 38px height.
                     * Every cell fills its grid row.
                     */
                    width: "100%",
                    height: "100%",

                    minWidth: 0,
                    minHeight: 0,

                    background: isFree
                      ? "#1f1e1d"
                      : isWinnerCell
                        ? "#FF0000"
                        : isCalled
                          ? "#1555df"
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

                    overflow: "hidden",

                    boxShadow: isWinnerCell
                      ? "0 0 14px rgba(255,0,0,0.8)"
                      : isCalled
                        ? "0 0 10px rgba(0,255,102,0.5)"
                        : "none",
                  }}
                >
                  {/* ==================================================
                      CHECK MARK
                      ================================================== */}
                  {isCalled && (
                    <div
                      style={{
                        position: "absolute",

                        top: "2%",
                        right: "2%",

                        /*
                         * Check mark scales with the cell.
                         */
                        width: "clamp(13px, 2vw, 30px)",
                        height: "clamp(13px, 2vw, 30px)",

                        borderRadius: "50%",

                        background: "#1555df",

                        color: "#000",

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        fontSize: "clamp(9px, 1.2vw, 18px)",

                        fontWeight: "900",

                        lineHeight: "1",

                        zIndex: 2,
                      }}
                    >
                      ✓
                    </div>
                  )}

                  {/* ==================================================
                      NUMBER
                      ================================================== */}
                  <span
                    style={{
                      /*
                       * NUMBER SCALES WITH THE POPUP
                       */
                      fontSize: isFree
                        ? "clamp(12px, 2vw, 28px)"
                        : "clamp(20px, 4vw, 52px)",

                      fontWeight: "900",

                      lineHeight: "1",

                      textAlign: "center",

                      maxWidth: "100%",

                      position: "relative",

                      zIndex: 1,
                    }}
                  >
                    {isFree ? "FREE" : num}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* ======================================================
            LEGEND
            ====================================================== */}
        <div
          style={{
            marginTop: "1%",

            display: "flex",
            justifyContent: "center",
            alignItems: "center",

            gap: "2%",

            flexWrap: "wrap",

            /*
             * Legend scales too.
             */
            fontSize: "clamp(10px, 1.2vw, 18px)",

            fontWeight: "700",

            color: "#cbd5e1",

            flexShrink: 0,

            lineHeight: "1.1",
          }}
        >
          {/* CALLED */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              style={{
                width: "clamp(10px, 1.2vw, 18px)",
                height: "clamp(10px, 1.2vw, 18px)",

                background: "#1555df",

                border: "1.5px solid #1555df",

                borderRadius: "2px",

                flexShrink: 0,
              }}
            />

            Called
          </div>

          {/* NOT CALLED */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              style={{
                width: "clamp(10px, 1.2vw, 18px)",
                height: "clamp(10px, 1.2vw, 18px)",

                background: "#1E293B",

                border: "1px solid #334155",

                borderRadius: "2px",

                flexShrink: 0,
              }}
            />

            Not Called
          </div>

          {/* FREE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              style={{
                width: "clamp(10px, 1.2vw, 18px)",
                height: "clamp(10px, 1.2vw, 18px)",

                background: "#FFD700",

                borderRadius: "2px",

                flexShrink: 0,
              }}
            />

            Free
          </div>
        </div>
      </div>
    </div>
  )}
</div>
 </div>       
 
       {/* =========================================================
    SOLD CARTELAS OVERLAY
    ALL NUMBERS VISIBLE — NO SCROLLING
    ========================================================= */}
{showSoldCartelas && (
  <div
    style={{
      position: "fixed",

      top: "50%",
      left: "50%",

      transform: "translate(-50%, -50%)",

      width: "min(92vw, 1200px)",

      maxHeight: "80vh",

      background: "rgba(5, 12, 30, 0.98)",

      border: "3px solid rgba(0, 240, 255, 0.85)",

      borderRadius: "16px",

      padding: "18px",

      boxSizing: "border-box",

      zIndex: 999999,

      boxShadow:
        "0 12px 45px rgba(0, 0, 0, 0.9)",

      display: "flex",

      flexDirection: "column",

      alignItems: "center",

      justifyContent: "center"
    }}
  >

    {/* =====================================================
        TITLE
        ===================================================== */}
    <div
      style={{
        color: "#00f0ff",

        fontSize: "70px",

        fontWeight: "bold",

        marginBottom: "14px",

        textAlign: "center"
      }}
    >
    Kartelaawwan qabaman \ የተያዙ ካርቴላዎች ({soldCartelaIds.length})
    </div>


    {/* =====================================================
        ALL CARTELA NUMBERS
        NO SCROLL
        AUTOMATIC GRID
        ===================================================== */}
    {soldCartelaIds.length > 0 ? (

      <div
        style={{
          width: "100%",

          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(65px, 1fr))",

          gap: "40px",

          alignItems: "center",

          justifyItems: "center",

          boxSizing: "border-box"
        }}
      >

        {soldCartelaIds.map((num) => (

          <div
            key={num}
            style={{
              width: "100%",

              minWidth: "60px",

              maxWidth: "90px",

              height: "55px",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              background:
                "rgba(0, 240, 255, 0.15)",

              border:
                "2px solid rgba(0, 240, 255, 0.55)",

              borderRadius: "40px",

              color: "#ffffff",

              fontSize: "40px",

              fontWeight: "bold",

              boxSizing: "border-box"
            }}
          >
            #{num}
          </div>

        ))}

      </div>

    ) : (

      <div
        style={{
          color: "#aaaaaa",

          fontSize: "18px",

          padding: "20px"
        }}
      >
        No sold cartelas
      </div>

    )}

  </div>
)}
         <button
  type="button"
  onClick={() => setShowGameControls((prev) => !prev)}
  title={showGameControls ? "Hide game controls" : "Show game controls"}
  style={{
    width: "24px",
    height: "24px",
    minWidth: "24px",
    minHeight: "24px",

    borderRadius: "4px",
    border: "1px solid rgba(0,240,255,0.8)",
    background: "rgba(0,0,0,0.65)",
    color: "#00f0ff",

    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: "40px",
    fontWeight: "bold",
    padding: 0,
    margin: 0,
    lineHeight: 1,

    boxShadow: "0 1px 6px rgba(0,0,0,0.6)",

    position: "absolute",
    right: "4px",
    top: "95%",
    transform: "translateY(-50%)",

    zIndex: 1000001,
  }}
>

 
  {showGameControls ? "◀" : "▶"}
</button>
         

        {/* --- 4. REMAINING UI / FOOTER CONSOLE BAR (TOUCHES CALLED BALLS IMMEDIATELY) --- */}
       {/* =========================================================
    SMALL GAME CONTROLS SHOW / HIDE
    ========================================================= */}

<div
  style={{
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    flexShrink: 0,
    zIndex: 1000000,
  }}
>

  {/* =======================================================
      SMALL SHOW / HIDE ARROW
      ======================================================= */}

 
  {/* =======================================================
      CONTROLS PANEL
      ======================================================= */}

  {showGameControls && (
    <div
      style={{
        position: "fixed",

        top: "50%",

        right: "20px",

        transform:
          "translateY(-50%)",

        width: "300px",

        padding: "16px",

        background:
          "rgba(5,12,30,0.98)",

        border:
          "2px solid rgba(0,240,255,0.8)",

        borderRadius: "14px",

        boxSizing: "border-box",

        zIndex: 999999,

        boxShadow:
          "0 10px 40px rgba(0,0,0,0.85)",

        display: "flex",

        flexDirection: "column",

        gap: "14px",
      }}
    >

      {/* =====================================================
          VOICE MODE
          ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >

        <span
          style={{
            color: "#fff",
            fontWeight: "bold",
            fontSize: "15px",
          }}
        >
          🎙️ VOICE
        </span>

       <select
  value={game?.voiceMode || "recorded-oromo"}
  onChange={(e) => {
    const selectedVoice = e.target.value;

    setGame((prev) => ({
      ...prev,
      voiceMode: selectedVoice,
      speechLang:
        selectedVoice === "recorded-oromo"
          ? "om-ET"
          : "en-US",
    }));

    const currentUserRaw =
      localStorage.getItem("currentUser");

    if (!currentUserRaw) {
      console.warn(
        "⚠️ CURRENT USER NOT FOUND — VOICE NOT SAVED"
      );
      return;
    }

    try {
      const currentUser =
        JSON.parse(currentUserRaw);

      const cashierId =
        currentUser?.username;

      if (!cashierId) {
        console.warn(
          "⚠️ CASHIER USERNAME NOT FOUND"
        );
        return;
      }

      const voiceKey =
        `cashier_voice_selection_${cashierId}`;

      // 💾 Permanent until cashier changes it
      localStorage.setItem(
        voiceKey,
        selectedVoice
      );

      console.log(
        "💾 PERMANENT VOICE SAVED:",
        {
          cashier: cashierId,
          voice: selectedVoice,
          key: voiceKey,
        }
      );

    } catch (error) {
      console.error(
        "❌ FAILED TO SAVE CASHIER VOICE:",
        error
      );
    }
  }}
>
  <option value="recorded-oromo">
    🟢 arada1
  </option>

  <option value="voice2">
    🎙️ arada bass
  </option>

  <option value="voice3">
    🎙️ arada bass1
  </option>

  <option value="voice4">
    🎙️ Voice 4
  </option>

  <option value="voice5">
    🎙️ Voice 5
  </option>

  <option value="voice6">
    🎙️ Voice 6
  </option>
</select>

      </div>


      {/* =====================================================
          CALL SPEED
          ===================================================== */}

      <div
        className="call-interval-control"
        style={{
          width: "100%",
        }}
      >

        <div
          className="call-interval-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >

          <span
            style={{
              color: "#fff",
              fontWeight: "bold",
              fontSize: "15px",
            }}
          >
            CALL SPEED
          </span>


          <div
            className="call-interval-adjust"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >

            {/* MINUS */}

            <button
              type="button"
              className="interval-minus"
              onClick={() => {

                const current =
                  Number(callInterval);

                const safeCurrent =
                  Number.isFinite(current)
                    ? current
                    : 5;

                const newValue =
                  Math.max(
                    0,
                    safeCurrent - 1
                  );

                setCallInterval(newValue);

                console.log(
                  "➖ CALL SPEED:",
                  newValue,
                  "SECONDS"
                );

              }}
              style={{
                width: "30px",
                height: "30px",

                borderRadius: "6px",

                border:
                  "1px solid #00f0ff",

                background:
                  "rgba(0,240,255,0.12)",

                color: "#00f0ff",

                fontSize: "20px",

                fontWeight: "bold",

                cursor: "pointer",

                padding: 0,
              }}
            >
              −
            </button>


            {/* VALUE */}

            <strong
              className="interval-value"
              style={{
                minWidth: "45px",
                textAlign: "center",
                color: "#fff",
                fontSize: "17px",
              }}
            >
              {Number(callInterval)}s
            </strong>


            {/* PLUS */}

            <button
              type="button"
              className="interval-plus"
              onClick={() => {

                const current =
                  Number(callInterval);

                const safeCurrent =
                  Number.isFinite(current)
                    ? current
                    : 5;

                const newValue =
                  Math.min(
                    15,
                    safeCurrent + 1
                  );

                setCallInterval(newValue);

                console.log(
                  "➕ CALL SPEED:",
                  newValue,
                  "SECONDS"
                );

              }}
              style={{
                width: "30px",
                height: "30px",

                borderRadius: "6px",

                border:
                  "1px solid #00f0ff",

                background:
                  "rgba(0,240,255,0.12)",

                color: "#00f0ff",

                fontSize: "20px",

                fontWeight: "bold",

                cursor: "pointer",

                padding: 0,
              }}
            >
              +
            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          VOLUME
          ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
        }}
      >

        <span
          style={{
            color: "#fff",
            fontWeight: "bold",
            fontSize: "15px",
            whiteSpace: "nowrap",
          }}
        >
          🔊 Volume
        </span>


        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(volume * 100)}
          onChange={(e) => {

            const newVolume =
              Number(e.target.value) / 100;

            setVolume(newVolume);

            volumeRef.current =
              newVolume;

            if (activeAudioRef.current) {

              activeAudioRef.current.volume =
                newVolume;

            }

          }}
          style={{
            flex: 1,
            minWidth: 0,
            cursor: "pointer",
          }}
        />


        <span
          style={{
            minWidth: "45px",
            textAlign: "right",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          {Math.round(volume * 100)}%
        </span>

      </div>


      {/* =====================================================
          VOICE SPEED
          ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          width: "100%",
        }}
      >

        <span
          style={{
            color: "#fff",
            fontWeight: "600",
            fontSize: "15px",
          }}
        >
          Voice Speed
        </span>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >

          <button
            type="button"
            onClick={decreaseVoiceSpeed}
            style={{
              width: "32px",
              height: "32px",

              padding: 0,

              fontSize: "18px",
              fontWeight: "bold",

              cursor: "pointer",

              borderRadius: "6px",

              border:
                "1px solid #00f0ff",

              background:
                "rgba(0,240,255,0.12)",

              color: "#00f0ff",
            }}
          >
            −
          </button>


          <span
            style={{
              minWidth: "50px",
              textAlign: "center",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            {voiceSpeed.toFixed(1)}×
          </span>


          <button
            type="button"
            onClick={increaseVoiceSpeed}
            style={{
              width: "32px",
              height: "32px",

              padding: 0,

              fontSize: "18px",
              fontWeight: "bold",

              cursor: "pointer",

              borderRadius: "6px",

              border:
                "1px solid #00f0ff",

              background:
                "rgba(0,240,255,0.12)",

              color: "#00f0ff",
            }}
          >
            +
          </button>

        </div>

      </div>


      {/* =====================================================
          VOICE DEPTH
          ===================================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          width: "100%",
        }}
      >

        <span
          style={{
            fontSize: "13px",
            fontWeight: "bold",
            color: "#00f0ff",
          }}
        >
          🎙️ VOICE DEPTH
        </span>


        <input
          type="range"
          min="-2"
          max="5"
          step="1"
          value={voiceDepth}
          onChange={(e) => {

            const value =
              Number(e.target.value);

            setVoiceDepth(value);

            voiceDepthRef.current =
              value;

            const cashierId =
              localStorage.getItem(
                "logged_in_cashier"
              );

            if (cashierId) {

              localStorage.setItem(
                `cashier_voice_depth_${cashierId}`,
                String(value)
              );

            }

            console.log(
              "🎙️ NEW VOICE DEPTH:",
              value
            );

          }}
          style={{
            width: "100%",
            height: "6px",
            cursor: "pointer",
          }}
        />


        <span
          style={{
            fontSize: "12px",
            color: "#ffd700",
            fontWeight: "bold",
          }}
        >
          {voiceDepth > 0
            ? `Deep +${voiceDepth}`
            : voiceDepth < 0
            ? `High ${voiceDepth}`
            : "Normal"}
        </span>

      </div>

    </div>
  )}

</div>

    </div>
  </div>
);   } 