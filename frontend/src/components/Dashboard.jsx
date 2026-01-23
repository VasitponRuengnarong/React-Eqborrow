import React from "react";
import { Menu, Moon, Sun } from "lucide-react";

const Dashboard = ({ toggleSidebar, toggleDarkMode, isDarkMode }) => {
  return (
    <div className="dashboard">
      <div className="menu-toggle" onClick={toggleSidebar}>
        <Menu />
      </div>
      <h1>Dashboard</h1>
      <div className="dark-mode-toggle">
        <button
          onClick={toggleDarkMode}
          className="btn btn-sm"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
