import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

// Standard imports for fast initial entry points
import Login from "./pages/Login";
import Register from "./pages/Register";

// Lazy-loaded heavy dashboard pages (Splits code into small separate files)
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const UserList = lazy(() => import("./pages/UserList"));
const HouseList = lazy(() => import("./pages/HouseList"));
const HouseDashboard = lazy(() => import("./pages/HouseDashboard"));
const ManageCashiers = lazy(() => import("./pages/ManageCashiers"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const CashierDashboard = lazy(() => import("./pages/CashierDashboard"));
const BingoGame = lazy(() => import("./pages/BingoGame"));
const PrintCartelas = lazy(() => import("./pages/PrintCartelas"));
const FinanceDashboard = lazy(() => import("./pages/FinanceDashboard"));
const PlayerCartelaView = lazy(() => import("./pages/PlayerCartelaView"));

export default function App() {
  return (
    // Suspense shows a quick fallback view while a specific route is loading
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading layout...</div>}>
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
    </Suspense>
  );
}
   