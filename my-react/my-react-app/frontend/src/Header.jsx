import React, { useState, useEffect } from "react";
import { Menu, User, LogOut } from "lucide-react";
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

  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header>
      <div className="menu-toggle" onClick={toggleSidebar}>
        <Menu />
      </div>

      <div className="header-time">{currentTime.toLocaleTimeString()}</div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        <div 
          className="user-profile-container" 
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="user-profile" onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}>
            <img
              src={user?.profileImage || defaultProfileImage}
              className="profile-image"
              alt="User Profile"
            />
            <span>{user ? `${user.firstName} ${user.lastName}` : "ผู้ใช้งาน"}</span>
          </div>

          {showDropdown && (
            <div className="profile-dropdown">
              <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}>
                <User size={16} /> โปรไฟล์
              </button>
              
              <div className="dropdown-divider"></div>

              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={16} /> ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
