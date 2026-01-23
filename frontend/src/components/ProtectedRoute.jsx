import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import "./ProtectedRoute.css";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();

  if (!user) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but role not authorized, show access denied
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <ShieldAlert size={64} className="unauthorized-icon" />
          <h1>Access Denied</h1>
          <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (Role: {user.role})</p>
          <Link to="/" className="back-home-btn">
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
