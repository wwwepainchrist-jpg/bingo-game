import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import UserList from "./pages/UserList";
import HouseList from "./pages/HouseList";

import HouseDashboard from "./pages/HouseDashboard";
import ManageCashiers from "./pages/ManageCashiers";

import AgentDashboard from "./pages/AgentDashboard";

import CashierDashboard from "./pages/CashierDashboard";
import BingoGame from "./pages/BingoGame";
import PrintCartelas from "./pages/PrintCartelas";

import FinanceDashboard from "./pages/FinanceDashboard";
import PlayerCartelaView from "./pages/PlayerCartelaView";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/super-admin" element={<SuperAdminDashboard />} />
      <Route path="/users" element={<UserList />} />
      <Route path="/houses" element={<HouseList />} />

      <Route path="/house-dashboard/:id" element={<HouseDashboard />} />
      <Route path="/manage-cashiers/:id" element={<ManageCashiers />} />

      <Route path="/agent-dashboard/:id" element={<AgentDashboard />} />

      <Route path="/cashier-dashboard/:id" element={<CashierDashboard />} />

      <Route path="/bingo-game/:id" element={<BingoGame />} />
      <Route path="/print-cartelas" element={<PrintCartelas />} />
      <Route path="/finance-dashboard/:id" element={<FinanceDashboard />} />

      <Route path="/select-cartela" element={<PlayerCartelaView />} />
      <Route path="/player-cartela/:id" element={<PlayerCartelaView />} />
    </Routes>
  );
}