import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function PrintCartelas() {
  const [cartelas, setCartelas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCartelas() {
      try {
        const response = await fetch("https://bingo-backend-ccn6.onrender.com/api/cartelas");
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

  const cardsPerSheet = 35; // 7 columns × 5 rows = 35 cards per sheet
  const totalSheets = Math.ceil(cartelas.length / cardsPerSheet) || 1;

  const sheets = Array.from({ length: totalSheets }, (_, sheetIndex) =>
    cartelas.slice(sheetIndex * cardsPerSheet, (sheetIndex + 1) * cardsPerSheet)
  );

  const handleDownloadPDF = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#07090e",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            border: "4px solid rgba(245, 158, 11, 0.15)",
            borderTop: "4px solid #f59e0b",
            borderRadius: "50%",
            animation: "spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            marginBottom: "24px"
          }}
        />
        <div style={{ fontSize: "17px", fontWeight: "600", color: "#fbbf24", letterSpacing: "0.5px" }}>
          Preparing your Bulcha Bingo Cartelas...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07090e", overflowY: "auto", overflowX: "auto", boxSizing: "border-box", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
          background: #07090e;
          overflow-y: auto;
          overflow-x: auto;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        ::-webkit-scrollbar {
          height: 14px;
          width: 14px;
        }
        ::-webkit-scrollbar-track {
          background: #0b0f19;
        }
        ::-webkit-scrollbar-thumb {
          background: #1f293d;
          border-radius: 7px;
          border: 3px solid #0b0f19;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #374151;
        }

        .scrollable-canvas {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 40px;
          padding: 40px 60px 80px 60px;
          width: max-content;
          box-sizing: border-box;
          overflow-x: auto;
        }

        .sheet-page {
          width: 100cm;
          min-width: 100cm;
          height: 100cm;
          min-height: 100cm;
          background: #0b0f19;
          color: #f3f4f6;
          border: 1px solid rgba(245, 158, 11, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          padding: 6mm;
          box-sizing: border-box;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .sheet-grid {
          display: grid;
          grid-template-columns: repeat(7, 14cm);
          grid-auto-rows: 18cm;
          gap: 4mm;
          justify-content: start;
          align-content: start;
          width: calc(100cm - 12mm);
          height: calc(100cm - 12mm);
          box-sizing: border-box;
        }

        .sheet-cell {
          position: relative;
          width: 14cm;
          height: 18cm;
          box-sizing: border-box;
          padding: 2mm;
        }

        .sheet-cell::before {
          content: "";
          position: absolute;
          inset: -2mm;
          border: 0.5px dashed rgba(245, 158, 11, 0.25);
          pointer-events: none;
          border-radius: 8px;
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
          border: 2px solid #111827;
          border-radius: 12px;
          padding: 5px;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .cartela-header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%) !important;
          color: #ffffff !important;
          padding: 6px 10px;
          border-radius: 8px;
          text-align: center;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #4338ca;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .cartela-title-text {
          font-size: 13px !important;
          font-weight: 900 !important;
          letter-spacing: 1.5px !important;
          text-transform: uppercase !important;
          background: linear-gradient(90deg, #ffffff 0%, #fed7aa 50%, #fef08a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .cartela-id-badge {
          font-size: 32px !important;
          font-weight: 900 !important;
          background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%) !important;
          color: #ffffff !important;
          padding: 1px 18px !important;
          border-radius: 6px !important;
          letter-spacing: 1px;
          box-shadow: 0 2px 6px rgba(244, 63, 94, 0.5);
          border: 1.5px solid #ffe4e6;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .cartela-board {
          display: flex;
          flex-direction: column;
          gap: 2.5px;
          margin: 3px 0;
        }

        .bingo-header-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 2.5px;
        }

        .bingo-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 2.5px;
        }

        .bingo-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid #1e293b;
          background: #ffffff !important;
          font-size: 19.5px;
          font-weight: 900;
          border-radius: 6px;
          letter-spacing: -0.5px;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.8);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .bingo-cell-free {
          border: 2.5px solid #6d28d9 !important;
          color: #ffffff !important;
          background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%) !important;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          box-shadow: 0 3px 6px rgba(109, 40, 217, 0.35);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .cartela-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 4px;
          border-top: 1px solid #f3f4f6;
        }

        @media print {
          @page {
            size: 100cm 100cm;
            margin: 6mm;
          }

          body, html, #root {
            background: white !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .scrollable-canvas {
            display: flex !important;
            flex-direction: column !important;
            padding: 0 !important;
            min-width: 0 !important;
            width: 100% !important;
            gap: 0 !important;
            align-items: center !important;
          }

          .no-print {
            display: none !important;
          }

          .sheet-grid {
            gap: 2mm !important;
            grid-template-columns: repeat(7, 14cm) !important;
            grid-auto-rows: 18cm !important;
            width: calc(100cm - 12mm) !important;
            height: calc(100cm - 12mm) !important;
          }

          .cartela-sheet-card {
            box-shadow: none !important;
            border: 2px solid #111827 !important;
            border-radius: 12px !important;
            background: #ffffff !important;
            width: calc(14cm - 4mm) !important;
            height: calc(18cm - 4mm) !important;
            padding: 5px !important;
            box-sizing: border-box !important;
          }

          .cartela-header {
            box-shadow: none !important;
            border: 1px solid #4338ca !important;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%) !important;
          }

          .cartela-title-text {
            -webkit-text-fill-color: #ffffff !important;
            color: #ffffff !important;
          }

          .cartela-id-badge {
            font-size: 32px !important;
          }

          .bingo-cell {
            border-width: 1.5pt !important;
            font-size: 19.5px !important;
          }

          .bingo-cell-free {
            font-size: 9px !important;
            background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%) !important;
            color: #ffffff !important;
          }

          .cartela-footer canvas, .cartela-footer svg {
            width: 48px !important;
            height: 48px !important;
          }

          img, canvas {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .sheet-page {
            width: 100cm !important;
            min-width: 100cm !important;
            height: 100cm !important;
            min-height: 100cm !important;
            max-height: 100cm !important;
            border: none !important;
            box-shadow: none !important;
            padding: 6mm !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: white !important;
          }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh" }}>
        <div
          className="no-print"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            padding: "20px 0 10px 0",
            textAlign: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>👑</span>
            <h1 style={{ color: "#f9fafb", margin: 0, fontSize: "24px", fontWeight: "800", letterSpacing: "0.5px" }}>
              Bulcha Bingo Print Hub
            </h1>
          </div>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px", maxWidth: "500px" }}>
            High-contrast professional layout optimized for sharp sticker printing. Ready for thermal or laser production.
          </p>
          <button
            onClick={handleDownloadPDF}
            style={{
              marginTop: "8px",
              padding: "16px 36px",
              fontSize: "17px",
              fontWeight: "800",
              cursor: "pointer",
              background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              boxShadow: "0 10px 25px -5px rgba(236, 72, 153, 0.4)",
              letterSpacing: "0.5px",
              transition: "transform 0.2s ease, box-shadow 0.2s ease"
            }}
          >
            🖨️ PRINT / EXPORT ALL {totalSheets} SHEETS ({cartelas.length} CARTELAS)
          </button>
        </div>

        <div className="scrollable-canvas">
          {sheets.map((sheetCartelas, sheetIndex) => (
            <div key={sheetIndex} className="sheet-page">
              <div className="sheet-grid">
                {sheetCartelas.map((cartela, index) => {
                  const sequentialId = sheetIndex * cardsPerSheet + index + 1;

                  return (
                    <div key={cartela.id} className="sheet-cell">
                      <div className="cartela-sheet-card">
                        <div className="cartela-header">
                          <span className="cartela-title-text">
                            BULCHA BINGO
                          </span>
                          <span className="cartela-id-badge">
                            #{sequentialId}
                          </span>
                        </div>

                        {/* Grid Board */}
                        <div className="cartela-board">
                          <div className="bingo-header-row">
                            {[
                              { letter: "B", bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
                              { letter: "I", bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
                              { letter: "N", bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
                              { letter: "G", bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
                              { letter: "O", bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
                            ].map((item) => (
                              <div
                                key={item.letter}
                                style={{
                                  background: item.bg,
                                  color: "#ffffff",
                                  fontSize: "23px",
                                  fontWeight: "900",
                                  textAlign: "center",
                                  padding: "7px 0",
                                  borderRadius: "5px",
                                  letterSpacing: "1px",
                                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
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
                                const vibrantColors = [
                                  "#2563eb", // Rich Vibrant Blue
                                  "#dc2626", // Deep Vivid Red
                                  "#059669", // Vibrant Emerald Green
                                  "#7c3aed", // Electric Violet / Purple
                                  "#ea580c", // Vibrant Orange-Red
                                  "#0d9488", // Deep Teal
                                  "#db2777", // Vibrant Magenta / Pink
                                  "#4f46e5", // Deep Indigo
                                ];
                                const colorIndex = (rowIndex * 5 + cellIndex) % vibrantColors.length;

                                return (
                                  <div
                                    key={cellIndex}
                                    className={`bingo-cell ${cell === "FREE" ? "bingo-cell-free" : ""}`}
                                    style={cell !== "FREE" ? { 
                                      color: vibrantColors[colorIndex], 
                                      WebkitPrintColorAdjust: "exact", 
                                      printColorAdjust: "exact" 
                                    } : {}}
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
                          <span style={{ fontSize: "7.5px", fontWeight: "800", color: "#111827", letterSpacing: "0.2px" }}>
                            📞 0937515292
                          </span>
                          <div style={{ background: "#ffffff", padding: "1px", borderRadius: "3px", border: "1px solid #d1d5db" }}>
                            <QRCodeCanvas
                              value={`${playerQrUrl}?cartela=${cartela.id}`}
                              size={24}
                              bgColor="#ffffff"
                              fgColor="#111827"
                              level="M"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {Array.from({ length: cardsPerSheet - sheetCartelas.length }).map((_, emptyIndex) => (
                  <div key={`${sheetIndex}-${emptyIndex}`} className="sheet-cell sheet-cell-empty" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}