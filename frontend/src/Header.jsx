import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
const defaultProfileImage = "/logo.png"; // Placeholder for profile image

const Header = ({ toggleSidebar }) => {
  // Lazy initialize user state to prevent flickering
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();


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

      <div className="user-profile" onClick={() => navigate("/profile")}>
        <img
          src={user?.profileImage || defaultProfileImage}
          className="profile-image"
          alt="User Profile"
        />
        <span>{user ? `${user.firstName} ${user.lastName}` : "ผู้ใช้งาน"}</span>
      </div>
    </header>
  );
};

export default Header;
