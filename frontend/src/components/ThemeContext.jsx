import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

// ชุดสีสำหรับกราฟและ UI ในโหมดต่างๆ
const themeColors = {
  light: {
    primary: "#ff8000",
    secondary: "#3b82f6",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    text: "#374151",
    grid: "#e5e7eb",
    background: "#ffffff",
    tooltipBg: "#ffffff",
  },
  dark: {
    primary: "#ff9f43", // สีส้มที่สว่างขึ้นสำหรับพื้นหลังเข้ม
    secondary: "#60a5fa",
    success: "#4ade80",
    warning: "#fbbf24",
    danger: "#f87171",
    text: "#d1d5db",
    grid: "#374151",
    background: "#1f2937",
    tooltipBg: "#111827",
  },
};

export const ThemeProvider = ({ children }) => {
  // 1. กำหนดค่าเริ่มต้น: เช็ค localStorage ก่อน -> ถ้าไม่มีเช็ค System Preference -> ถ้าไม่มีใช้ false (Light)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  // 2. Effect: เมื่อ isDarkMode เปลี่ยน ให้ update class ที่ body และบันทึก localStorage
  useEffect(() => {
    const root = document.body;
    if (isDarkMode) {
      root.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const theme = isDarkMode ? themeColors.dark : themeColors.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
