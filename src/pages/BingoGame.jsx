import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { API_URL } from "../config";
import "./BingoGame.css";
import { io } from "socket.io-client";
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

  const [game, setGame] = useState({
    prize: "00 Birr",
    id: id || "101",
    soldCartelas: passedGame?.soldCartelas || [],
   voiceMode: "recorded-oromo",
speechLang: "om-ET",
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


  const [cageBalls, setCageBalls] = useState(INITIAL_BALLS);
 

  const hasAnnouncedLetsGo = useRef(false);
  const animationRef = useRef(null);
  const shuffleAudioRef = useRef(null);
  const isDrawingBallRef = useRef(false);
  const loopTimeoutRef = useRef(null);
const audioGenerationInProgressRef = useRef(false);
const audioLoadingRef = useRef(false);
  const remainingNumbersRef = useRef(Array.from({ length: 75 }, (_, i) => i + 1));
 
  const activeAudioRef = useRef(null);
  const pausedAudioRef = useRef(null);
  const audioTimeoutRef = useRef(null);
  const audioGenerationRef = useRef(0);
  const calledRef = useRef(called);
  const stateRef = useRef({ called, paused, speed, current, game });
  const [volume, setVolume] = useState(0.7);
  const volumeRef = useRef(0.7);
 
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
               // ✅ KEEP SOLD CARTELAS
  soldCartelas:
  data.soldCartelas ??
  data.sold_cartelas ??
  prev.soldCartelas ??
  passedGame?.soldCartelas ??
  [],
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
    // SAFETY
    // ==========================================================

    if (!audio) {
      console.warn("⚠️ NO AUDIO ELEMENT FOR VOICE DEPTH");
      return null;
    }

    // ==========================================================
    // CREATE ONE AUDIO CONTEXT
    // ==========================================================

    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) {
        console.warn(
          "⚠️ WEB AUDIO NOT SUPPORTED — PLAYING OROMO AUDIO NORMALLY"
        );

        return null;
      }

      audioContextRef.current =
        new AudioContextClass();
    }

    const ctx =
      audioContextRef.current;

    // ==========================================================
    // RESUME CONTEXT
    // ==========================================================

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // ==========================================================
    // SPEED
    // ==========================================================

    audio.preservesPitch = true;

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

    // ==========================================================
    // DEPTH
    // ==========================================================

    const rawDepth =
      Number(voiceDepthRef.current) || 0;

    const depth =
      Math.max(
        -20,
        Math.min(
          20,
          rawDepth
        )
      );

    // ==========================================================
    // IMPORTANT
    //
    // NEVER reuse an old MediaElementSource.
    //
    // Each Audio element gets its own source.
    // ==========================================================

    if (audio._voiceNodes) {
      console.log(
        "⚠️ AUDIO ALREADY HAS VOICE NODES"
      );

      return audio._voiceNodes;
    }

    // ==========================================================
    // MEDIA SOURCE
    // ==========================================================

    let source;

    try {
      source =
        ctx.createMediaElementSource(audio);
    } catch (error) {

      console.warn(
        "⚠️ MEDIA SOURCE CREATION FAILED — USING NORMAL OROMO AUDIO:",
        error
      );

      // VERY IMPORTANT:
      // Do not stop the Bingo game because the
      // voice-depth engine failed.

      return null;
    }

    // ==========================================================
    // BASS
    // ==========================================================

    const bassFilter =
      ctx.createBiquadFilter();

    bassFilter.type =
      "lowshelf";

    bassFilter.frequency.value =
      120;

    bassFilter.gain.value =
      depth * 1.15;

    // ==========================================================
    // VOCAL BODY
    // ==========================================================

    const bodyFilter =
      ctx.createBiquadFilter();

    bodyFilter.type =
      "peaking";

    bodyFilter.frequency.value =
      180;

    bodyFilter.Q.value =
      0.9;

    bodyFilter.gain.value =
      depth * 0.75;

    // ==========================================================
    // LOW MID
    // ==========================================================

    const lowMidFilter =
      ctx.createBiquadFilter();

    lowMidFilter.type =
      "peaking";

    lowMidFilter.frequency.value =
      280;

    lowMidFilter.Q.value =
      0.8;

    lowMidFilter.gain.value =
      depth * 0.45;

    // ==========================================================
    // WARMTH
    // ==========================================================

    const warmthFilter =
      ctx.createBiquadFilter();

    warmthFilter.type =
      "lowpass";

    warmthFilter.frequency.value =
      depth > 0
        ? 7000
        : 12000;

    // ==========================================================
    // COMPRESSOR
    // ==========================================================

    const compressor =
      ctx.createDynamicsCompressor();

    compressor.threshold.value =
      -20;

    compressor.knee.value =
      10;

    compressor.ratio.value =
      depth > 0
        ? 4.5
        : 3;

    compressor.attack.value =
      0.003;

    compressor.release.value =
      0.22;

    // ==========================================================
    // OUTPUT
    // ==========================================================

    const outputGain =
      ctx.createGain();

    outputGain.gain.value =
      depth > 0
        ? 1.0
        : 0.95;

    // ==========================================================
    // CONNECT
    // ==========================================================

    source.connect(bassFilter);

    bassFilter.connect(bodyFilter);

    bodyFilter.connect(lowMidFilter);

    lowMidFilter.connect(warmthFilter);

    warmthFilter.connect(compressor);

    compressor.connect(outputGain);

    outputGain.connect(ctx.destination);

    // ==========================================================
    // SAVE NODES ON AUDIO
    // ==========================================================

    const nodes = {
      source,
      bassFilter,
      bodyFilter,
      lowMidFilter,
      warmthFilter,
      compressor,
      outputGain
    };

    audio._voiceNodes =
      nodes;

    // ==========================================================
    // SAVE REFS
    // ==========================================================

    audioSourceRef.current =
      source;

    bassFilterRef.current =
      bassFilter;

    // ==========================================================
    // DEBUG
    // ==========================================================

    console.log(
      "🎙️ AFFAN OROMO VOICE ENGINE"
    );

    console.log(
      "🎚️ DEPTH:",
      depth
    );

    console.log(
      "⚡ SPEED:",
      audio.playbackRate
    );

    console.log(
      "🔊 VOLUME:",
      audio.volume
    );

    console.log(
      "🎙️ BASS:",
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

    return nodes;

  } catch (error) {

    console.error(
      "❌ VOICE DEPTH ENGINE ERROR — OROMO AUDIO WILL CONTINUE:",
      error
    );

    // ==========================================================
    // IMPORTANT
    //
    // Voice depth is OPTIONAL.
    // The recorded Affan Oromo voice must NEVER depend
    // on the Web Audio effects engine to work.
    // ==========================================================

    return null;
  }
}
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
function playCompleteRecording(
  path,
  onFinished = () => {}
) {
  return new Promise((resolve, reject) => {
    // ====================================================
    // VALUES FOR THIS AUDIO CALL
    // ====================================================
    const completeName =
      typeof path === "string"
        ? path.split("/").pop()
        : "unknown-audio";

    const generationId = audioGenerationRef.current;

    // ====================================================
    // CHECK BEFORE CREATING AUDIO
    // ====================================================
    if (stateRef.current.paused) {
      console.log("⏸️ GAME PAUSED BEFORE AUDIO CREATION:", completeName);
      resolve({ paused: true, completed: false });
      return;
    }

    // ====================================================
    // CHECK GENERATION
    // ====================================================
    if (generationId !== audioGenerationRef.current) {
      console.log(
        "🛑 GENERATION NO LONGER CURRENT:",
        generationId,
        "CURRENT:",
        audioGenerationRef.current
      );
      resolve({ cancelled: true, completed: false });
      return;
    }

    // ====================================================
    // CREATE AUDIO
    // ====================================================
    const audio = new Audio(path);
    audio.preload = "auto";

    // ====================================================
    // VOLUME
    // ====================================================
    const selectedVolume = Number(volumeRef.current);
    audio.volume = Math.max(
      0,
      Math.min(1, Number.isFinite(selectedVolume) ? selectedVolume : 1)
    );

    // ====================================================
    // SPEED
    // ====================================================
    const selectedSpeed = Number(voiceSpeedRef.current);
    audio.playbackRate = Math.max(
      0.5,
      Math.min(2.0, Number.isFinite(selectedSpeed) ? selectedSpeed : 1)
    );
    audio.defaultPlaybackRate = audio.playbackRate;

    // ====================================================
    // VOICE DEPTH
    // ====================================================
    let audioNodes = null;
    try {
      audioNodes = applyVoiceDepth(audio);
    } catch (error) {
      console.warn("⚠️ VOICE DEPTH FAILED — USING RAW AUDIO:", error);
      audioNodes = null;
    }

    // ====================================================
    // ACTIVE AUDIO
    // ====================================================
    activeAudioRef.current = audio;
    let finished = false;

    // ====================================================
    // TIME DEBUG
    // ====================================================
    const handleTimeUpdate = () => {
      if (activeAudioRef.current === audio) {
        /* console.log("🎵 AUDIO TIME:", audio.currentTime); */
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);

    // ====================================================
    // CLEANUP
    // ====================================================
    const cleanup = () => {
      if (finished) return;
      finished = true;

      try {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
      } catch (error) {}

      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }

      // Disconnect Web Audio nodes to prevent memory leaks
      try {
        if (audio._voiceNodes) {
          Object.values(audio._voiceNodes).forEach((node) => {
            try {
              if (node && typeof node.disconnect === "function") {
                node.disconnect();
              }
            } catch (e) {}
          });
          audio._voiceNodes = null;
        }
      } catch (error) {
        console.warn("⚠️ AUDIO NODE CLEANUP:", error);
      }

      if (
        audioNodes?.source &&
        audioSourceRef.current === audioNodes.source
      ) {
        audioSourceRef.current = null;
      }

      if (
        audioNodes?.bassFilter &&
        bassFilterRef.current === audioNodes.bassFilter
      ) {
        bassFilterRef.current = null;
      }

      audio.onended = null;
      audio.onerror = null;
      audio.onpause = null;

      try {
        audio.pause();
      } catch (error) {}

      console.log("🧹 AUDIO CLEANED:", completeName);
    };

    // ====================================================
    // AUDIO ENDED
    // ====================================================
    audio.onended = () => {
      if (finished) return;

      console.log("✅ VOICE FINISHED:", completeName);
      cleanup();

      try {
        onFinished();
      } catch (error) {
        console.error("❌ BINGO COMPLETION CALLBACK ERROR:", error);
      }

      resolve({ completed: true });
    };

    // ====================================================
    // AUDIO ERROR
    // ====================================================
    audio.onerror = (error) => {
      if (stateRef.current.paused) {
        console.log("⏸️ AUDIO ERROR WHILE PAUSED:", completeName);
        cleanup();
        resolve({ paused: true, completed: false });
        return;
      }

      if (generationId !== audioGenerationRef.current) {
        console.log(
          "🛑 OLD AUDIO GENERATION ERROR — IGNORING:",
          generationId,
          "CURRENT:",
          audioGenerationRef.current
        );
        cleanup();
        resolve({ cancelled: true, completed: false });
        return;
      }

      console.error("❌ VOICE AUDIO ERROR:", path, error);
      cleanup();
      reject(new Error(`Could not play ${path}`));
    };

    // ====================================================
    // PLAY
    // ====================================================
    let playPromise;
    try {
      playPromise = audio.play();
    } catch (error) {
      console.error("❌ AUDIO.PLAY() ERROR:", error);
      cleanup();
      reject(error);
      return;
    }

    // ====================================================
    // PLAY PROMISE
    // ====================================================
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          console.log("▶️ PLAYING:", path);

          if (stateRef.current.paused) {
            console.log("⏸️ AUDIO STARTED BUT GAME IS PAUSED");
            cleanup();
            resolve({ paused: true, completed: false });
          }
        })
        .catch((error) => {
          if (error?.name === "AbortError" && stateRef.current.paused) {
            console.log("⏸️ PLAY INTERRUPTED BECAUSE GAME WAS PAUSED");
            cleanup();
            resolve({ paused: true, completed: false });
            return;
          }

          if (generationId !== audioGenerationRef.current) {
            console.log(
              "🛑 PLAY FAILED FOR OLD GENERATION:",
              generationId,
              "CURRENT:",
              audioGenerationRef.current
            );
            cleanup();
            resolve({ cancelled: true, completed: false });
            return;
          }

          console.error("❌ AUDIO PLAY ERROR:", error);
          cleanup();
          reject(error);
        });
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

    const audioPath = `/${folder}/${fileName}.mp3`;

    console.log("🎵 VERIFICATION AUDIO:", audioPath);

    // Stop ONLY currently playing audio
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (error) {
        console.warn("⚠️ Could not stop previous audio:", error);
      }

      activeAudioRef.current = null;
    }

    const audio = new Audio(audioPath);

    audio.volume =
      Math.max(
        1,
        Math.min(
          3,
          Number(volumeRef.current) || 1* 1.2
        )
      );

    audio.playbackRate =
      Math.max(
        1,
        Math.min(
          2,
          Number(voiceSpeedRef.current) || 1* 1.15
        )
      );

    activeAudioRef.current = audio;

    audio.onended = () => {

      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }

      console.log(
        "✅ VERIFICATION AUDIO FINISHED:",
        audioPath
      );

      onComplete();
    };

    audio.onerror = (error) => {

      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }

      console.error(
        "❌ VERIFICATION AUDIO ERROR:",
        audioPath,
        error
      );

      onComplete();
    };

    audio.play()
      .then(() => {
        console.log(
          "▶️ VERIFICATION AUDIO PLAYING:",
          audioPath
        );
      })
      .catch((error) => {

        console.error(
          "❌ VERIFICATION AUDIO PLAY ERROR:",
          audioPath,
          error
        );

        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
        }

        onComplete();
      });
  }


 
