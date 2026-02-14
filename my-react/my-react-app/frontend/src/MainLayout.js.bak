import React, { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./App.css";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("home");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          marginLeft: isMobile ? 0 : isSidebarOpen ? "280px" : "80px",
          flexDirection: "column",
          position: "relative",
          overflowY: "auto",
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Header toggleSidebar={toggleSidebar} />

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>

        {/* Overlay สำหรับมือถือ */}
        {isSidebarOpen && isMobile && (
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
            onClick={toggleSidebar}
          />
        )}
      </div>
    </div>
  );
};

export default MainLayout;
