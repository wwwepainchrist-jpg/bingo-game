import { useState } from "react";
import { useParams } from "react-router-dom";

export default function AgentRecharge(){

  const { id } = useParams();

  const [receiver,setReceiver] = useState("");
  const [amount,setAmount] = useState("");


  const [history,setHistory] = useState(
    JSON.parse(localStorage.getItem("recharges")) || []
  );


  function recharge(){


    const rechargeAmount = Number(amount);


    const agentWallet =
      Number(localStorage.getItem("agentWallet_" + id)) || 0;


    if(rechargeAmount > agentWallet){

      alert("Agent wallet not enough");
      return;

    }



    // remove money from agent

    localStorage.setItem(
      "agentWallet_" + id,
      agentWallet - rechargeAmount
    );



    // add money to receiver

    const receiverWallet =
      Number(localStorage.getItem("wallet_" + receiver)) || 0;


    localStorage.setItem(
      "wallet_" + receiver,
      receiverWallet + rechargeAmount
    );



    const newRecharge = {

      agent:id,

      receiver:receiver,

      amount:rechargeAmount,

      date:new Date().toLocaleString()

    };



    const updatedHistory = [

      ...history,

      newRecharge

    ];


    setHistory(updatedHistory);


    localStorage.setItem(
      "recharges",
      JSON.stringify(updatedHistory)
    );


    alert("Recharge Successful");


    setReceiver("");
    setAmount("");

  }



  return(

    <div>


      <h1>
        AGENT RECHARGE
      </h1>


      <h3>
        Agent: {id}
      </h3>


      <input
        placeholder="House / Cashier Username"
        value={receiver}
        onChange={(e)=>setReceiver(e.target.value)}
      />


      <br/><br/>


      <input
        placeholder="Amount"
        value={amount}
        onChange={(e)=>setAmount(e.target.value)}
      />


      <br/><br/>


      <button onClick={recharge}>
        Recharge
      </button>


      <hr/>


      <h2>
        Recharge History
      </h2>


      <table border="1">

        <thead>
          <tr>
            <th>Date</th>
            <th>Agent</th>
            <th>Receiver</th>
            <th>Amount</th>
          </tr>
        </thead>


        <tbody>

        {
          history.map((item,index)=>(

            <tr key={index}>

              <td>{item.date}</td>

              <td>{item.agent}</td>

              <td>{item.receiver}</td>

              <td>{item.amount} ETB</td>

            </tr>

          ))
        }

        </tbody>


      </table>


    </div>

  );

}