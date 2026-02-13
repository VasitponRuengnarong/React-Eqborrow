import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Search, Bell, ChevronRight } from "lucide-react";
import "./Header.css";

const defaultProfileImage = "/images/logo.png";

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lazy initialize user state to prevent flickering
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- New State for Functionality ---
  const [searchText, setSearchText] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch Notifications from Backend
  const fetchNotifications = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!storedUser || !token) return;

      const response = await fetch("http://localhost:8080/api/nav-notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    console.log("Searching for:", searchText);
    // Future: Implement actual search routing or filtering
    // navigate(`/dashboard?search=${searchText}`);
  };

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
        <div className={`notification-wrapper ${notifications.length > 0 ? "has-unread" : ""}`}>
          <button 
            className={`notification-btn ${showNotifications ? "active" : ""}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} className={notifications.length > 0 ? "bell-shake" : ""} />
            {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <button className="mark-read-btn" onClick={() => setNotifications([])}>Mark all read</button>
              </div>
              <div className="dropdown-content">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notification-item unread ${
                        notif.message.includes('low stock') ? 'alert' : 
                        notif.message.includes('Pending') ? 'info' : 'success'
                      }`}
                    >
                      <div className="notif-icon">
                        {notif.message.includes('low stock') ? '⚠️' : 
                         notif.message.includes('Pending') ? '📦' : '↩️'}
                      </div>
                      <div className="notif-text">
                        <p className="notif-msg">{notif.message}</p>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-notif" style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <p style={{ fontSize: '13px' }}>No new notifications</p>
                  </div>
                )}
              </div>
            </div>
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
