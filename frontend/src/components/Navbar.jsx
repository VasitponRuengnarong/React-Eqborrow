import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    // เนื่องจากยังไม่มีหน้า Login ให้รีเฟรชหน้าจอหรือกลับไปหน้าแรก
    window.location.href = "/";
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          EqBorrow
        </Link>
        <ul className="navbar-menu">
          <li>
            <Link
              to="/"
              className={`navbar-item ${location.pathname === "/" ? "active" : ""}`}
            >
              โปรไฟล์
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className={`navbar-item ${location.pathname === "/dashboard" ? "active" : ""}`}
            >
              แดชบอร์ด
            </Link>
          </li>
          <li>
            <Link
              to="/all-devices"
              className={`navbar-item ${location.pathname === "/all-devices" ? "active" : ""}`}
            >
              อุปกรณ์ทั้งหมด
            </Link>
          </li>
          <li>
            <Link
              to="/borrow-history"
              className={`navbar-item ${location.pathname === "/borrow-history" ? "active" : ""}`}
            >
              ประวัติการยืม
            </Link>
          </li>
        </ul>

        <div className="navbar-right">
          {user && (
            <>
              <span className="navbar-user">
                {user.firstName} {user.lastName}
              </span>
              <button onClick={handleLogout} className="btn-logout">
                ออกจากระบบ
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
