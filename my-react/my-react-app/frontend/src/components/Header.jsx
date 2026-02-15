import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Bell, ChevronRight } from "lucide-react";
import { useNotification } from "../context/NotificationContext"; // Import Context
import "./Header.css";
import NotificationDropdown from "./NotificationDropdown";

const defaultProfileImage = "/images/logo.png";

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, fetchNotifications } = useNotification(); // Use Context
  
  // Lazy initialize user state to prevent flickering
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- New State for Functionality ---
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initial fetch on mount (Context handles polling, but we can trigger one on mount too if needed)
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
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

  // Determine page title based on path
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case "/dashboard": return "Dashboard";
      case "/borrow": return "Borrow Request";
      case "/history": return "History";
      case "/profile": return "Profile";
      default: return "Dashboard";
    }
  };

  return (
    <header className="header-glass">
      {/* Left Section: Menu & Breadcrumbs */}
      <div className="header-left">
        <div className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} />
        </div>
        <div className="header-breadcrumbs">
          <span className="breadcrumb-item">Eqborrow</span>
          <ChevronRight size={16} className="breadcrumb-separator" />
          <span className="breadcrumb-current">{getPageTitle(location.pathname)}</span>
        </div>
      </div>


      {/* Right Section: Time, Notifications, Profile */}
      <div className="header-right">
        <div className="header-time">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        
        {/* Notification Bell */}
        <div 
          className={`notification-wrapper ${unreadCount > 0 ? "has-unread" : ""}`}
          ref={notificationRef}
        >
          <button 
            className={`notification-btn ${showNotifications ? "active" : ""}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} className={unreadCount > 0 ? "bell-shake" : ""} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* User Profile */}
        <div 
          className="user-profile" 
          onClick={() => navigate("/profile")}
          style={{ cursor: "pointer" }}
          title="Go to Profile"
        >
          <img
            src={user?.profileImage || defaultProfileImage}
            alt="User Profile"
          />
          {/* User Info is hidden on mobile via CSS, shown on desktop */}
          <div className="header-user-info">
             <span className="user-name">{user ? `${user.firstName}` : "Guest"}</span>
             <ChevronRight size={14} className="profile-arrow" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
