import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function HouseList() {
  const [houses, setHouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:5000/api/houses";

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHouses(data);
        } else {
          setHouses([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching houses:", err);
        setLoading(false);
      });
  }, []);

  // Filter houses based on search input (matches house name, owner name, or phone)
  const filteredHouses = houses.filter((house) => {
    const term = searchTerm.toLowerCase();
    return (
      (house.house_name && house.house_name.toLowerCase().includes(term)) ||
      (house.owner_name && house.owner_name.toLowerCase().includes(term)) ||
      (house.phone && house.phone.toLowerCase().includes(term))
    );
  });

  return (
    <div 
      style={{ 
        padding: "30px", 
        background: "#0f172a", 
        minHeight: "100vh", 
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", color: "#38bdf8" }}>House List</h1>
        <Link 
          to="/super-admin"
          style={{
            background: "#334155",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "bold"
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search House Name / Owner Name / Phone"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          maxWidth: "350px",
          padding: "10px 14px",
          marginBottom: "20px",
          borderRadius: "8px",
          border: "1px solid #334155",
          background: "#1e293b",
          color: "#fff",
          fontSize: "14px",
          outline: "none"
        }}
      />

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading houses...</p>
      ) : (
        <div style={{ overflowX: "auto", background: "#1e293b", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ background: "#0f172a", borderBottom: "1px solid #334155" }}>
                <th style={{ padding: "14px", color: "#94a3b8" }}>House Name</th>
                <th style={{ padding: "14px", color: "#94a3b8" }}>Owner Name</th>
                <th style={{ padding: "14px", color: "#94a3b8" }}>Phone</th>
                <th style={{ padding: "14px", color: "#94a3b8" }}>Address</th>
                <th style={{ padding: "14px", color: "#94a3b8" }}>Status</th>
                <th style={{ padding: "14px", color: "#94a3b8" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredHouses.length > 0 ? (
                filteredHouses.map((house) => (
                  <tr key={house.id} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "14px", fontWeight: "bold" }}>{house.house_name}</td>
                    <td style={{ padding: "14px" }}>{house.owner_name || "N/A"}</td>
                    <td style={{ padding: "14px" }}>{house.phone || "N/A"}</td>
                    <td style={{ padding: "14px" }}>{house.address || "N/A"}</td>
                    <td style={{ padding: "14px" }}>
                      <span 
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          background: house.status === "Active" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                          color: house.status === "Active" ? "#34d399" : "#f87171"
                        }}
                      >
                        {house.status || "Active"}
                      </span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <Link 
                        to={`/house-dashboard/${house.id}`}
                        style={{
                          color: "#38bdf8",
                          textDecoration: "none",
                          fontWeight: "bold"
                        }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No houses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}