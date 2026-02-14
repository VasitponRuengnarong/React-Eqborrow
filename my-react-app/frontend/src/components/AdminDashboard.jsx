import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import StatsCard from "./StatsCard";
import ProductManagement from "./ProductManagement";
import PendingRequests from "./PendingRequests";
import MemberManagement from "./MemberManagement";
import BorrowReturn from "./BorrowReturn";
import BorrowHistory from "./BorrowHistory";
import UserProfile from "./UserProfile";
import Records from "./Records";
import { Users, Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("home");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBorrows: 0,
    pendingRequest: 0,
    returnedItems: 0,
    overdueCount: 0,
    monthlyStats: [],
    statusStats: [],
    overdueList: [],
  });

  useEffect(() => {
    if (activeMenu === "home") {
      fetchDashboardStats();
    }
  }, [activeMenu]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const renderContent = () => {
    switch (activeMenu) {
      case "home":
        return (
          <div className="dashboard-home">
            <div className="stats-grid">
              <StatsCard
                icon={Users}
                color="#3498db"
                title="ผู้ใช้งานทั้งหมด"
                value={stats.totalUsers}
              />
              <StatsCard
                icon={Package}
                color="#e67e22"
                title="รายการยืมทั้งหมด"
                value={stats.totalBorrows}
              />
              <StatsCard
                icon={Clock}
                color="#f1c40f"
                title="รออนุมัติ"
                value={stats.pendingRequest}
              />
              <StatsCard
                icon={CheckCircle}
                color="#2ecc71"
                title="คืนแล้ว"
                value={stats.returnedItems}
              />
              <StatsCard
                icon={AlertCircle}
                color="#e74c3c"
                title="คืนล่าช้า"
                value={stats.overdueCount}
              />
            </div>

            <div className="charts-container">
              <div className="chart-card">
                <h3>สถิติการยืมรายเดือน</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="จำนวนการยืม" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <h3>สถานะการยืม</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.statusStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.statusStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Overdue Items Widget */}
              <div className="chart-card full-width">
                <div className="card-header-flex">
                  <h3>รายการที่คืนล่าช้า (Overdue)</h3>
                  <span className="badge danger">
                    {stats.overdueCount} รายการ
                  </span>
                </div>
                {stats.overdueList.length === 0 ? (
                  <p className="no-data">ไม่มีรายการคืนล่าช้าในขณะนี้</p>
                ) : (
                  <div className="table-responsive">
                    <table className="overdue-table">
                      <thead>
                        <tr>
                          <th>ผู้ยืม</th>
                          <th>กำหนดคืน</th>
                          <th>อุปกรณ์</th>
                          <th>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.overdueList.map((item) => (
                          <tr key={item.BorrowID}>
                            <td>
                              <div className="user-info-cell">
                                <span className="user-name">
                                  {item.fname} {item.lname}
                                </span>
                                <span className="user-id">
                                  {item.EMP_NUM} | {item.DepartmentName}
                                </span>
                              </div>
                            </td>
                            <td className="text-danger">
                              {new Date(item.ReturnDate).toLocaleDateString(
                                "th-TH",
                              )}
                            </td>
                            <td className="items-cell">
                              {item.items.map((i) => i.ItemName).join(", ")}
                            </td>
                            <td>
                              <span className="badge danger">เกินกำหนด</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "units":
        return (
          <div className="dashboard-card">
            <h2>หมวดหมู่สินค้า</h2>
            <p>จัดการหมวดหมู่สินค้าที่นี่</p>
          </div>
        );
      case "products":
        return <ProductManagement />;
      case "approvals":
        return <PendingRequests />;
      case "members":
        return <MemberManagement />;
      case "settings":
        return <BorrowReturn />;
      case "items":
        return <BorrowHistory />;
      case "managers":
        return <UserProfile />;
      case "records":
        return <Records />;
      default:
        return (
          <div className="dashboard-card">
            <h2>{activeMenu}</h2>
            <p>ส่วนนี้กำลังอยู่ระหว่างการพัฒนา</p>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <div className="header-actions">
            {/* Add header actions like notifications here */}
          </div>
        </header>
        <main className="dashboard-main">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
