import { useParams, Link } from "react-router-dom";
import { useState } from "react";

export default function AgentDashboard() {

  const { id } = useParams();


  const [amount, setAmount] = useState("");


  const [wallet, setWallet] = useState(
    Number(localStorage.getItem("agentWallet_" + id)) || 0
  );



  function addWallet() {

    if (!amount) {
      alert("Enter amount");
      return;
    }


    const newBalance =
      wallet + Number(amount);


    setWallet(newBalance);


    localStorage.setItem(
      "agentWallet_" + id,
      newBalance
    );


    setAmount("");

  }



  return (

    <div>

      <h1>
        AGENT DASHBOARD
      </h1>


      <h3>
        Agent: {id}
      </h3>


      <hr />


      <h2>
        Wallet
      </h2>


      <h3>
        Balance: {wallet} ETB
      </h3>


      <input
        placeholder="Add Wallet Amount"
        value={amount}
        onChange={(e)=>setAmount(e.target.value)}
      />


      <br /><br />


      <button onClick={addWallet}>
        Add Balance
      </button>



      <hr />


      <h2>
        Agent Services
      </h2>


      <p>
        <Link to={"/agent-recharge/" + id}>
          Recharge House / Cashier
        </Link>
      </p>


      <p>
        <Link to={"/commission-report/" + id}>
          Commission Report
        </Link>
      </p>


      <p>
        Recharge History
      </p>


      <p>
        Logout
      </p>


    </div>

  );

}