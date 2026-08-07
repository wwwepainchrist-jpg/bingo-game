export default function AgentRechargeHistory() {
  const recharges = [
    {
      agent: "agent1",
      amount: "1000 ETB",
      date: "2026-07-09",
      receipt: "REC001",
    },
    {
      agent: "agent2",
      amount: "2000 ETB",
      date: "2026-07-09",
      receipt: "REC002",
    },
  ];

  return (
    <div>
      <h1>Agent Recharge History</h1>

      <br />

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

      <h3>Total Recharges: 3000 ETB</h3>
      <h3>Average Recharges: 1500 ETB</h3>
      <h3>Top Agents: agent2</h3>

      <hr />

      <h2>Recharge By Agent</h2>

      <p>Agent1 : 1000 ETB</p>
      <p>Agent2 : 2000 ETB</p>

      <hr />

      <table border="1">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Receipt</th>
          </tr>
        </thead>

        <tbody>
          {recharges.map((item, index) => (
            <tr key={index}>
              <td>{item.agent}</td>
              <td>{item.amount}</td>
              <td>{item.date}</td>
              <td>{item.receipt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}