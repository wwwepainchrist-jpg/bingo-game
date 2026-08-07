export default function HouseRechargeHistory() {
  const recharges = [
    {
      house: "Bingo House Addis",
      amount: "5000 ETB",
      packageAdded: "Gold",
      commission: "10%",
      createdAt: "2026-07-09",
    },
  ];

  return (
    <div>
      <h1>House Recharge History</h1>

      <label>Start Date</label>
      <br />
      <input type="date" />

      <br />
      <br />

      <label>End Date</label>
      <br />
      <input type="date" />

      <br />
      <br />

      <button>Search</button>

      <hr />

      <h3>Total Recharges: 5000 ETB</h3>
      <h3>Average Recharges: 5000 ETB</h3>
      <h3>Top Houses: Bingo House Addis</h3>

      <hr />

      <h2>Recharge Trend</h2>

      <p>Bingo House Addis : 5000 ETB</p>

      <hr />

      <table border="1">
        <thead>
          <tr>
            <th>House</th>
            <th>Amount</th>
            <th>Package Added</th>
            <th>Commission</th>
            <th>Created At</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {recharges.map((item, index) => (
            <tr key={index}>
              <td>{item.house}</td>
              <td>{item.amount}</td>
              <td>{item.packageAdded}</td>
              <td>{item.commission}</td>
              <td>{item.createdAt}</td>
              <td>
                <button>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}