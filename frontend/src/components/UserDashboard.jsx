import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Package,
  AlertCircle,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { apiFetch } from "./api";
import "./UserDashboard.css";
import EquipmentLoop from "./EquipmentLoop";

const UserDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user] = useState(JSON.parse(localStorage.getItem("user")));
  const navigate = useNavigate();

  const [userStats, setUserStats] = useState({
    itemsOnHand: 0,
    dueSoon: 0,
    pendingRequests: 0,
    totalHistory: 0,
    currentLoans: [],
    history: [],
    statusDistribution: [], // { name: 'Pending', value: 5 }
  });

  const COLORS = {
    Pending: "#f59e0b",
    Approved: "#10b981",
    Returned: "#3b82f6",
    Rejected: "#ef4444",
  };

  useEffect(() => {
    if (user) {
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const response = await apiFetch("/api/dashboard/user-stats");
      if (response.ok) {
        const data = await response.json();
        
        // Calculate status distribution for Pie Chart
        const statusCounts = {};
        // Combine history and current loans to get overall status trends if needed, 
        // or just use history for "My Requests" breakdown. 
        // For this demo, let's assume 'history' contains all requests including pending/rejected
        const allRequests = [...data.currentLoans, ...data.history]; 
        
        allRequests.forEach(item => {
           // If API doesn't return status name directly, we might need to map it.
           // Assuming data has 'StatusName' or similar. 
           // If not, we'll simplify for now based on context.
           const status = item.StatusName || (item.ReturnDate ? "Returned" : "Active"); 
           statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        // Mock data for chart if real data is sparse for demo
        const chartData = [
          { name: "Active", value: data.itemsOnHand },
          { name: "Returned", value: data.history.length },
          { name: "Pending", value: data.pendingRequests },
        ].filter(item => item.value > 0);

        setUserStats({
          ...data,
          totalHistory: data.history.length,
          statusDistribution: chartData
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (returnDate) => {
    if (!returnDate) return 0;
    const today = new Date();
    const due = new Date(returnDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProgressColor = (days) => {
    if (days < 0) return "#ef4444"; // Red (Overdue)
    if (days <= 2) return "#f97316"; // Orange (Due Soon)
    return "#10b981"; // Green (Safe)
  };

  const getProgressPercentage = (returnDate, borrowDate) => {
    if (!returnDate || !borrowDate) return 100;
    const start = new Date(borrowDate).getTime();
    const end = new Date(returnDate).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const current = now - start;
    const percent = (current / total) * 100;
    return Math.min(Math.max(percent, 0), 100);
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="user-dashboard fade-in">
      {/* Background Decorative Blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      {/* 1. Header Section */}
      <div className="dashboard-header-premium stagger-1">
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>สวัสดี, {user?.firstName || "User"} </h1>
            <p>ยินดีต้อนรับสู่ระบบจัดการอุปกรณ์</p>
          </div>
          <div className="date-badge-premium">
            <Calendar size={18} />
            <span>
              {new Date().toLocaleDateString("th-TH", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="showcase-section stagger-2">
        <EquipmentLoop />
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="stats-grid-premium stagger-3">
        <div className="stat-card-premium primary">
          <Package className="stat-card-icon" />
          <h3>อุปกรณ์ที่ยืมอยู่</h3>
          <p className="value">{userStats.itemsOnHand}</p>
          <p className="sub-text">Items Active</p>
        </div>
        <div className="stat-card-premium warning">
          <AlertCircle className="stat-card-icon" />
          <h3>ต้องคืนเร็วๆ นี้</h3>
          <p className="value">{userStats.dueSoon}</p>
          <p className="sub-text">Due within 2 days</p>
        </div>
        <div className="stat-card-premium danger">
          <Clock className="stat-card-icon" />
          <h3>รออนุมัติ</h3>
          <p className="value">{userStats.pendingRequests}</p>
          <p className="sub-text">Pending Requests</p>
        </div>
        <div className="stat-card-premium success">
          <CheckCircle2 className="stat-card-icon" />
          <h3>ประวัติการยืม</h3>
          <p className="value">{userStats.totalHistory}</p>
          <p className="sub-text">Total Completed</p>
        </div>
      </div>

      {/* 3. Main Content Layout */}
      <div className="dashboard-main-layout stagger-4">
        {/* Left Column: Active Loans */}
        <div className="active-loans-section">
          <div className="section-header">
            <h2>
              <TrendingUp size={24} className="text-blue-500" />
              รายการที่ยืมอยู่ในปัจจุบัน
            </h2>
          </div>

          <div className="loans-grid">
            {userStats.currentLoans.length === 0 ? (
              <div className="empty-state-visual glass-panel">
                <Package className="empty-state-icon" />
                <h3>ไม่มีรายการยืมในขณะนี้</h3>
                <p>คุณสามารถเริ่มยืมอุปกรณ์ได้จากหน้า "ยืมอุปกรณ์"</p>
                <button 
                  onClick={() => navigate("/borrow")}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition"
                >
                  ยืมอุปกรณ์ใหม่
                </button>
              </div>
            ) : (
              userStats.currentLoans.map((loan) => {
                const daysLeft = getDaysRemaining(loan.ReturnDate);
                const progress = getProgressPercentage(loan.ReturnDate, loan.BorrowDate);
                const progressColor = getProgressColor(daysLeft);

                return (
                  <div key={loan.BorrowID + loan.ItemName} className="loan-card-premium animate-enter">
                    <div className="loan-img-wrapper">
                      <img
                        src={loan.Image || "/images/logo.png"}
                        alt={loan.ItemName}
                      />
                    </div>
                    <div className="loan-info-flex">
                      <h4>{loan.ItemName}</h4>
                      <span className="loan-asset-code">#{loan.AssetCode}</span>
                      
                      {/* Progress Bar for Time Remaining */}
                      <div className="progress-container">
                        <div className="progress-label">
                          <span>
                            {daysLeft < 0 ? "เกินกำหนด" : "เหลือเวลา"}
                          </span>
                          <span style={{ color: progressColor, fontWeight: "bold" }}>
                            {daysLeft < 0 
                              ? `${Math.abs(daysLeft)} วัน` 
                              : `${daysLeft} วัน`}
                          </span>
                        </div>
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: `${Math.min(progress, 100)}%`,
                              backgroundColor: progressColor 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Charts & Quick Status */}
        <div className="charts-column glass-panel">
          <div className="chart-container-premium">
            <h3 className="chart-header-title">ภาพรวมสถานะคำขอ</h3>
            
            <div className="chart-visual-wrapper">
              <div style={{ width: "100%", height: 250, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userStats.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {userStats.statusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[entry.name] || "#cbd5e1"} 
                          style={{ filter: `drop-shadow(0px 4px 10px ${COLORS[entry.name]}44)` }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label inside Donut */}
                <div className="chart-center-label">
                  <span className="label-total">{userStats.totalHistory + userStats.pendingRequests + userStats.itemsOnHand}</span>
                  <span className="label-text">คำขอทั้งหมด</span>
                </div>
              </div>
            </div>

            <div className="custom-legend-pro">
              {userStats.statusDistribution.map((entry) => {
                const total = userStats.totalHistory + userStats.pendingRequests + userStats.itemsOnHand;
                const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                
                return (
                  <div key={entry.name} className="legend-row">
                    <div className="legend-info">
                      <div 
                        className="legend-dot" 
                        style={{ backgroundColor: COLORS[entry.name] || "#cbd5e1" }}
                      ></div>
                      <span className="legend-name">{entry.name}</span>
                    </div>
                    <div className="legend-values">
                      <span className="legend-count">{entry.value}</span>
                      <span className="legend-percent">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
