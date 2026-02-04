import React from "react";
import "./App.css";
import "./Theme.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// --- Components ---
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./MainLayout";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import ProductManagement from "./components/ProductManagement";
import BorrowReturn from "./components/BorrowReturn";
import BorrowHistory from "./components/BorrowHistory";
import UserProfile from "./components/UserProfile";
import MemberManagement from "./components/MemberManagement";
import ApprovalPage from "./components/ApprovalPage.jsx";
import ActivityLogPage from "./components/ActivityLogPage.jsx";
import AccessDenied from "./components/AccessDenied";

// --- Context ---
import { ThemeProvider } from "./ThemeContext";

const DashboardResolver = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.role === "Admin") {
    return <AdminDashboard />;
  }
  return <UserDashboard />;
};

function App() {
  return (
    // 1. ThemeProvider ต้องอยู่ชั้นนอกสุด
    <ThemeProvider>
      <Router>
        <Routes>
          {/* --- Public Routes (เข้าได้ไม่ต้อง Login) --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* --- Protected Routes (ต้อง Login + มี Sidebar/Header) --- */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["Admin", "User", "Staff", "Manager"]}
              >
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Route ลูกเหล่านี้จะไปโผล่ใน <Outlet /> ของ MainLayout */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardResolver />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="approvals" element={<ApprovalPage />} />
            <Route path="logs" element={<ActivityLogPage />} />
            <Route path="members" element={<MemberManagement />} />
            <Route path="borrow" element={<BorrowReturn />} />
            <Route path="history" element={<BorrowHistory />} />
            <Route path="profile" element={<UserProfile />} />

            {/* Catch All: หน้าที่ไม่เจอในระบบ ให้แสดง 404 */}
            <Route
              path="*"
              element={
                <div className="p-10 text-center">
                  <h1>404 Page Not Found</h1>
                </div>
              }
            />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
