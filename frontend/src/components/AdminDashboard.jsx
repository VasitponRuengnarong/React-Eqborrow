import React, { useState, useEffect } from "react";
import {
  Box,
  Clock,
  AlertTriangle,
  CheckSquare,
  Activity,
  PieChart,
  Plus,
  Scan,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import { apiFetch } from "./api";
import LatestActivityWidget from "./LatestActivityWidget";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAssets: 0,
    currentlyBorrowed: 0,
    pendingApproval: 0,
    overdue: 0,
    recentActivity: [],
    pieChartData: [],
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await apiFetch("/api/dashboard/admin-stats");
        const alertsResponse = await apiFetch("/api/notifications/low-stock");

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setLowStockItems(alertsData);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // Helper function to render Pie Chart using SVG
  const renderPieChart = (data) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    let cumulativePercent = 0;

    if (total === 0) return <p className="no-data">ไม่มีข้อมูลสินค้า</p>;

    return (
      <svg
        viewBox="-1 -1 2 2"
        style={{ transform: "rotate(-90deg)", height: "100%", width: "100%" }}
        role="img"
        aria-label="กราฟวงกลมแสดงสัดส่วนสินค้าตามหมวดหมู่"
      >
        {data.map((slice, index) => {
          const startPercent = cumulativePercent;
          const slicePercent = slice.value / total;
          cumulativePercent += slicePercent;
          const endPercent = cumulativePercent;

          const x1 = Math.cos(2 * Math.PI * startPercent);
          const y1 = Math.sin(2 * Math.PI * startPercent);
          const x2 = Math.cos(2 * Math.PI * endPercent);
          const y2 = Math.sin(2 * Math.PI * endPercent);

          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

          const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} L 0 0`;

          return (
            <path
              key={index}
              d={pathData}
              fill={COLORS[index % COLORS.length]}
              className="pie-slice"
            >
              <title>{`${slice.name || "ไม่ระบุ"}: ${slice.value} รายการ`}</title>
            </path>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>ภาพรวมระบบและการจัดการ</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div className="notification-bell">
            <Bell size={24} color="#555" />
            {lowStockItems.length > 0 && (
              <span className="notification-badge">{lowStockItems.length}</span>
            )}
          </div>
          <div className="date-display">
            {new Date().toLocaleDateString("th-TH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue-light" aria-hidden="true">
            <Box size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Assets</h3>
            <p className="stat-value">{stats.totalAssets}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-orange-light" aria-hidden="true">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>Currently Borrowed</h3>
            <p className="stat-value">{stats.currentlyBorrowed}</p>
          </div>
        </div>

        <div
          className="stat-card clickable"
          onClick={() => navigate("/approvals")}
          style={{ cursor: "pointer" }}
        >
          <div className="stat-icon bg-purple-light" aria-hidden="true">
            <CheckSquare size={24} />
          </div>
          <div className="stat-info">
            <h3>Pending Approval</h3>
            <p className="stat-value">{stats.pendingApproval}</p>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
            aria-hidden="true"
          >
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: "#dc2626" }}>Overdue</h3>
            <p className="stat-value" style={{ color: "#dc2626" }}>
              {stats.overdue}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts">
        {/* Main Section: Recent Activity Table */}
        <div className="chart-card">
          <div className="chart-header">
            <Activity size={20} />
            <h2>Recent Activity</h2>
          </div>
          <div
            className="table-container"
            style={{ boxShadow: "none", padding: 0 }}
          >
            <table style={{ minWidth: "100%" }}>
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Equipment</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((item) => (
                    <tr key={item.BorrowID}>
                      <td>
                        {item.fname} {item.lname}
                      </td>
                      <td>{item.EquipmentName}</td>
                      <td>
                        {new Date(item.CreatedDate).toLocaleDateString("th-TH")}
                      </td>
                      <td>
                        <span
                          className={`status-dot ${
                            item.Status === "Approved"
                              ? "active"
                              : item.Status === "Pending"
                                ? "borrowed"
                                : item.Status === "Returned"
                                  ? "available"
                                  : "inactive"
                          }`}
                        >
                          {item.Status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">
                      No recent activity
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Quick Actions & Pie Chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* System Alerts Card */}
          {lowStockItems.length > 0 && (
            <div className="chart-card alert-card-container">
              <div className="chart-header">
                <AlertTriangle size={20} color="#dc2626" />
                <h2 style={{ color: "#dc2626" }}>Low Stock Alerts</h2>
              </div>
              <div className="alert-list">
                {lowStockItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="alert-item">
                    <span className="alert-name">{item.ProductName}</span>
                    <span className="alert-count">
                      เหลือ {item.AvailableCount}
                    </span>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <div className="alert-more">
                    +{lowStockItems.length - 5} more items
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="chart-card" style={{ minHeight: "auto" }}>
            <div className="chart-header">
              <h2>Quick Actions</h2>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => navigate("/products")}
              >
                <Plus size={18} /> Add New Asset
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => alert("Barcode Scanner feature coming soon!")}
              >
                <Scan size={18} /> Scan Barcode
              </button>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <PieChart size={20} />
              <h2>Available : Borrowed</h2>
            </div>
            <div className="pie-chart-container">
              <div className="pie-chart-wrapper">
                {renderPieChart(stats.pieChartData)}
              </div>
              <div className="chart-legend">
                {stats.pieChartData.map((item, index) => (
                  <div key={index} className="legend-item">
                    <span
                      className="legend-color"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    ></span>
                    <span className="legend-text">
                      {item.name || "ไม่ระบุ"}: <strong>{item.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
