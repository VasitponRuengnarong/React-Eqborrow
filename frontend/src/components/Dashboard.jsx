import React from "react";
import { Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Dashboard = ({ toggleSidebar }) => {
  return (
    <div className="dashboard">
      <div className="menu-toggle" onClick={toggleSidebar}>
        <Menu />
      </div>
      <h1>Dashboard</h1>
      <div className="dark-mode-toggle">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Dashboard;
