import React, { useState, useEffect } from "react";
import { ArrowRightLeft } from "lucide-react";
import "./Sidebar.css";

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // ตรวจสอบว่าเป็น Admin หรือไม่ (รองรับทั้งตัวพิมพ์ใหญ่และเล็ก)
  const isAdmin = user?.role === "Admin" || user?.role === "admin";

  const menuItems = [
    ...(isAdmin ? [{ id: "admin", label: "Admin Dashboard", icon: "🛡️" }] : []),
    { id: "home", label: "หน้าหลัก", icon: "🏠" },
    // เมนูสำหรับ Admin เท่านั้น
    ...(isAdmin
      ? [
          { id: "products", label: "สินค้า", icon: "🛍️" },
          { id: "approvals", label: "อนุมัติการยืม", icon: "✅" },
          { id: "members", label: "สมาชิก", icon: "👥" },
          { id: "records", label: "รายการคงเหลือ", icon: "📊" },
        ]
      : []),
    // เมนูสำหรับผู้ใช้ทั่วไป (และ Admin ก็เห็นได้)
    { id: "settings", label: "ยืม-คืน", icon: <ArrowRightLeft size={20} /> },
    { id: "items", label: "รายการยืม-คืน", icon: "📑" },
    { id: "managers", label: "โปรไฟล์", icon: "👨‍💼" },
  ];

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">E</div>
        <div className="logo-text">
          <div className="logo-main">Eqborrow</div>
          <div className="logo-sub">E-PAYMENT ADMIN</div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activeMenu === item.id ? "active" : ""}`}
            onClick={() => {
              setActiveMenu(item.id);
            }}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile */}
      {user && (
        <div
          style={{
            padding: "15px 20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <img
            src={user.profileImage || "https://via.placeholder.com/40"}
            alt="Profile"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #ff8000",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{ color: "white", fontSize: "14px", fontWeight: "600" }}
            >
              {user.firstName} {user.lastName}
            </span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
              {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon">🚪</span>
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
