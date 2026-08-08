import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function CommissionReport() {
  const { id } = useParams();

  // Reactive state holders connected to backend database tables
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch agent recharges from backend API
  useEffect(() => {
    async function fetchAgentRecharges() {
      try {
        const response = await fetch("https://bingo-backend-ccn6.onrender.com/api/recharges");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            // Filter recharges matching this specific agent ID
            const filtered = data.filter((item) => item.agent === id);
            setRecharges(filtered);
          }
        }
      } catch (err) {
        console.error("Error fetching agent recharges from server:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAgentRecharges();
  }, [id]);

  const totalRecharge = recharges.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const commission = totalRecharge * 0.05;

  if (loading) {
    return (
      <div style={{ padding: "20px", color: "#fff", textAlign: "center" }}>
        Loading commission report...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", color: "#fff" }}>
      <h1>AGENT COMMISSION REPORT</h1>

      <h3>Agent: {id}</h3>

      <hr />

      <p>Total Recharge: {totalRecharge} ETB</p>

      <p>Commission Rate: 5%</p>

      <p>Total Commission: {commission.toFixed(2)} ETB</p>

      <hr />

      <h2>Recharge History</h2>

      <table border="1" style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
        <thead>
          <tr>
            <th style={{ padding: "8px" }}>Date</th>
            <th style={{ padding: "8px" }}>Receiver</th>
            <th style={{ padding: "8px" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {recharges.length > 0 ? (
            recharges.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: "8px", textAlign: "center" }}>{item.date}</td>
                <td style={{ padding: "8px", textAlign: "center" }}>{item.receiver}</td>
                <td style={{ padding: "8px", textAlign: "center" }}>{item.amount} ETB</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", padding: "12px", color: "#94a3b8" }}>
                No recharge history found for this agent.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}