import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { API_URL } from "../config";
import "./BingoGame.css";
import { io } from "socket.io-client";
  // Add this if not already imported
// --- Phonetic & Legend Data ---
const amharicPhoneticNumbers = {
  1: "Ond", 2: "Hoo-let", 3: "Sost", 4: "Ah-raht", 5: "Ah-mist",
  6: "Sid-ist", 7: "Suh-baht", 8: "Sim-int", 9: "Zeh-tegn", 10: "Ah-sir",
  11: "Ah-sir-ah Ond", 12: "Ah-sir-ah Hoo-let", 13: "Ah-sir-ah Sost", 14: "Ah-sir-ah Ah-raht", 15: "Ah-sir-ah Ah-mist",
  16: "Ah-sir-ah Sid-ist", 17: "Ah-sir-ah Suh-baht", 18: "Ah-sir-ah Sim-int", 19: "Ah-sir-ah Zeh-tegn", 20: "Hah-yah",
  21: "Hah-yah Ond", 22: "Hah-yah Hoo-let", 23: "Hah-yah Sost", 24: "Hah-yah Ah-raht", 25: "Hah-yah Ah-mist",
  26: "Hah-yah Sid-ist", 27: "Hah-yah Suh-baht", 28: "Hah-yah Sim-int", 29: "Hah-yah Zeh-tegn", 30: "Slah-sah", 
  31: "Slah-sah Ond", 32: "Slah-sah Hoo-let", 33: "Slah-sah Sost", 34: "Slah-sah Ah-raht", 35: "Slah-sah Ah-mist",
  36: "Slah-sah Sid-ist", 37: "Slah-sah Suh-baht", 38: "Slah-sah Sim-int", 39: "Slah-sah Zeh-tegn", 40: "Are-bah", 
  41: "Are-bah Ond", 42: "Are-bah Hoo-let", 43: "Are-bah Sost", 44: "Are-bah Ah-raht", 45: "Are-bah Ah-mist",
  46: "Are-bah Sid-ist", 47: "Are-bah Suh-baht", 48: "Are-bah Sim-int", 49: "Are-bah Zeh-tegn", 50: "Hahm-sah",
  51: "Hahm-sah Ond", 52: "Hahm-sah Hoo-let", 53: "Hahm-sah Sost", 54: "Hahm-sah Ah-raht", 55: "Hahm-sah Ah-mist",
  56: "Hahm-sah Sid-ist", 57: "Hahm-sah Suh-baht", 58: "Hahm-sah Sim-int", 59: "Hahm-sah Zeh-tegn", 60: "Seel-sah",
  61: "Seel-sah Ond", 62: "Seel-sah Hoo-let", 63: "Seel-sah Sost", 64: "Seel-sah Ah-raht", 65: "Seel-sah Ah-mist",
  66: "Seel-sah Sid-ist", 67: "Seel-sah Suh-baht", 68: "Seel-sah Sim-int", 69: "Seel-sah Zeh-tegn", 70: "SEE-bah", 
  71: "Suh-bah Ond", 72: "Suh-bah Hoo-let", 73: "Suh-bah Sost", 74: "Suh-bah Ah-raht", 75: "suh-bah Ah-mist"
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
const spokenLetter = { B: "Bee", I: "Eye", N: "En", G: "Gee", O: "Oh" };

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
    prize: "1500 Birr", 
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

  const remainingNumbersRef = useRef(Array.from({ length: 75 }, (_, i) => i + 1));
  const activeUtteranceRef = useRef(null);
  const activeAudioRef = useRef(null);
  const pausedAudioRef = useRef(null);
  const audioTimeoutRef = useRef(null);
  
  const calledRef = useRef(called);
  const stateRef = useRef({ called, paused, speed, current, game });
  const [volume, setVolume] = useState(0.7);
  const volumeRef = useRef(0.7);
  const location = useLocation();
  const passedGame = location.state?.game;
const [voiceSpeed, setVoiceSpeed] = useState(1.0);
const voiceSpeedRef = useRef(1.0);
const TARGET_GENERATION_INTERVAL_MS = 400;
const nextGenerationTimeRef = useRef(null);
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


function playRecordedAudio(fileName, onComplete = () => {}) {
  const currentGame = stateRef.current.game || game;

  console.log("🎤 CURRENT VOICE MODE:", currentGame.voiceMode);
  console.log("🌍 CURRENT SPEECH LANG:", currentGame.speechLang);
  console.log("⚡ CURRENT VOICE SPEED:", voiceSpeedRef.current);

  const isOromo = currentGame.voiceMode === "recorded-oromo";
  const folder = isOromo ? "oromo" : "amharic";

  const cleanName = String(fileName)
    .trim()
    .toLowerCase();

  const possiblePaths = [
    `/${folder}/${cleanName}.mp3`,
    `/${folder}/${cleanName}.wav`
  ];

  console.log("🔊 RECORDED VOICE:", folder);
  console.log("🎵 FILE:", cleanName);
  console.log("📁 TRYING:", possiblePaths);

  const tryPaths = async () => {
    for (const audioPath of possiblePaths) {
      try {
        await new Promise((resolve, reject) => {
          const audio = new Audio(audioPath);

          // 🔊 Volume
          audio.volume = volumeRef.current;

          // ⚡ Selected voice speed
          audio.playbackRate = voiceSpeedRef.current;

          // Keep voice pitch natural
          audio.preservesPitch = true;

          activeAudioRef.current = audio;

          audio.onended = () => {
            activeAudioRef.current = null;
            resolve();
          };

          audio.onerror = () => {
            activeAudioRef.current = null;
            reject();
          };

          audio.play().catch(() => {
            activeAudioRef.current = null;
            reject();
          });
        });

        console.log("✅ PLAYED:", audioPath);

        onComplete();
        return;

      } catch (error) {
        console.log("❌ Audio not found:", audioPath);
      }
    }

    console.error(
      `❌ Could not find recorded audio for ${folder}/${cleanName}`
    );

    onComplete();
  };

  tryPaths();
}
  function playShuffleSound(onComplete = () => {}) {
    playRecordedAudio("shuffle", () => {
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
  function speakBallSequence(letter, number, onSequenceFinished = () => {}) {
    if (stateRef.current.paused) return;

    const currentGame = stateRef.current.game || game;
    const activeVoiceMode = currentGame.voiceMode || currentGame.voice_mode;
    const activeSpeechLang = currentGame.speechLang || "en-US";

 if (activeVoiceMode === "recorded-oromo") {
  // Oromo recorded voice: letter + number
  playRecordedAudio(letter, () => {
    if (stateRef.current.paused) return;

    playRecordedAudio(String(number), onSequenceFinished);
  }, "oromo");

  return;
}

if (activeVoiceMode === "recorded") {
  // Bulchaa recorded voice: letter + number
  playRecordedAudio(letter, () => {
    if (stateRef.current.paused) return;

    playRecordedAudio(String(number), onSequenceFinished);
  });

  return;
}
    

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
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.resume();
    }

    if (paused) {
      // Prevent multiple timers from existing
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }

      setPaused(false);

      // ⭐ RESUME CURRENT NUMBER FIRST
      if (pausedAudioRef.current) {
        const audio = pausedAudioRef.current.audio;

        pausedAudioRef.current = null;
        activeAudioRef.current = audio;

        audio.play().catch((err) => {
          console.error("RESUME AUDIO ERROR:", err);
          activeAudioRef.current = null;
        });

        return;
      }

      // ⭐ NORMAL PLAY — only when there is no paused number
      if (!hasAnnouncedLetsGo.current) {
        hasAnnouncedLetsGo.current = true;

        const startShuffleSequence = () => {
          if (stateRef.current.paused) return;

          playShuffleSound(() => {
            if (stateRef.current.paused) return;

            generateNumber();
          });
        };

        announceLetsGo(startShuffleSequence);

      } else {

        playShuffleSound(() => {
          if (stateRef.current.paused) return;

          generateNumber();
        });

      }

    } else {

      // ⭐ PAUSE
      setPaused(true);
isDrawingBallRef.current = false; // ← ADD THIS
      // Pause current recorded audio instead of destroying it
      if (activeAudioRef.current) {
        const audio = activeAudioRef.current;

        pausedAudioRef.current = {
          audio: audio,
          fileName: audio.src
            .split("/")
            .pop()
            .split(".")[0]
            .toLowerCase()
        };

        audio.pause();
        activeAudioRef.current = null;
      }

      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
    }
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

async function generateNumber() {
  const generationStart = Date.now();

  console.log(
    "🔥 GENERATE ENTERED",
    generationStart,
    "LOCK:",
    isDrawingBallRef.current,
    "GAME:",
    stateRef.current.game?.game_id || stateRef.current.game?.id
  );

  // Never allow two generations at the same time
 if (isDrawingBallRef.current || stateRef.current.paused) {
  console.log(
    ">>> GENERATE BLOCKED",
    {
      locked: isDrawingBallRef.current,
      paused: stateRef.current.paused
    }
  );
  return;
}

if (loopTimeoutRef.current) {
  console.log(">>> GENERATE BLOCKED - LOOP ALREADY EXISTS");
  return;
}

  const currentGame = stateRef.current.game;
  const gameId = currentGame?.game_id || currentGame?.id;

  if (!gameId) {
    console.error("No game_id found:", currentGame);
    return;
  }

  const currentRemaining = remainingNumbersRef.current;

  if (!currentRemaining.length) {
    console.log(">>> NO NUMBERS REMAINING");
    setPaused(true);
    return;
  }

  // LOCK immediately
  isDrawingBallRef.current = true;

  try {
    // Pick random number
    const randomIndex = Math.floor(
      Math.random() * currentRemaining.length
    );

    const number = currentRemaining[randomIndex];

    remainingNumbersRef.current =
      currentRemaining.filter(n => n !== number);

    // Determine Bingo letter
    let letter = "B";

    if (number >= 16) letter = "I";
    if (number >= 31) letter = "N";
    if (number >= 46) letter = "G";
    if (number >= 61) letter = "O";

    const result = `${letter} ${number}`;
seenBallsRef.current.add(result);
    // Update frontend state
    const updatedCalled = [
      ...calledRef.current,
      result
    ];

    calledRef.current = updatedCalled;

    setCalled(updatedCalled);
    setCurrent(result);

    console.log(
      "🎯 CALLING NUMBER:",
      result,
      "FOR GAME:",
      gameId
    );

    // =========================================================
    // SAVE NUMBER TO BACKEND
    // =========================================================
    // =========================================================
// SAVE NUMBER TO BACKEND — BACKGROUND
// =========================================================

fetch(
  `${API_URL}/games/${gameId}/call-number`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ball: result
    })
  }
)
  .then(async (response) => {

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Call-number API failed: ${response.status} ${errorText}`
      );
    }

    console.log(
      "✅ NUMBER SAVED IN BACKGROUND:",
      result
    );

  })
  .catch((err) => {

    console.error(
      "❌ BACKGROUND NUMBER SAVE FAILED:",
      result,
      err
    );

  });

// =========================================================
// PLAY VOICE IMMEDIATELY
// =========================================================

speakBallSequence(letter, number, () => {
      if (stateRef.current.paused) {
        isDrawingBallRef.current = false;
        return;
      }

      // Never create a second timer
      if (loopTimeoutRef.current !== null) {
        console.log(">>> LOOP ALREADY SCHEDULED");
        return;
      }

      console.log(">>> SCHEDULING NEXT GENERATION");

      loopTimeoutRef.current = setTimeout(() => {

        console.log(">>> TIMEOUT FIRED");

        // Clear timer reference FIRST
        loopTimeoutRef.current = null;

        if (stateRef.current.paused) {
          isDrawingBallRef.current = false;
          return;
        }

        // Release lock immediately before starting next generation
        isDrawingBallRef.current = false;

        generateNumber();

      }, TARGET_GENERATION_INTERVAL_MS);

    }); // <-- closes speakBallSequence

  } catch (err) {

    console.error(
      "❌ GENERATE NUMBER FAILED:",
      err
    );

    isDrawingBallRef.current = false;

    // Do NOT schedule another call here.
  }
}
  const checkWinner = async () => {
    if (!cartelaId.trim()) {
      alert("Please enter a Cartela ID first.");
      return;
    }

    setWinnerMessage(`Checking ${cartelaId}...`);
    setCheckedCartela(null);
    setVerificationStatus("");

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
      <div className="bingo-container">

        {/* --- Bingo Board Grid --- */}
        <section className="board-section">
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

        {/* --- Main Dashboard Hub Container --- */}
        <div 
          className="main-display" 
          style={{ 
            margin: '0', 
            padding: '1px', 
            flex: 1, 
            minHeight: 0,
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
                <div style={{ fontSize: "9px", color: "#a0aec0", fontWeight: "bold", letterSpacing: "1px" }}>
                  {t.gamePrize}
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
                  {game.netIncome ? game.netIncome : game.prize}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Center Spherical Machine Cage Component */}
          <div className="cage-container">
            <div className="cage-sphere">
              <div className="glass-reflection-light"></div>
              <div className="glass-reflection-dark"></div>

              {cageBalls.map((ball) => (
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
                  {current.split(" ")[1]}
                </div>
              )}
            </div>
          </div>
          {/* 3. Right Wing: High-Visibility Current Called Display */}
          <div 
            className="ball-column" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderLeft: '1px solid rgba(255,255,255,0.05)',
              height: '100%'
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ff5aa5', letterSpacing: '1px', marginBottom: '2px' }}>
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

        {checkedCartela && (
          <div style={{
            margin: '1px auto', 
            padding: '6px', 
            background: '#090f1d', 
            border: verificationStatus === 'WINNER' ? '2px solid #00ff66' : '2px solid #ff3344', 
            borderRadius: '8px',
            width: '180px',
            textAlign: 'center',
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            <button onClick={closeVerificationBoard} style={{ position: 'absolute', top: '4px', right: '6px', background: 'transparent', border: 'none', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>✕</button>
            <h4 style={{ margin: '0 0 5px 0', color: verificationStatus === 'WINNER' ? '#00ff66' : '#ff3344', fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px' }}>
              {verificationStatus === 'WINNER' ? `🎉 ${t.winner}!` : "❌ NO BINGO YET"}
            </h4>

            {/* B I N G O Header Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', marginBottom: '3px' }}>
              {['B', 'I', 'N', 'G', 'O'].map((colLetter, lIdx) => (
                <div key={lIdx} style={{ fontSize: '8px', fontWeight: '900', color: '#00c8ff', textAlign: 'center' }}>
                  {colLetter}
                </div>
              ))}
            </div>

            {/* Number-only Grid Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px' }}>
              {checkedCartela.matrix.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  const isFree = cell === "FREE";

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
  called.some(item => {
    const calledNumber = Number(
      String(item).trim().split(/\s+/)[1]
    );

    return calledNumber === num;
  });
                  if (!isFree && typeof cell === "string") {
                    const parts = cell.trim().split(/\s+/);
                    num = parts[1] || cell;
                  }

                  return (
                    <div 
                      key={`${rIdx}-${cIdx}`} 
                      style={{
                        padding: "4px 1px",
                        background: isFree ? "#FFD700" : isCalled ? "#00C853" : "#1E293B",
                        color: isFree ? "#000" : "#FFF",
                        border: isCalled ? "2px solid #00FF00" : "1px solid #334155",
                        borderRadius: "3px",
                        textAlign: "center",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "22px"
                      }}
                    >
                      <span style={{ fontSize: isFree ? "6px" : "9.5px", fontWeight: "900", lineHeight: 1 }}>
                        {isFree ? "FREE" : num}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- Called History Block --- */}
        <div className="called-section" style={{ margin: 0, padding: '2px' }}>
          <div style={{ fontSize: '15px', marginBottom: '3px', color: '#8c9cb3', fontWeight: 'bold', letterSpacing: '0.5px', textAlign: 'center' }}>
             ({called.length}/75)
          </div>
          
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '6px', 
              alignItems: 'center',
              minHeight: '38px',
              background: 'rgba(0,0,0,0.25)',
              padding: '2px',
              borderRadius: '6px'
            }}
          >
            {incomingHistoryBalls.length > 0 ? (
              incomingHistoryBalls.map((ballStr, idx) => {
                const [letter, num] = ballStr.split(" ");
                const theme = columnColorStyles[letter] || { border: '2px solid #fff' };

                return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#0d162d',
                      border: theme.border,
                      boxShadow: `0 0 8px ${theme.border.split(' ')[2]}33`,
                      borderRadius: '4px',
                      width: '70px',
                      height: '50px',
                      position: 'relative',
                      opacity: 1 - (idx * 0.15)
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      background: theme.labelBg,
                      color: '#000',
                      fontSize: '20px',
                      fontWeight: '900',
                      textAlign: 'center',
                      borderTopLeftRadius: '2px',
                      borderTopRightRadius: '2px',
                      lineHeight: '8px'
                    }}>
                      {letter}
                    </div>
                    <div style={{
                      fontSize: '25px',
                      fontWeight: '900',
                      color: '#ffffff',
                      textShadow: theme.textShadow,
                      marginTop: '6px'
                    }}>
                      {num}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: '9px', color: '#4b5970', fontStyle: 'italic', padding: '4px' }}>
                {t.waitingToBegin}
              </div>
            )}
          </div>
        </div>

        {/* --- Bottom Footer Console Bar --- */}
        <footer className="game-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <button className="back-button" style={{ padding: "2px 6px", fontSize: "9px", minHeight: "auto", fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate("/cashier-dashboard/" + id)}>
            {t.dashboardBtn}
          </button>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <span>🔊 Volume</span>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(volume * 100)}
              onChange={(e) => {
                const newVolume = Number(e.target.value) / 100;

                // Update both state and ref
                setVolume(newVolume);
                volumeRef.current = newVolume;

                // Change currently playing recorded voice immediately
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
          <div style={{
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "10px"
}}>
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
           {/* Voice Mode Selector */}
<select
  value={
    game.voiceMode === "recorded-oromo"
      ? "recorded-oromo"
      : "recorded"
  }
  onChange={(e) => {
    const val = e.target.value;

    if (val === "recorded-oromo") {
      setGame(prev => ({
        ...prev,
        voiceMode: "recorded-oromo",
        speechLang: "oromo"
      }));
    } else {
      setGame(prev => ({
        ...prev,
        voiceMode: "recorded",
        speechLang: "en-US"
      }));
    }
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
  <option value="recorded">🎙️ Bulchaa Voice</option>
  <option value="recorded-oromo">🟢 Afaan Oromo Voice</option>
</select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#0c162d', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px', fontSize: '9px' }}>
              <span style={{ color: '#8c9cb3', fontWeight: 'bold' }}>⏱️ {speed}s</span>
              <button style={{ background: '#122042', border: '1px solid #00c8ff', color: '#fff', borderRadius: '2px', width: '12px', height: '12px', fontSize: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => speed > 1 && setSpeed(speed - 1)}>-</button>
              <button style={{ background: '#122042', border: '1px solid #00c8ff', color: '#fff', borderRadius: '2px', width: '12px', height: '12px', fontSize: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => speed + 1 <= 15 && setSpeed(speed + 1)}>+</button>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}