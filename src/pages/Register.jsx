import { useState } from "react";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
 const [role, setRole] = useState("House Admin");
  const [branch, setBranch] = useState("");
const [phone, setPhone] = useState("");

  async function registerUser() {
    try {
      const response = await fetch("https://bingo-backend-ccn6.onrender.com/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  full_name: fullName,
  username,
  password,
  role,
  branch,
  phone,
        }),
      });

     const data = await response.json();

console.log("Register response:", data);

if (!response.ok) {
  alert(JSON.stringify(data));
  return;
}

      alert("User Registered Successfully!");

      setFullName("");
      setUsername("");
      setPassword("");
      setRole("House Admin");
setBranch("");
setPhone("");
    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Register User</h1>

      <input
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option>House Admin</option>
        <option>Agent</option>
        <option>Cashier</option>
      </select>

      <br /><br />

      <button onClick={registerUser}>
        Register
      </button>
    </div>
  );
}