function playShuffleSound(onComplete = () => {}) {
  const audioPath = "/oromo/shuffle.mp3";

  console.log("🎵 OROMO SHUFFLE:", audioPath);

  // Stop previous shuffle only
  if (shuffleAudioRef.current) {
    try {
      shuffleAudioRef.current.pause();
      shuffleAudioRef.current.currentTime = 0;
    } catch (error) {
      console.warn("⚠️ OLD SHUFFLE STOP ERROR:", error);
    }

    shuffleAudioRef.current = null;
  }

  const audio = new Audio(audioPath);

  // ==========================================================
  // 🎵 DEBUG AUDIO POSITION
  // ==========================================================

  audio.addEventListener("timeupdate", () => {
    if (shuffleAudioRef.current === audio) {
      console.log(
        "🎵 SHUFFLE AUDIO TIME:",
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

  // ==========================================================
  // IMPORTANT:
  // SHUFFLE HAS ITS OWN AUDIO REF.
  // DO NOT TOUCH activeAudioRef HERE.
  // ==========================================================

  shuffleAudioRef.current = audio;

  // ==========================================================
  // AUDIO FINISHED
  // ==========================================================

  audio.onended = () => {

    if (shuffleAudioRef.current === audio) {
      shuffleAudioRef.current = null;
    }

    console.log("✅ OROMO SHUFFLE FINISHED");

    onComplete();
  };

  // ==========================================================
  // AUDIO ERROR
  // ==========================================================

  audio.onerror = () => {

    if (shuffleAudioRef.current === audio) {
      shuffleAudioRef.current = null;
    }

    console.error(
      "❌ OROMO SHUFFLE ERROR:",
      audioPath
    );

    onComplete();
  };

  // ==========================================================
  // PLAY
  // ==========================================================

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

      if (shuffleAudioRef.current === audio) {
        shuffleAudioRef.current = null;
      }

      onComplete();
    });
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
  if (stateRef.current.paused) {
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

    const audio = activeAudioRef.current;
    if (audio && !audio.ended) {
      const currentTime = Number(audio.currentTime) || 0;
      console.log("⏸️ PAUSING OROMO AUDIO:", audio.src);
      
      const currentBallStr = stateRef.current.current || "";
      const parts = currentBallStr.trim().split(/\s+/);

      // FIX: Cleanly extract the string token and numeric element out of the split array
      const extractedLetter = parts[0] ? String(parts[0]).trim() : "";
      const extractedNumber = parts[1] ? Number(parts[1]) : 0;

      pausedAudioRef.current = {
        audio,
        letter: extractedLetter,
        number: extractedNumber,
        time: currentTime,
      };

      try {
        audio.pause();
      } catch (error) {}
      return;
    }

    if (pendingBingoCallRef.current) {
      console.log("⏸️ CURRENT NUMBER WAITING:", pendingBingoCallRef.current);
      audioGenerationRef.current++; // Void active background file tasks instantly
      isDrawingBallRef.current = false;
      return;
    }

    if (isDrawingBallRef.current) {
      console.log("⏸️ GENERATION IN PROGRESS — CANCELLING");
      generationCancelRef.current++;
      audioGenerationRef.current++;
      isDrawingBallRef.current = false;
      return;
    }
    return;
  }

  // ==========================================================
  // ▶️ PLAY / RESUME ENGINE
  // ==========================================================
  console.log("▶️ PLAY");

  stateRef.current.paused = false;
  setPaused(false);

  const pausedData = pausedAudioRef.current;
  if (pausedData && pausedData.audio) {
    const resumeLetter = pausedData.letter;
    const resumeNumber = pausedData.number;
    
    // Clear instantly so double clicks cannot read this stale data again
    pausedAudioRef.current = null; 
    pendingBingoCallRef.current = null;

    if (actionId !== playPauseActionRef.current) return;

    if (!resumeLetter || !resumeNumber) {
      console.warn("⚠️ Refusing to resume: corrupted track parameters. Advancing loop...");
      isDrawingBallRef.current = false;
      generateNumber();
      return;
    }

    console.log(`🚀 RELAUNCHING TRACKED ENGINE FOR BALL: ${resumeLetter} ${resumeNumber}`);
    isDrawingBallRef.current = true;
    
    playRecordedBingoCall(resumeLetter, resumeNumber, () => {
      isDrawingBallRef.current = false;
      if (stateRef.current.paused) return;
      generateNumber();
    });
    return;
  }

  if (isDrawingBallRef.current) {
    console.log("⏳ CALL GENERATION STILL IN PROGRESS");
    return;
  }

  if (pendingBingoCallRef.current) {
    const pending = pendingBingoCallRef.current;
    pendingBingoCallRef.current = null; 

    console.log("▶️ RESUMING PENDING OROMO CALL:", pending);
    isDrawingBallRef.current = true;
    
    playRecordedBingoCall(pending.letter, pending.number, () => {
      isDrawingBallRef.current = false;
      if (stateRef.current.paused) return;
      generateNumber();
    });
    return;
  }

  if (!hasPlayedShuffleRef.current) {
    hasPlayedShuffleRef.current = true;
    sessionStorage.setItem("bingo_shuffle_played", "true");

    console.log("🎵 PLAYING OROMO SHUFFLE — FIRST GAME START");
    playShuffleSound(() => {
      if (stateRef.current.paused || isDrawingBallRef.current) return;
      generateNumber();
    });
    return;
  }

  console.log("🚀 STARTING NEW OROMO NUMBER");
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

async function generateNumber() {
  const generationStart = Date.now();
  const myGenerationId = generationCancelRef.current;
  
  // Resolve game ID reliably from active state tree
  const currentGameId = stateRef.current.game?.game_id || stateRef.current.game?.id || id;

  console.log("🔥 GENERATE ENTERED", generationStart, "LOCK:", isDrawingBallRef.current, "CANCEL ID:", myGenerationId, "GAME:", currentGameId);

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

  // Atomically claim the drawing loop lock
  isDrawingBallRef.current = true;

  const generationStillValid = () => {
    return myGenerationId === generationCancelRef.current && !stateRef.current.paused;
  };

  try {
    const currentRemaining = remainingNumbersRef.current;

    if (!currentRemaining || currentRemaining.length === 0) {
      console.log("🛑 NO REMAINING NUMBERS");
      isDrawingBallRef.current = false;
      return;
    }

    // Pick a random number safely
    const randomIndex = Math.floor(Math.random() * currentRemaining.length);
    const number = currentRemaining[randomIndex];

    if (!generationStillValid()) {
      isDrawingBallRef.current = false;
      return;
    }

    // Update remaining pool directly
    remainingNumbersRef.current = currentRemaining.filter(n => n !== number);

    // Determine target column letter
    let letter = "B";
    if (number >= 16) letter = "I";
    if (number >= 31) letter = "N";
    if (number >= 46) letter = "G";
    if (number >= 61) letter = "O";

    const result = `${letter} ${number}`;
    seenBallsRef.current.add(result);

    pendingBingoCallRef.current = { letter, number, result };

    if (!generationStillValid()) {
      isDrawingBallRef.current = false;
      return;
    }

    // Synchronize both State arrays and Mutable Refs simultaneously 
    const updatedCalled = [...calledRef.current, result];
    calledRef.current = updatedCalled;
    setCalled(updatedCalled);
    setCurrent(result);

    // Update operational state context container instantly
    stateRef.current.called = updatedCalled;
    stateRef.current.current = result;

    // Dispatch background network logging with explicit recovery fallbacks
    fetch(`${API_URL}/games/${currentGameId}/call-number`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ball: result })
    })
    .then(async response => {
      if (!response.ok) throw new Error(`Server returned status ${response.status}`);
      console.log("✅ NUMBER SAVED IN BACKGROUND:", result);
    })
    .catch(err => {
      console.error("❌ BACKGROUND NUMBER SAVE FAILED:", result, err);
      
      // Force an immediate atomic global engine halt
      stateRef.current.paused = true;
      setPaused(true);

      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
      
      isDrawingBallRef.current = false;
      alert("Connection lost with backend server. Game has been safely paused.");
    });

    if (!generationStillValid()) {
      isDrawingBallRef.current = false;
      return;
    }

    // Trigger sequential playback routing engine
    playRecordedBingoCall(letter, number, () => {
      console.log("✅ CURRENT CALL FINISHED:", result);

      // Clean up previous operational states cleanly 
      isDrawingBallRef.current = false;
      if (pendingBingoCallRef.current?.letter === letter && pendingBingoCallRef.current?.number === number) {
        pendingBingoCallRef.current = null;
      }

      if (stateRef.current.paused) {
        console.log("⏸️ CALL FINISHED WHILE PAUSED — WAITING FOR PLAY");
        return;
      }

      const selectedSeconds = Number(callIntervalRef.current);
      const safeSeconds = Number.isFinite(selectedSeconds) ? selectedSeconds : 5;

      if (loopTimeoutRef.current !== null) {
        return; // Next loop block has already been successfully mounted
      }

      // Fast-speed handling mechanics (< 0 interval option support)
      if (safeSeconds < 0) {
        const overlapSeconds = Math.abs(safeSeconds);
        const fastDelayMs = Math.max(0, 1000 - (overlapSeconds * 1000));

        loopTimeoutRef.current = setTimeout(() => {
          loopTimeoutRef.current = null;
          if (stateRef.current.paused || myGenerationId !== generationCancelRef.current) {
            isDrawingBallRef.current = false;
            return;
          }
          generateNumber();
        }, fastDelayMs);

        return;
      }

      // Normal auto-advancement structural timer pathing
      const delayMs = safeSeconds * 1000;
      loopTimeoutRef.current = setTimeout(() => {
        loopTimeoutRef.current = null;
        if (stateRef.current.paused || myGenerationId !== generationCancelRef.current) {
          isDrawingBallRef.current = false;
          return;
        }
        generateNumber();
      }, delayMs);
    });

  } catch (err) {
    console.error("❌ GENERATE NUMBER CRITICAL EXCEPTION:", err);
    // Safety valve: release engine lock so system can be recovered manually
    isDrawingBallRef.current = false;
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
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff5aa5', letterSpacing: '1px', marginBottom: '2px' }}>
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

  {/* =====================================================
      ARROW BUTTON
      ===================================================== */}

  <button
    type="button"
    onClick={() =>
      setShowSoldCartelas((prev) => !prev)
    }
    title={
      showSoldCartelas
        ? "Hide sold Cartelas"
        : "Show sold Cartelas"
    }
    style={{
      width: "42px",
      height: "42px",
      minWidth: "42px",
      minHeight: "42px",

      borderRadius: "50%",
      border: "2px solid rgba(0, 240, 255, 0.8)",

      background: "rgba(0, 0, 0, 0.65)",

      color: "#00f0ff",

      cursor: "pointer",

      display: "flex",
      alignItems: "center",
      justifyContent: "center",

      fontSize: "28px",
      fontWeight: "bold",

      padding: 0,
      margin: 0,

      lineHeight: 1,

      position: "relative",

      zIndex: 1000001,

      boxShadow:
        "0 2px 12px rgba(0, 0, 0, 0.6)"
    }}
  >
    {showSoldCartelas ? "◀" : "▶"}
  </button>
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

        fontSize: "22px",

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

          gap: "10px",

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

              borderRadius: "9px",

              color: "#ffffff",

              fontSize: "24px",

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
        {/* --- 3. CALLED BALL HISTORY (TOUCHES DASHBOARD IMMEDIATELY) --- */}
        <div
          className="called-section"
          style={{
            width: "100%",
            margin: "0",
            padding: "0px",
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
        <span
  style={{
    fontSize: "45px",
    fontWeight: "bold",
  }}
>
  ({called.length}/75)
</span>
          </div>  
  
          <div  
            style={{  
              display: "flex",  
              justifyContent: "center",  
              gap: "15px",  
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
                  fontSize: "20px",
                  color: "#4b5970",
                  fontStyle: "italic",
                }}
              >
                {t.waitingToBegin}
              </div>
            )}    <button
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
          </div>
        </div>

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
          value="recorded-oromo"
          onChange={() => {
            setGame((prev) => ({
              ...prev,
              voiceMode: "recorded-oromo",
              speechLang: "oromo",
            }));
          }}
          style={{
            background: "#0c162d",
            border: "1px solid #00c8ff",
            color: "#fff",
            borderRadius: "6px",
            padding: "6px 8px",
            fontSize: "13px",
            fontWeight: "bold",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="recorded-oromo">
            🟢 Voice
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
          min="-20"
          max="40"
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