import { Link } from "react-router-dom";

export default function AgentList() {

  const users =
    JSON.parse(localStorage.getItem("users")) || [];


  const agents = users.filter(
    (user) => user.role === "Agent"
  );


  return (

    <div>

      <h1>Agent List</h1>

      <input placeholder="Search Agent" />

      <br /><br />

      <table border="1">

        <thead>

          <tr>
            <th>Username</th>
            <th>Phone Number</th>
            <th>Branch</th>
            <th>Status</th>
            <th>Action</th>
          </tr>

        </thead>


        <tbody>

        {
          agents.map((agent,index)=>(

            <tr key={index}>

              <td>{agent.username}</td>

              <td>{agent.phone}</td>

              <td>{agent.branch}</td>

              <td>{agent.status}</td>

              <td>

                <Link
                  to={`/agent-dashboard/${agent.username}`}
                >
                  View
                </Link>

              </td>

            </tr>

          ))
        }

        </tbody>

      </table>

    </div>

  );

}