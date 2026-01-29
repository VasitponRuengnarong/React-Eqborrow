import React, { useState, useEffect } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import "./Header.css";
const defaultProfileImage = "/logo.png"; // Placeholder for profile image

const Header = ({ toggleSidebar, toggleDarkMode, isDarkMode }) => {
  // Lazy initialize user state to prevent flickering
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for user profile updates to refresh header without a full page reload
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

  return (
    <header>
      <div className="menu-toggle" onClick={toggleSidebar}>
        <Menu />
      </div>

      <div className="header-time">{currentTime.toLocaleTimeString()}</div>

      <div className="user-profile">
        {/* ปุ่มเปลี่ยน Dark Mode */}
        <button onClick={toggleDarkMode} className="theme-toggle-btn">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <img
          src={user?.profileImage || defaultProfileImage}
          alt="User Profile"
        />
        <span>{user ? `${user.firstName} ${user.lastName}` : "ผู้ใช้งาน"}</span>
      </div>
    </header>
  );
};

export default Header;
