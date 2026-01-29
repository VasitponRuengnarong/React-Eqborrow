import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./App.css";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Detect mobile initially

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // คุณอาจจะเพิ่ม logic การเปลี่ยน theme จริงๆ ที่นี่
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isSidebarOpen={isSidebarOpen} // Pass isSidebarOpen
        toggleSidebar={toggleSidebar} // Pass toggle function
        isMobile={isMobile} // Pass isMobile to Sidebar
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          marginLeft: isMobile ? 0 : isSidebarOpen ? "280px" : "80px", // Adjust margin based on sidebar state
          flexDirection: "column",
          position: "relative",
          overflowY: "auto", // Allow main content to scroll
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // Smooth transition for content shift
        }}
      >
        <Header
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode}
          isDarkMode={isDarkMode}
        />

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>

        {/* Overlay สำหรับปิด Sidebar บนมือถือ */}
        {isSidebarOpen &&
          isMobile && ( // Only show overlay on mobile when sidebar is open
            <div
              className="sidebar-overlay"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.5)",
                zIndex: 900,
              }}
              onClick={toggleSidebar} // Close sidebar when clicking overlay
            />
          )}
      </div>
    </div>
  );
};

export default MainLayout;
