// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage"; // Import หน้า ProfilePage
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
import AllDevices from "./components/AllDevices";
import BorrowHistory from "./components/BorrowHistory";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<ProfilePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/all-devices" element={<AllDevices />} />
          <Route path="/borrow-history" element={<BorrowHistory />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
