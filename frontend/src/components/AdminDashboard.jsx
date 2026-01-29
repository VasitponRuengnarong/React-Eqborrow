import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingBag,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  PieChart,
} from "lucide-react";
import "./AdminDashboard.css";
import { apiFetch } from "./api";

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
    totalUsers: 0,
    totalBorrows: 0,
    pendingRequest: 0,
    returnedItems: 0,
    monthlyStats: [],
    statusStats: [],
    categoryStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await apiFetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
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
        <div className="date-display">
          {new Date().toLocaleDateString("th-TH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users" aria-hidden="true">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>สมาชิกทั้งหมด</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon borrows" aria-hidden="true">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-info">
            <h3>การยืมทั้งหมด</h3>
            <p className="stat-value">{stats.totalBorrows}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending" aria-hidden="true">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>รออนุมัติ</h3>
            <p className="stat-value">{stats.pendingRequest}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon returned" aria-hidden="true">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>คืนแล้ว</h3>
            <p className="stat-value">{stats.returnedItems}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <div className="chart-header">
            <TrendingUp size={20} />
            <h2>สถิติการยืมรายเดือน (6 เดือนล่าสุด)</h2>
          </div>
          <div className="bar-chart">
            {stats.monthlyStats.length > 0 ? (
              stats.monthlyStats.map((item, index) => {
                const max = Math.max(
                  ...stats.monthlyStats.map((i) => i.count),
                  1,
                );
                const height = (item.count / max) * 100;
                return (
                  <div key={index} className="bar-item">
                    <div className="bar-fill-wrapper">
                      <div
                        className="bar-fill"
                        style={{ height: `${height}%` }}
                        role="img"
                        aria-label={`เดือน ${item.name} มีการยืม ${item.count} รายการ`}
                      ></div>
                      <div className="bar-tooltip">{item.count} รายการ</div>
                    </div>
                    <span className="bar-label">{item.name}</span>
                  </div>
                );
              })
            ) : (
              <p className="no-data">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <Activity size={20} />
            <h2>สถานะการยืมทั้งหมด</h2>
          </div>
          <div className="status-list">
            {stats.statusStats.map((item, index) => (
              <div key={index} className="status-item">
                <div className="status-info">
                  <span className="status-name">{item.name}</span>
                  <span className="status-count">{item.value} รายการ</span>
                </div>
                <div className="status-bar-bg">
                  <div
                    className={`status-bar-fill ${item.name.toLowerCase()}`}
                    style={{
                      width: `${(item.value / stats.totalBorrows) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Pie Chart Card */}
        <div className="chart-card">
          <div className="chart-header">
            <PieChart size={20} />
            <h2>สัดส่วนสินค้าตามหมวดหมู่</h2>
          </div>
          <div className="pie-chart-container">
            <div className="pie-chart-wrapper">
              {renderPieChart(stats.categoryStats)}
            </div>
            <div className="chart-legend">
              {stats.categoryStats.map((item, index) => (
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
  );
};

export default AdminDashboard;
