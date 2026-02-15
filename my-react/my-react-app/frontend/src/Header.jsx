import React, { useState, useEffect, useRef } from "react";
import { Menu, User, LogOut, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "./context/NotificationContext";
import NotificationDropdown from "./components/NotificationDropdown";
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
  
  const { unreadCount } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

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

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (notifRef.current && !notifRef.current.contains(event.target)) {
            setShowNotifications(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
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
        
        {/* Notification Bell */}
        <div className="notification-wrapper" ref={notifRef} style={{ position: 'relative', cursor: 'pointer' }}>
            <div 
                className="notification-icon" 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: 'relative', padding: '8px', color: '#555' }}
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="badge" style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        backgroundColor: '#FF6B00',
                        color: 'white',
                        borderRadius: '50%',
                        fontSize: '10px',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        border: '2px solid white'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>
            {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
        </div>

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
