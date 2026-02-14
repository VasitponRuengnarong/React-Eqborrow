import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldAlert, Home, LogOut } from "lucide-react";
import "./AccessDenied.css";
import { apiFetch } from "./api";

const AccessDenied = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (user?.id) {
      const attemptedPath = location.state?.from?.pathname || "Unknown path";
      apiFetch("/api/logs/access-denied", {
        method: "POST",
        body: JSON.stringify({ path: attemptedPath }),
      }).catch((err) => console.error("Log error:", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="icon-wrapper">
          <ShieldAlert size={64} color="#dc2626" />
        </div>
        <h1>Access Denied</h1>
        <p className="error-message">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>

        {user.role && (
          <div className="user-role-info">
            <span>สิทธิ์ของคุณคือ: </span>
            <span className="role-badge">{user.role}</span>
          </div>
        )}

        <p className="suggestion-text">
          หากคุณคิดว่านี่เป็นข้อผิดพลาด โปรดติดต่อผู้ดูแลระบบ
          หรือลองเข้าสู่ระบบด้วยบัญชีอื่น
        </p>

        <div className="action-buttons">
          <button className="btn-home" onClick={() => navigate("/dashboard")}>
            <Home size={18} /> กลับสู่หน้าหลัก
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
