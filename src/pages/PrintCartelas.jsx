import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function PrintCartelas() {
  const [cartelas, setCartelas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCartelas() {
      try {
        const response = await fetch("http://localhost:5000/api/cartelas");
        if (response.ok) {
          const data = await response.json();
          setCartelas(data);
        } else {
          console.error("Failed to fetch cartelas from server");
        }
      } catch (error) {
        console.error("Error connecting to backend API:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCartelas();
  }, []);

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const port = typeof window !== "undefined" && window.location.port ? `:${window.location.port}` : ":5173";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const playerQrUrl = `${protocol}//${host}${port}/select-cartela`;

  const cardsPerSheet = 30; // 6 columns × 5 rows = 30 cards per sheet
  const totalSheets = Math.ceil(cartelas.length / cardsPerSheet) || 1;

  const sheets = Array.from({ length: totalSheets }, (_, sheetIndex) =>
    cartelas.slice(sheetIndex * cardsPerSheet, (sheetIndex + 1) * cardsPerSheet)
  );

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "30px",
          backgroundColor: "#090d16",
          textAlign: "center",
          fontFamily: "sans-serif",
          fontSize: "20px",
          color: "#38bdf8",
        }}
      >
        Loading cartelas...
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#090d16", overflow: "auto", boxSizing: "border-box" }}>
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          background: #090d16;
          overflow: auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        ::-webkit-scrollbar {
          height: 16px;
          width: 16px;
        }
        ::-webkit-scrollbar-track {
          background: #06090f;
        }
        ::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 8px;
          border: 3px solid #06090f;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }

        .scrollable-canvas {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
          padding: 40px 60px 80px 60px;
          min-width: max-content;
        }

        .sheet-page {
          width: 210mm;
          min-width: 210mm;
          height: 297mm;
          min-height: 297mm;
          background: #ffffff;
          color: #0f172a;
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
          padding: 6mm;
          box-sizing: border-box;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
        }

        .sheet-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(5, 1fr);
          gap: 2mm;
          justify-content: center;
          align-content: center;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }

        .sheet-cell {
          position: relative;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }

        .sheet-cell::before {
          content: "";
          position: absolute;
          inset: -1mm;
          border: 0.5px dashed #cbd5e1;
          pointer-events: none;
          border-radius: 4px;
        }

        .sheet-cell-empty {
          visibility: hidden;
        }

        .sheet-cell-empty::before {
          display: none;
        }

        .cartela-sheet-card {
          width: 100%;
          height: 100%;
          background: #ffffff;
          border: 1.5px solid #7c3aed;
          border-radius: 6px;
          padding: 3px;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.12);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .cartela-header {
          background: linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #ea580c 100%) !important;
          color: #ffffff !important;
          padding: 2px 4px;
          border-radius: 4px;
          text-align: center;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(124, 58, 237, 0.3);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .cartela-board {
          display: flex;
          flex-direction: column;
          gap: 1.5px;
          margin: 2px 0;
        }

        .bingo-header-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1.5px;
        }

        .bingo-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1.5px;
        }

        .bingo-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0.5px solid #cbd5e1;
          background: #faf5ff !important;
          font-size: 8px;
          font-weight: 900;
          border-radius: 2px;
          box-shadow: inset 0 1px 1px rgba(0,0,0,0.05);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .bingo-cell-free {
          border: 1px solid #9333ea !important;
          color: #7c3aed !important;
          background: linear-gradient(135deg, #f3e8ff 0%, #fae8ff 100%) !important;
          font-size: 6px;
          font-weight: 900;
          text-transform: uppercase;
          box-shadow: inset 0 0 4px rgba(147, 51, 234, 0.25);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .cartela-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 2px;
          border-top: 0.5px solid #e2e8f0;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          body, html, #root {
            background: white !important;
            width: 210mm !important;
            height: 297mm !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .scrollable-canvas {
            display: block !important;
            padding: 0 !important;
            min-width: 0 !important;
            gap: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .sheet-page {
            width: 210mm !important;
            min-width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            border: none !important;
            box-shadow: none !important;
            padding: 6mm !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>

      <div className="scrollable-canvas">
        <div
          className="no-print"
          style={{ display: "flex", gap: "15px", alignItems: "center", justifyContent: "center", width: "100%", flexWrap: "wrap" }}
        >
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: "16px 32px",
              fontSize: "19px",
              fontWeight: "900",
              cursor: "pointer",
              background: "linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #ea580c 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(124, 58, 237, 0.4)",
              letterSpacing: "0.5px"
            }}
          >
            📥 DOWNLOAD / PRINT ALL {totalSheets} A4 SHEETS ({cartelas.length} Total Cartelas)
          </button>
        </div>

        {sheets.map((sheetCartelas, sheetIndex) => (
          <div key={sheetIndex} className="sheet-page">
            <div className="sheet-grid">
              {sheetCartelas.map((cartela) => (
                <div key={cartela.id} className="sheet-cell">
                  <div className="cartela-sheet-card">
                    {/* Header */}
                    <div className="cartela-header">
                      <span style={{ fontSize: "7px", fontWeight: "900", letterSpacing: "0.2px" }}>
                        ✨ BULCHAA BINGO ✨
                      </span>
                      <span style={{ fontSize: "8px", fontWeight: "900", background: "#ffffff", color: "#7c3aed", padding: "1px 4px", borderRadius: "3px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                        #{cartela.id}
                      </span>
                    </div>

                    {/* Grid Board */}
                    <div className="cartela-board">
                      <div className="bingo-header-row">
                        {[
                          { letter: "B", bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
                          { letter: "I", bg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" },
                          { letter: "N", bg: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)" },
                          { letter: "G", bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
                          { letter: "O", bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
                        ].map((item) => (
                          <div
                            key={item.letter}
                            style={{
                              background: item.bg,
                              color: "white",
                              fontSize: "8px",
                              fontWeight: "900",
                              textAlign: "center",
                              padding: "2px 0",
                              borderRadius: "2px",
                              WebkitPrintColorAdjust: "exact",
                              printColorAdjust: "exact"
                            }}
                          >
                            {item.letter}
                          </div>
                        ))}
                      </div>

                      {cartela.numbers.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="bingo-row">
                          {row.map((cell, cellIndex) => {
                            const numberColors = [
                              "#2563eb",
                              "#dc2626",
                              "#059669",
                              "#7c3aed",
                              "#ea580c",
                              "#0d9488",
                              "#db2777",
                              "#4f46e5",
                            ];
                            const colorIndex = (rowIndex * 5 + cellIndex) % numberColors.length;

                            return (
                              <div
                                key={cellIndex}
                                className={`bingo-cell ${cell === "FREE" ? "bingo-cell-free" : ""}`}
                                style={cell !== "FREE" ? { color: numberColors[colorIndex], WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } : {}}
                              >
                                {cell}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Footer with scannable QR Code */}
                    <div className="cartela-footer">
                      <span style={{ fontSize: "6.5px", fontWeight: "900", color: "#7c3aed" }}>
                        📞 0937515292
                      </span>
                      <div style={{ background: "#ffffff", padding: "0.5px", borderRadius: "2px", border: "0.5px solid #cbd5e1" }}>
                        <QRCodeCanvas
                          value={`${playerQrUrl}?cartela=${cartela.id}`}
                          size={24}
                          bgColor="#ffffff"
                          fgColor="#0f172a"
                          level="M"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {Array.from({ length: cardsPerSheet - sheetCartelas.length }).map((_, emptyIndex) => (
                <div key={`${sheetIndex}-${emptyIndex}`} className="sheet-cell sheet-cell-empty" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}