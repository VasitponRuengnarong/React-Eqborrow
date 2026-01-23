import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';

const Header = ({ toggleSidebar, toggleDarkMode, isDarkMode }) => {
  return (
    <header>
      <div className="menu-toggle" onClick={toggleSidebar}>
        <Menu />
      </div>

      <div className="header-time">
        {new Date().toLocaleTimeString()}
      </div>

      <div className="user-profile">
        {/* ปุ่มเปลี่ยน Dark Mode */}
        <button 
          onClick={toggleDarkMode} 
          className="btn btn-sm" 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '10px' }}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <img src="https://via.placeholder.com/40" alt="User" />
        <span>Admin User</span>
      </div>
    </header>
  );
};

export default Header;