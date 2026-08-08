import { useState, useEffect } from "react";

function Cartelas() {
  const [cartelas, setCartelas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all pre-generated cartelas from the backend database on mount
  useEffect(() => {
    async function fetchCartelas() {
      try {
        const response = await fetch("https://bingo-backend-ccn6.onrender.com/api/cartelas");
        if (response.ok) {
          const data = await response.json();
          setCartelas(data);
          if (data.length > 0) {
            console.log(data[0]);
          }
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

  if (loading) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        Loading cartelas from database...
      </div>
    );
  }

  return (
    <div>
      <h1>Cartela Management ({cartelas.length})</h1>

      {cartelas.map((cartela) => (
        <div key={cartela.id} style={{ marginBottom: "10px" }}>
          <span>
            ID: {cartela.id} | Serial: {cartela.serial}
          </span>

          <button
            onClick={() => {
              console.log("Clicked:", cartela);
              setSelected(cartela);
            }}
            style={{ marginLeft: "10px", cursor: "pointer" }}
          >
            View
          </button>
        </div>
      ))}

      {selected && (
        <div style={{ marginTop: "20px" }}>
          <h2>
            Cartela {selected.id} ({selected.serial})
          </h2>

          <table border="1">
            <tbody>
              <tr>
                <th>B</th>
                <th>I</th>
                <th>N</th>
                <th>G</th>
                <th>O</th>
              </tr>

              {[0, 1, 2, 3, 4].map((row) => (
                <tr key={row}>
                  <td>{selected.numbers.B[row]}</td>
                  <td>{selected.numbers.I[row]}</td>
                  <td>{selected.numbers.N[row]}</td>
                  <td>{selected.numbers.G[row]}</td>
                  <td>{selected.numbers.O[row]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Cartelas;