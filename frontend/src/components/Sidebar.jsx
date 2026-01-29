import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRightLeft,
  LogOut,
  Shield,
  Home,
  ShoppingBag,
  CheckSquare,
  Users,
  BarChart2,
  FileText,
  UserCircle,
  ChevronRight,
  ChevronLeft,
  History,
} from "lucide-react";
import "./Sidebar.css";
import { apiFetch } from "./api";

const defaultProfileImage = "/logo.png"; // Placeholder for profile image
const defaultLogo = "/logo.png"; // Placeholder for logo

const Sidebar = ({
  activeMenu,
  setActiveMenu,
  isSidebarOpen,
  toggleSidebar,
  isMobile,
}) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for user profile updates to refresh sidebar without a full page reload
  useEffect(() => {
    const handleUserUpdate = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const handleLogout = async () => {
    try {
      // เรียก API Logout เพื่อแจ้ง Server (ถ้ามี)
      await apiFetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken"); // Also remove accessToken
    window.location.href = "/login";
  };

  // ตรวจสอบ Token หมดอายุอัตโนมัติ (Auto Logout)
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        // Decode JWT Payload เพื่อดูค่า exp (expiration time)
        const payload = JSON.parse(atob(token.split(".")[1]));
        // ตรวจสอบว่าเวลาปัจจุบันเลยเวลาหมดอายุหรือยัง (exp หน่วยเป็นวินาที ต้อง * 1000 เป็น ms)
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          handleLogout();
        }
      } catch (e) {
        console.error("Error checking token expiration:", e);
      }
    };

    checkTokenExpiration(); // ตรวจสอบทันทีเมื่อ Mount
    const interval = setInterval(checkTokenExpiration, 60000); // ตรวจสอบซ้ำทุก 1 นาที

    return () => clearInterval(interval);
  }, []);

  const isAdmin = user?.role === "Admin" || user?.role === "admin";

  const menuItems = [
    ...(isAdmin
      ? [
          {
            id: "admin",
            label: "Admin Dashboard",
            icon: Shield,
            path: "/dashboard",
          },
        ]
      : [{ id: "home", label: "หน้าหลัก", icon: Home, path: "/dashboard" }]),
    // Admin-only menus
    ...(isAdmin
      ? [
          {
            id: "products",
            label: "สินค้า",
            icon: ShoppingBag,
            path: "/products",
          },
          {
            id: "approvals",
            label: "อนุมัติการยืม",
            icon: CheckSquare,
            path: "/approvals",
          },
          {
            id: "logs",
            label: "ประวัติการทำงาน",
            icon: History,
            path: "/logs",
          },
          { id: "members", label: "สมาชิก", icon: Users, path: "/members" }, // Corrected path
          {
            id: "inventory", // Corrected ID to match path
            label: "รายการคงเหลือ",
            icon: BarChart2,
            path: "/inventory",
          },
        ]
      : []),
    // General user menus (also visible to Admin)
    { id: "borrow", label: "ยืม-คืน", icon: ArrowRightLeft, path: "/borrow" }, // Corrected ID
    { id: "history", label: "รายการยืม-คืน", icon: FileText, path: "/history" }, // Corrected ID
    { id: "profile", label: "โปรไฟล์", icon: UserCircle, path: "/profile" }, // Corrected ID
  ];

  // คำนวณสถานะการแสดงผล: เปิดอยู่จริง หรือ แค่ Hover บน Desktop
  const isExpanded = isSidebarOpen || (isHovered && !isMobile);
  const isCollapsed = !isExpanded && !isMobile;

  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = menuItems.find((item) => item.path === currentPath);
    if (activeItem) {
      setActiveMenu(activeItem.id);
    }
  }, [location.pathname, isAdmin]);

  return (
    <div
      className={`sidebar ${isMobile ? "mobile" : "desktop"} ${isExpanded ? "open" : "closed"}`}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Collapse Toggle Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <img src="/logo.png" alt="Eqborrow Logo" />
        </div>
        <div className="logo-text">
          <div className="logo-main">Eqborrow</div>
          <div className="logo-sub">System</div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="sidebar-menu">
        <div className="menu-section-title">Menu</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              className={`menu-item ${isActive ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(item.id);
                navigate(item.path);
                if (isMobile) toggleSidebar(); // Close sidebar on mobile after navigation
              }}
            >
              <Icon className="menu-icon" size={20} />
              {!isCollapsed && <span className="menu-label">{item.label}</span>}
              {isActive && !isCollapsed && (
                <ChevronRight className="menu-arrow" size={16} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="user-profile-section">
          <div className="user-info">
            <div style={{ position: "relative" }}>
              <img
                src={user.profileImage || defaultProfileImage} // Use local default profile image
                alt="Profile"
                className="user-avatar"
              />
              <div className="online-indicator" />
            </div>
            {!isCollapsed && (
              <div className="user-details">
                <div className="user-name">
                  {user.firstName} {user.lastName}
                </div>
                <div className="user-role">{user.role}</div>
              </div>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut className="logout-icon" size={16} />
            {!isCollapsed && <span className="logout-text">ออกจากระบบ</span>}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
