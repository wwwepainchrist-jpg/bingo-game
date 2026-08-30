import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function PlayerCartelaView() {
  const { id } = useParams();

  const [cartelaData, setCartelaData] = useState({});
  const [selectedCards, setSelectedCards] = useState(
    id ? [Number(id)] : []
  );

  const [confirmed, setConfirmed] = useState(
    id ? true : false
  );

  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 4;

  const [typedInput, setTypedInput] = useState("");
  const [markedCells, setMarkedCells] = useState({});
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // LOAD CARTELA JSON
  // ---------------------------------------------------------
  useEffect(() => {
    fetch("/cartela_patterns_1_to_200.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Cartela JSON not found");
        }
        return response.json();
      })
      .then(function (data) {
        console.log("================================");
        console.log("CARTELA JSON LOADED");
        console.log("TOTAL:", Object.keys(data).length);
        console.log("================================");

        setCartelaData(data);
        setLoading(false);
      })
      .catch(function (error) {
        console.error("ERROR LOADING CARTELA JSON:", error);
        setLoading(false);
      });
  }, []);

  // ---------------------------------------------------------
  // LOAD SAVED PLAYER CARTELAS
  // ---------------------------------------------------------
  useEffect(() => {
    if (!id) {
      return;
    }

    fetch(
      "https://bingo-backend-ccn6.onrender.com/api/player-cartelas/" + id
    )
      .then(function (response) {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .then(function (data) {
        if (!data) {
          return;
        }

        if (Array.isArray(data.selectedCards)) {
          const validCards = data.selectedCards
            .map(Number)
            .filter(function (number) {
              return number >= 1 && number <= 200;
            });

          if (validCards.length > 0) {
            setSelectedCards(validCards);
          }
        }
      })
      .catch(function (error) {
        console.log("Could not load saved Cartelas:", error);
      });
  }, [id]);

  // ---------------------------------------------------------
  // SAVE SELECTED CARTELAS
  // ---------------------------------------------------------
  function saveSelectedCards(cards) {
    fetch(
      "https://bingo-backend-ccn6.onrender.com/api/player-cartelas",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playerId: id || "default",
          selectedCards: cards
        })
      }
    ).catch(function (error) {
      console.error("Could not save Cartelas:", error);
    });
  }

  // ---------------------------------------------------------
  // SELECT CARTELA
  // ---------------------------------------------------------
  function toggleCartela(number) {
    let newCards;

    if (selectedCards.includes(number)) {
      newCards = selectedCards.filter(function (n) {
        return n !== number;
      });
    } else {
      newCards = selectedCards.concat(number);
    }

    newCards.sort(function (a, b) {
      return a - b;
    });

    setSelectedCards(newCards);
    saveSelectedCards(newCards);
  }

  // ---------------------------------------------------------
  // MANUAL CARTELA INPUT
  // ---------------------------------------------------------
  function handleManualAdd(event) {
    event.preventDefault();

    const input = typedInput.trim();

    if (!input) {
      return;
    }

    const numbers = input
      .split(/[\s,]+/)
      .map(function (value) {
        return Number(value);
      })
      .filter(function (number) {
        return (
          number >= 1 &&
          number <= 200 &&
          cartelaData[String(number)]
        );
      });

    if (numbers.length === 0) {
      alert("Enter valid Cartela numbers from 1 to 200.");
      return;
    }

    const newCards = Array.from(
      new Set(selectedCards.concat(numbers))
    );

    newCards.sort(function (a, b) {
      return a - b;
    });

    setSelectedCards(newCards);
    setTypedInput("");
    saveSelectedCards(newCards);
  }

  // ---------------------------------------------------------
  // MARK NUMBER
  // ---------------------------------------------------------
  function toggleCell(cartelaNumber, value) {
    if (value === "★" || value === "FREE") {
      return;
    }

    const key = String(cartelaNumber) + "-" + String(value);

    setMarkedCells(function (old) {
      return {
        ...old,
        [key]: !old[key]
      };
    });
  }

  // ---------------------------------------------------------
  // MAKE 5 x 5 CARTELA MATRIX (DIRECTLY FROM JSON)
  // ---------------------------------------------------------
  function getMatrix(number) {
    const cartela = cartelaData[String(number)];

    if (!cartela) {
      return [];
    }

    const matrix = [];

    for (let row = 0; row < 5; row++) {
      const currentRow = [
        cartela.B[row],
        cartela.I[row],
        cartela.N[row],
        cartela.G[row],
        cartela.O[row]
      ];
      matrix.push(currentRow);
    }

    return matrix;
  }

  // ---------------------------------------------------------
  // WINNER CHECK & PATTERN DETECTION LOGIC
  // ---------------------------------------------------------
  function checkWinner(cartelaNumber) {
    const matrix = getMatrix(cartelaNumber);
    if (matrix.length === 0) return { patternName: null, winningCoords: new Set() };

    function isMarked(row, col) {
      const val = matrix[row][col];
      if (val === "★" || val === "FREE") return true;
      const key = String(cartelaNumber) + "-" + String(val);
      return Boolean(markedCells[key]);
    }

    // 1. Full House
    let isFullHouse = true;
    const fullHouseCoords = new Set();
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!isMarked(r, c)) {
          isFullHouse = false;
        } else {
          fullHouseCoords.add(`${r}-${c}`);
        }
      }
    }
    if (isFullHouse) return { patternName: "FULL HOUSE", winningCoords: fullHouseCoords };

    // 2. Four Corners Near Star
    if (isMarked(1, 1) && isMarked(1, 3) && isMarked(3, 1) && isMarked(3, 3)) {
      const coords = new Set(["1-1", "1-3", "3-1", "3-3"]);
      return { patternName: "FOUR CORNERS NEAR STAR", winningCoords: coords };
    }

    // 3. Four Corners
    if (isMarked(0, 0) && isMarked(0, 4) && isMarked(4, 0) && isMarked(4, 4)) {
      const coords = new Set(["0-0", "0-4", "4-0", "4-4"]);
      return { patternName: "FOUR CORNERS", winningCoords: coords };
    }

    // 4. Horizontal Line
    for (let r = 0; r < 5; r++) {
      if (
        isMarked(r, 0) &&
        isMarked(r, 1) &&
        isMarked(r, 2) &&
        isMarked(r, 3) &&
        isMarked(r, 4)
      ) {
        const coords = new Set([`${r}-0`, `${r}-1`, `${r}-2`, `${r}-3`, `${r}-4`]);
        return { patternName: "HORIZONTAL LINE", winningCoords: coords };
      }
    }

    // 5. Vertical Line
    for (let c = 0; c < 5; c++) {
      if (
        isMarked(0, c) &&
        isMarked(1, c) &&
        isMarked(2, c) &&
        isMarked(3, c) &&
        isMarked(4, c)
      ) {
        const coords = new Set([`0-${c}`, `1-${c}`, `2-${c}`, `3-${c}`, `4-${c}`]);
        return { patternName: "VERTICAL LINE", winningCoords: coords };
      }
    }

    // 6. Diagonals
    const isDiagonalMain =
      isMarked(0, 0) &&
      isMarked(1, 1) &&
      isMarked(2, 2) &&
      isMarked(3, 3) &&
      isMarked(4, 4);

    if (isDiagonalMain) {
      const coords = new Set(["0-0", "1-1", "2-2", "3-3", "4-4"]);
      return { patternName: "DIAGONAL", winningCoords: coords };
    }

    const isDiagonalAnti =
      isMarked(0, 4) &&
      isMarked(1, 3) &&
      isMarked(2, 2) &&
      isMarked(3, 1) &&
      isMarked(4, 0);

    if (isDiagonalAnti) {
      const coords = new Set(["0-4", "1-3", "2-2", "3-1", "4-0"]);
      return { patternName: "DIAGONAL", winningCoords: coords };
    }

    return { patternName: null, winningCoords: new Set() };
  }

  // ---------------------------------------------------------
  // PAGINATION CALCULATIONS (4 CARTELAS PER PAGE)
  // ---------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(selectedCards.length / CARDS_PER_PAGE));
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const currentVisibleCards = selectedCards.slice(startIndex, startIndex + CARDS_PER_PAGE);

  // Reset page to 1 if user removes cards and page goes out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [selectedCards.length, totalPages, currentPage]);

  // ---------------------------------------------------------
  // LOADING SCREEN
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          fontSize: "18px",
          fontWeight: "bold"
        }}
      >
        Loading Cartelas...
      </div>
    );
  }

  // ---------------------------------------------------------
  // SELECT SCREEN
  // ---------------------------------------------------------
  if (!confirmed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "#ffffff",
          padding: "16px",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            margin: "0 auto",
            background: "#1e293b",
            borderRadius: "16px",
            padding: "20px",
            boxSizing: "border-box"
          }}
        >
          <h1
            style={{
              textAlign: "center",
              color: "#38bdf8",
              fontSize: "22px",
              margin: "0 0 5px 0"
            }}
          >
            🎱 CHOOSE CARTELAS
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "13px",
              marginBottom: "16px"
            }}
          >
            Choose one or more Cartelas from 1 to 200.
          </p>

          {/* MANUAL INPUT */}
          <form
            onSubmit={handleManualAdd}
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "14px"
            }}
          >
            <input
              type="text"
              value={typedInput}
              onChange={function (event) {
                setTypedInput(event.target.value);
              }}
              placeholder="Example: 1, 25, 151, 200"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "11px",
                borderRadius: "8px",
                border: "1px solid #38bdf8",
                background: "#0f172a",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box"
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
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              ADD
            </button>
          </form>

          {/* SELECTED */}
          {selectedCards.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  marginBottom: "6px"
                }}
              >
                Selected ({selectedCards.length})
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "5px"
                }}
              >
                {selectedCards.map(function (number) {
                  return (
                    <button
                      key={number}
                      onClick={function () {
                        toggleCartela(number);
                      }}
                      style={{
                        background: "#38bdf8",
                        color: "#0f172a",
                        border: "none",
                        borderRadius: "12px",
                        padding: "4px 9px",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      #{number} ×
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* NUMBER GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "6px",
              maxHeight: "300px",
              overflowY: "auto",
              padding: "8px",
              background: "#0f172a",
              borderRadius: "10px",
              boxSizing: "border-box"
            }}
          >
            {Array.from(
              { length: 200 },
              function (_, index) {
                return index + 1;
              }
            ).map(function (number) {
              const selected = selectedCards.includes(number);

              return (
                <button
                  key={number}
                  onClick={function () {
                    toggleCartela(number);
                  }}
                  style={{
                    padding: "9px 0",
                    borderRadius: "6px",
                    border: selected
                      ? "2px solid #86efac"
                      : "1px solid #334155",
                    background: selected ? "#22c55e" : "#1e293b",
                    color: "#ffffff",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  {number}
                </button>
              );
            })}
          </div>

          {/* VIEW BUTTON */}
          <button
            onClick={function () {
              if (selectedCards.length === 0) {
                alert("Select at least one Cartela!");
                return;
              }
              setConfirmed(true);
            }}
            style={{
              width: "100%",
              marginTop: "15px",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#22c55e",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            ✓ VIEW MY BINGO CARDS ({selectedCards.length})
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // DISPLAY 4 CARTELAS PER PAGE
  // ---------------------------------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#0f172a",
        color: "#ffffff",
        padding: "8px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif"
      }}
    >
      {/* HEADER BAR */}
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          margin: "0 auto 8px auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px"
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#38bdf8", fontSize: "16px" }}>
            MY CARDS ({selectedCards.length})
          </h1>
          <p
            style={{
              margin: "1px 0 0 0",
              color: "#94a3b8",
              fontSize: "10px"
            }}
          >
            Page {currentPage} of {totalPages}
          </p>
        </div>

        {/* PAGINATION NAVIGATION CONTROLS */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {totalPages > 1 && (
            <>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  background: currentPage === 1 ? "#1e293b" : "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                ◀ Prev
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  background: currentPage === totalPages ? "#1e293b" : "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Next ▶
              </button>
            </>
          )}

          <button
            onClick={function () {
              setConfirmed(false);
            }}
            style={{
              background: "#334155",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            ✏️ Edit
          </button>
        </div>
      </div>

      {/* 4-CARTELA GRID CONTAINER */}
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
          alignItems: "start"
        }}
      >
        {currentVisibleCards.map(function (cartelaNumber) {
          const matrix = getMatrix(cartelaNumber);
          const { patternName, winningCoords } = checkWinner(cartelaNumber);

          if (matrix.length === 0) {
            return (
              <div
                key={cartelaNumber}
                style={{
                  background: "#7f1d1d",
                  borderRadius: "8px",
                  padding: "10px",
                  textAlign: "center",
                  fontSize: "12px"
                }}
              >
                Cartela #{cartelaNumber} not found.
              </div>
            );
          }

          return (
            <div
              key={cartelaNumber}
              style={{
                background: "#1e293b",
                borderRadius: "10px",
                padding: "6px",
                boxSizing: "border-box",
                width: "100%",
                border: patternName
                  ? "2px solid #22c55e"
                  : "1px solid #334155"
              }}
            >
              {/* WINNER BANNER */}
              {patternName && (
                <div
                  style={{
                    background: "#22c55e",
                    color: "#ffffff",
                    textAlign: "center",
                    fontWeight: "bold",
                    padding: "3px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    marginBottom: "4px"
                  }}
                >
                  🏆 WINNER! {patternName}
                </div>
              )}

              {/* TITLE */}
              <div
                style={{
                  textAlign: "center",
                  color: "#f59e0b",
                  fontSize: "13px",
                  fontWeight: "bold",
                  marginBottom: "4px"
                }}
              >
                CARTELA #{cartelaNumber}
              </div>

              {/* CARTELA 5x5 MATRIX */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: "2px",
                  width: "100%"
                }}
              >
                {["B", "I", "N", "G", "O"].map(function (letter) {
                  return (
                    <div
                      key={letter}
                      style={{
                        background: "#0284c7",
                        color: "#ffffff",
                        textAlign: "center",
                        fontWeight: "bold",
                        padding: "2px 0",
                        borderRadius: "3px",
                        fontSize: "11px"
                      }}
                    >
                      {letter}
                    </div>
                  );
                })}

                {matrix.map(function (row, rowIndex) {
                  return row.map(function (value, colIndex) {
                    const isFree = value === "★" || value === "FREE";
                    const key = String(cartelaNumber) + "-" + String(value);
                    const isMarked = isFree || Boolean(markedCells[key]);

                    const isWinningCell = winningCoords.has(`${rowIndex}-${colIndex}`);

                    let cellBg = "#334155";
                    let cellColor = "#ffffff";
                    let cellBorder = "1px solid #475569";

                    if (isWinningCell && !isFree) {
                      cellBg = "#22c55e";
                      cellColor = "#0f172a";
                      cellBorder = "1px solid #86efac";
                    } else if (isFree) {
                      cellBg = "#059669";
                      cellColor = "#ffffff";
                    } else if (isMarked) {
                      cellBg = "#eab308";
                      cellColor = "#0f172a";
                      cellBorder = "1px solid #fef08a";
                    }

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={function () {
                          toggleCell(cartelaNumber, value);
                        }}
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          minWidth: 0,
                          padding: 0,
                          borderRadius: "3px",
                          border: cellBorder,
                          background: cellBg,
                          color: cellColor,
                          fontSize: "11px",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: isFree ? "default" : "pointer",
                          boxSizing: "border-box"
                        }}
                      >
                        {value}
                      </button>
                    );
                  });
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}