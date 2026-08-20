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

  const cardsPerSheet = 35;

  // ─── FIX: Only create sheets that actually have cartelas ───
  const totalSheets = Math.ceil(cartelas.length / cardsPerSheet);

  const sheets = Array.from({ length: totalSheets }, (_, sheetIndex) =>
    cartelas.slice(sheetIndex * cardsPerSheet, (sheetIndex + 1) * cardsPerSheet)
  ).filter((sheet) => sheet.length > 0); // <-- strips any empty sheets

  const handleDownloadPDF = () => {
    setTimeout(() => window.print(), 100);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#07090e", fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}>
        <div style={{
          width: "56px", height: "56px",
          border: "4px solid rgba(245, 158, 11, 0.15)",
          borderTop: "4px solid #f59e0b", borderRadius: "50%",
          animation: "spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          marginBottom: "24px"
        }} />
        <div style={{ fontSize: "17px", fontWeight: "600", color: "#fbbf24", letterSpacing: "0.5px" }}>
          Preparing your Bulcha Bingo Cartelas...
        </div>
        <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  // ─── FIX: Friendly empty state when no cartelas exist ───
  if (cartelas.length === 0) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#07090e", color: "#f3f4f6",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        gap: "16px", textAlign: "center", padding: "40px"
      }}>
        <div style={{ fontSize: "48px" }}>📭</div>
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "800" }}>No Cartelas Found</h2>
        <p style={{ margin: 0, color: "#9ca3af", maxWidth: "400px" }}>
          There are no cartelas to print. Please generate some cartelas first and come back.
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07090e", overflowY: "auto", overflowX: "auto", boxSizing: "border-box", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      <style>{`
        html, body, #root {
          margin: 0; padding: 0; width: 100%; min-height: 100%;
          background: #07090e; overflow-y: auto; overflow-x: auto;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        ::-webkit-scrollbar { height: 14px; width: 14px; }
        ::-webkit-scrollbar-track { background: #0b0f19; }
        ::-webkit-scrollbar-thumb { background: #1f293d; border-radius: 7px; border: 3px solid #0b0f19; }
        ::-webkit-scrollbar-thumb:hover { background: #374151; }

        .scrollable-canvas {
          display: flex; flex-direction: row; align-items: flex-start;
          gap: 40px; padding: 40px 60px 80px 60px;
          width: max-content; box-sizing: border-box; overflow-x: auto;
        }

        .sheet-page {
          width: 100cm; min-width: 100cm; height: 100cm; min-height: 100cm;
          background: #0b0f19; color: #f3f4f6;
          border: 1px solid rgba(245, 158, 11, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          padding: 6mm; box-sizing: border-box; border-radius: 20px;
          display: flex; flex-direction: column;
          justify-content: space-between; align-items: center; flex-shrink: 0;
        }

        .sheet-grid {
          display: grid;
          grid-template-columns: repeat(7, 14cm);
          grid-auto-rows: 18cm;
          gap: 4mm;
          justify-content: start; align-content: start;
          width: calc(100cm - 12mm);
          height: calc(100cm - 12mm);
          box-sizing: border-box;
        }

        .sheet-cell {
          position: relative; width: 14cm; height: 18cm;
          box-sizing: border-box; padding: 2mm;
        }
        .sheet-cell::before {
          content: ""; position: absolute; inset: -2mm;
          border: 0.5px dashed rgba(245, 158, 11, 0.25);
          pointer-events: none; border-radius: 8px;
        }
        .sheet-cell-empty { visibility: hidden; }
        .sheet-cell-empty::before { display: none; }

        .cartela-sheet-card {
          width: 100%; height: 100%; background: #ffffff;
          border: 2.5px solid #111827; border-radius: 12px;
          padding: 6px; box-sizing: border-box; overflow: hidden;
          display: flex; flex-direction: column;
          justify-content: flex-start;
          gap: 5px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .cartela-header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%) !important;
          color: #ffffff !important;
          padding: 5px 10px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #4338ca;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
          min-height: 64px;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          flex-shrink: 0;
        }

        .qr-wrapper-small {
          background: #ffffff !important;
          padding: 3px !important;
          border-radius: 4px !important;
          border: 1px solid #0f172a !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 48px !important;
          min-height: 48px !important;
          box-sizing: border-box !important;
        }

        .header-phone {
          font-size: 14px !important;
          font-weight: 900 !important;
          color: #ffffff !important;
          letter-spacing: 0.3px !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
          white-space: nowrap;
        }

        .cartela-title-text {
          font-size: 24px !important;
          font-weight: 900 !important;
          letter-spacing: 2.5px !important;
          text-transform: uppercase !important;
          background: linear-gradient(90deg, #fef08a 0%, #fbbf24 30%, #ffffff 50%, #fbbf24 70%, #fef08a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
          text-align: center;
          flex: 1;
          margin: 0 6px;
          line-height: 1 !important;
        }

        .cartela-id-badge {
          font-size: 56px !important;
          font-weight: 900 !important;
          background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%) !important;
          color: #ffffff !important;
          padding: 2px 16px !important;
          border-radius: 8px !important;
          letter-spacing: 1px;
          box-shadow: 0 2px 6px rgba(244, 63, 94, 0.5);
          border: 2px solid #ffe4e6;
          line-height: 1 !important;
          flex-shrink: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .cartela-board {
          display: flex; flex-direction: column;
          gap: 4px; margin: 2px 0;
          flex: 1;
        }

        .bingo-header-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
        }

        .bingo-header-cell {
          font-size: 36px !important;
          font-weight: 900 !important;
          text-align: center;
          padding: 8px 0;
          border-radius: 6px;
          letter-spacing: 1px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          color: #ffffff;
          line-height: 1 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .bingo-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
        }

        .bingo-cell {
          aspect-ratio: 1;
          display: flex; align-items: center; justify-content: center;
          border: 3px solid #0f172a;
          background: #ffffff !important;
          font-size: 34px !important;
          font-weight: 900 !important;
          border-radius: 6px;
          letter-spacing: -0.5px;
          line-height: 1 !important;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.8);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .bingo-cell-free {
          border: 3px solid #6d28d9 !important;
          color: #ffffff !important;
          background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%) !important;
          font-size: 16px !important;
          font-weight: 900 !important;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          line-height: 1 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          box-shadow: 0 3px 6px rgba(109, 40, 217, 0.35);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @media print {
          @page { size: 100cm 100cm; margin: 6mm; }

          body, html, #root {
            background: white !important; height: auto !important; overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .scrollable-canvas {
            display: flex !important; flex-direction: column !important;
            padding: 0 !important; min-width: 0 !important;
            width: 100% !important; gap: 0 !important;
            align-items: center !important;
          }

          .no-print { display: none !important; }

          .sheet-grid {
            gap: 2mm !important;
            grid-template-columns: repeat(7, 14cm) !important;
            grid-auto-rows: 18cm !important;
            width: calc(100cm - 12mm) !important;
            height: calc(100cm - 12mm) !important;
          }

          .cartela-sheet-card {
            box-shadow: none !important;
            border: 2.5px solid #111827 !important;
            border-radius: 12px !important;
            background: #ffffff !important;
            width: calc(14cm - 4mm) !important;
            height: calc(18cm - 4mm) !important;
            padding: 6px !important;
            box-sizing: border-box !important;
            justify-content: flex-start !important;
            gap: 5px !important;
          }

          .cartela-header {
            box-shadow: none !important;
            border: 1px solid #4338ca !important;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%) !important;
            min-height: 64px !important;
          }

          .cartela-title-text {
            -webkit-text-fill-color: #ffffff !important;
            color: #ffffff !important;
            font-size: 24px !important;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)) !important;
          }

          .cartela-id-badge {
            font-size: 56px !important;
            -webkit-text-fill-color: #ffffff !important;
            color: #ffffff !important;
          }

          .qr-wrapper-small {
            background: #ffffff !important;
            padding: 3px !important;
            border: 1px solid #111827 !important;
            min-width: 48px !important;
            min-height: 48px !important;
          }

          .qr-wrapper-small canvas {
            width: 42px !important;
            height: 42px !important;
            max-width: none !important;
            max-height: none !important;
            display: block !important;
          }

          .header-phone {
            font-size: 14px !important;
            color: #ffffff !important;
          }

          .bingo-header-cell {
            font-size: 38px !important;
            line-height: 1 !important;
          }

          .bingo-cell {
            border-width: 2.5pt !important;
            font-size: 36px !important;
            line-height: 1 !important;
          }

          .bingo-cell-free {
            font-size: 16px !important;
            line-height: 1 !important;
            background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%) !important;
            color: #ffffff !important;
          }

          img, canvas {
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: crisp-edges !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .sheet-page {
            width: 100cm !important; min-width: 100cm !important;
            height: 100cm !important; min-height: 100cm !important;
            max-height: 100cm !important;
            border: none !important; box-shadow: none !important;
            padding: 6mm !important; margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: white !important;
          }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh" }}>
        <div className="no-print" style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: "12px", width: "100%", padding: "20px 0 10px 0", textAlign: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>👑</span>
            <h1 style={{ color: "#f9fafb", margin: 0, fontSize: "24px", fontWeight: "800", letterSpacing: "0.5px" }}>
              Bulcha Bingo Print Hub
            </h1>
          </div>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px", maxWidth: "500px" }}>
            High-contrast professional layout optimized for sharp sticker printing. Ready for thermal or laser production.
          </p>
          <button onClick={handleDownloadPDF} style={{
            marginTop: "8px", padding: "16px 36px", fontSize: "17px", fontWeight: "800",
            cursor: "pointer", background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
            color: "#ffffff", border: "none", borderRadius: "14px",
            boxShadow: "0 10px 25px -5px rgba(236, 72, 153, 0.4)",
            letterSpacing: "0.5px", transition: "transform 0.2s ease, box-shadow 0.2s ease"
          }}>
            🖨️ PRINT / EXPORT ALL {sheets.length} SHEETS ({cartelas.length} CARTELAS)
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
                          <div className="header-left">
                            <div className="qr-wrapper-small">
                              <QRCodeCanvas
                                value={`${playerQrUrl}?cartela=${cartela.id}`}
                                size={42}
                                bgColor="#ffffff"
                                fgColor="#111827"
                                level="H"
                              />
                            </div>
                            <span className="header-phone">📞 0937515292</span>
                          </div>

                          <span className="cartela-title-text">
                            👑 BULCHA BINGO 👑
                          </span>

                          <span className="cartela-id-badge">
                            #{sequentialId}
                          </span>
                        </div>

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
                                className="bingo-header-cell"
                                style={{ background: item.bg }}
                              >
                                {item.letter}
                              </div>
                            ))}
                          </div>

                          {cartela.numbers.rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="bingo-row">
                              {row.map((cell, cellIndex) => {
                                const vibrantColors = [
                                  "#2563eb", "#dc2626", "#059669", "#7c3aed",
                                  "#ea580c", "#0d9488", "#db2777", "#4f46e5",
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