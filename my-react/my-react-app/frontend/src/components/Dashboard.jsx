import React, { useState, useEffect } from "react";
import { apiFetch } from "./api"; // ตรวจสอบ path ให้ถูกต้อง
import "./Dashboard.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Box,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingUp,
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // สีสำหรับกราฟ Pie Chart
  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchStats(parsedUser.role);
    }
  }, []);

  const fetchStats = async (role) => {
    try {
      const endpoint =
        role === "Admin"
          ? "/api/dashboard/admin-stats"
          : "/api/dashboard/user-stats";

      const response = await apiFetch(endpoint);
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

  if (loading)
    return <div className="p-8 text-center">กำลังโหลดข้อมูล Dashboard...</div>;
  if (!stats) return <div className="p-8 text-center">ไม่พบข้อมูล</div>;

  // --- ส่วนแสดงผลสำหรับ Admin ---
  if (user?.role === "Admin") {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>ภาพรวมระบบ (Admin Dashboard)</h2>
          <p>สถิติการยืม-คืนและสถานะอุปกรณ์ทั้งหมด</p>
        </div>

        {/* Alert Card Container */}
        <div className="alert-card-container">
          <div className="alert-card">
            <div className="card-info">
              <h3>อุปกรณ์ทั้งหมด</h3>
              <div className="card-value">{stats.totalAssets}</div>
            </div>
            <div className="card-icon bg-blue-100 text-blue-600">
              <Box />
            </div>
          </div>
          <div className="alert-card">
            <div className="card-info">
              <h3>กำลังถูกยืม</h3>
              <div className="card-value">{stats.currentlyBorrowed}</div>
            </div>
            <div className="card-icon bg-yellow-100 text-yellow-600">
              <TrendingUp />
            </div>
          </div>
          <div className="alert-card">
            <div className="card-info">
              <h3>รออนุมัติ</h3>
              <div className="card-value">{stats.pendingApproval}</div>
            </div>
            <div className="card-icon bg-orange-100 text-orange-600">
              <Clock />
            </div>
          </div>
          <div className="alert-card">
            <div className="card-info">
              <h3>เกินกำหนดคืน</h3>
              <div className="card-value text-red-600">{stats.overdue}</div>
            </div>
            <div className="card-icon bg-red-100 text-red-600">
              <AlertTriangle />
            </div>
          </div>
        </div>

        {/* Chart Cards */}
        <div className="chart-grid">
          <div className="chart-card">
            <h3>สถานะอุปกรณ์ (ว่าง vs ถูกยืม)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div
            className="chart-card recent-activity-card"
            style={{ height: "auto", minHeight: "400px" }}
          >
            <h3>กิจกรรมล่าสุด</h3>
            <div className="overflow-y-auto max-h-[320px]">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.BorrowID} className="activity-item">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-800">
                        {activity.fname} {activity.lname}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          activity.Status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : activity.Status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {activity.Status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.EquipmentName}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.CreatedDate).toLocaleString("th-TH")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 mt-4">
                  ไม่มีกิจกรรมล่าสุด
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ส่วนแสดงผลสำหรับ User ทั่วไป ---
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>สวัสดี, {user.firstName}</h2>
        <p>ข้อมูลการยืม-คืนของคุณ</p>
      </div>

      <div className="alert-card-container">
        <div className="alert-card">
          <div className="card-info">
            <h3>อุปกรณ์ที่ถือครอง</h3>
            <div className="card-value">{stats.itemsOnHand}</div>
          </div>
          <div className="card-icon bg-blue-100 text-blue-600">
            <Box />
          </div>
        </div>
        <div className="alert-card">
          <div className="card-info">
            <h3>ครบกำหนดคืนเร็วๆ นี้</h3>
            <div className="card-value text-orange-600">{stats.dueSoon}</div>
          </div>
          <div className="card-icon bg-orange-100 text-orange-600">
            <Clock />
          </div>
        </div>
        <div className="alert-card">
          <div className="card-info">
            <h3>คำขอรออนุมัติ</h3>
            <div className="card-value">{stats.pendingRequests}</div>
          </div>
          <div className="card-icon bg-yellow-100 text-yellow-600">
            <FileText />
          </div>
        </div>
      </div>
      {/* สามารถเพิ่มตารางรายการยืมปัจจุบันของ User ได้ที่นี่ */}
    </div>
  );
};

export default Dashboard;
