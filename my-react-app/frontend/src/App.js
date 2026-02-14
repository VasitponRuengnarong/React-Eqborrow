import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute"; // ตรวจสอบว่าคุณมีไฟล์นี้
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect หน้าแรกไปที่ Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes (ต้อง Login ก่อนถึงจะเข้าได้) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin", "User", "Staff", "admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
