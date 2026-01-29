import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <label
      htmlFor="theme-toggle-switch"
      className="theme-toggle"
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <input
        id="theme-toggle-switch"
        type="checkbox"
        checked={isDarkMode}
        onChange={toggleTheme}
      />
      <span className="slider">
        <div className="icon-container">
          <Sun size={14} className="sun-icon" />
          <Moon size={14} className="moon-icon" />
        </div>
      </span>
    </label>
  );
};

export default ThemeToggle;
