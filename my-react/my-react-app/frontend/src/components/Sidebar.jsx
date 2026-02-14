import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRightLeft,
  LogOut,
  Shield,
  Home,
  ShoppingBag,
  CheckSquare,
  Users,
  FileText,
  UserCircle,
  ChevronRight,
  ChevronLeft,
  History,
  Moon,
  Sun,
} from "lucide-react";
import "./Sidebar.css";
import { apiFetch } from "./api";

const defaultProfileImage = "/images/logo.png"; // Placeholder for profile image

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

  const menuItems = useMemo(
    () => [
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
          ]
        : []),
      // General user menus (also visible to Admin)
      { id: "borrow", label: "ยืม-คืน", icon: ArrowRightLeft, path: "/borrow" }, // Corrected ID
      {
        id: "history",
        label: "รายการยืม-คืน",
        icon: FileText,
        path: "/history",
      }, // Corrected ID
      { id: "profile", label: "โปรไฟล์", icon: UserCircle, path: "/profile" }, // Corrected ID
    ],
    [isAdmin],
  );

  // คำนวณสถานะการแสดงผล: เปิดอยู่จริง หรือ แค่ Hover บน Desktop
  const isExpanded = isSidebarOpen || (isHovered && !isMobile);

  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = menuItems.find((item) => item.path === currentPath);
    if (activeItem) {
      setActiveMenu(activeItem.id);
    }
  }, [location.pathname, menuItems, setActiveMenu]);

  return (
    <div
      className={`sidebar ${isMobile ? "mobile" : "desktop"} ${isExpanded ? "open" : "closed"}`}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Collapse Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        title={isSidebarOpen ? "ย่อแถบเมนู" : "ขยายแถบเมนู"}
      >
        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <img src="/images/logob.png" alt="Eqborrow Logo" />
        </div>
        <div className="logo-text">
          <div className="logo-main">Eqborrow</div>
          <div className="logo-sub">System</div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="sidebar-menu">
        <div className="menu-section-title">Main Menu</div>
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
              title={item.label}
            >
              <Icon className="menu-icon" size={20} />
              {!isMobile && <span className="menu-label">{item.label}</span>}
              {isActive && <ChevronRight className="menu-arrow" size={16} />}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="user-profile-section">
          <div
            className="user-info"
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
            title="ไปที่หน้าโปรไฟล์"
          >
            <div className="avatar-container">
              <img /* Add transition for background-color, border-color */
                src={user.profileImage || defaultProfileImage} // Use local default profile image
                alt="Profile"
                className="user-avatar"
              />
              <div className="online-indicator" />
            </div>
            <div className="user-details">
              <div className="user-name-sidebar" style={{ color: "#fff", fontWeight: "bold" }}>
                {user.firstName} {user.lastName}
              </div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>



          <button
            className="logout-btn"
            onClick={handleLogout}
            title="ออกจากระบบ"
          >
            <LogOut className="logout-icon" size={16} />
            <span className="logout-text">ออกจากระบบ</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(Sidebar);
