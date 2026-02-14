import React, { useState, useEffect } from "react";
import {
  Box,
  Clock,
  AlertTriangle,
  CheckSquare,
  Activity,
  Download,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import { apiFetch } from "./api";
import StatusChartCard from "./StatusChartCard";
import CategoryChartCard from "./CategoryChartCard";

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
  const [products, setProducts] = useState([]); // State for products
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await apiFetch("/api/dashboard/admin-stats");
        const alertsResponse = await apiFetch("/api/notifications/low-stock");
        const productsResponse = await apiFetch("/api/products"); // Fetch products for the new chart

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setLowStockItems(alertsData);
        }
        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            setProducts(productsData);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  // Filter products based on date range
  const filteredProducts = products.filter((product) => {
    if (!startDate && !endDate) return true;
    const productDate = new Date(product.CreatedDate);
    const start = startDate ? new Date(startDate) : new Date("1900-01-01");
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999); // Include the entire end day
    return productDate >= start && productDate <= end;
  });

  // Function to handle Excel export
  const handleExport = async () => {
    try {
      const response = await apiFetch("/api/borrows/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `borrow_history_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("ไม่สามารถดาวน์โหลดไฟล์ได้");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // Pagination Logic for Recent Activity
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivityItems = stats.recentActivity.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(stats.recentActivity.length / itemsPerPage);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }


  return (
    <div className="admin-dashboard">
      <div className="dashboard-header-premium">
        <div className="welcome-section">
          <div className="welcome-header-content">
            <h1>Dashboard</h1>
            <p>ภาพรวมระบบและการจัดการ</p>
          </div>
          
          <div className="header-actions">
            <div className="date-badge-premium">
              <Calendar size={18} />
              <span>
                {new Date().toLocaleDateString("th-TH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            
            <button 
              onClick={handleExport}
              className="export-btn-premium"
            >
              <Download size={18} /> Export Data
            </button>
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

      {/* Analytics Section */}
      <div className="section-title">
        <span>Asset Analytics</span>
        <div className="filter-container">
          <span style={{ fontSize: '13px', color: '#666', marginRight: '5px' }}>Filter Date:</span>
          <input
            type="date"
            className="filter-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: '#999' }}>-</span>
          <input
            type="date"
            className="filter-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(""); setEndDate(""); }}
              style={{ background: 'none', border: 'none', color: '#ff8000', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="charts-grid">
        <StatusChartCard products={filteredProducts} />
        <CategoryChartCard products={filteredProducts} />
      </div>

      {/* Operations Section */}
      <div className="section-title">
        <span>Recent Operations</span>
      </div>

      <div className="operations-grid">
        {/* Recent Activity Table */}
        <div className="chart-card recent-activity" style={{ height: '100%' }}>
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
                {currentActivityItems.length > 0 ? (
                  currentActivityItems.map((item) => (
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
          {/* Pagination Controls */}
          {stats.recentActivity.length > itemsPerPage && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '15px 0', borderTop: '1px solid #eee' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '5px 10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#fff' }}
              >
                &lt; Previous
              </button>
              <span style={{ fontSize: '14px', color: '#666' }}>Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '5px 10px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: '#fff' }}
              >
                Next &gt;
              </button>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className={`chart-card alert-card-container ${lowStockItems.length === 0 ? 'healthy' : ''}`} style={{ height: 'fit-content' }}>
              <div className="chart-header">
            <AlertTriangle size={20} color={lowStockItems.length > 0 ? "#dc2626" : "#4caf50"} />
            <h2 style={{ color: lowStockItems.length > 0 ? "#dc2626" : "#4caf50" }}>
              {lowStockItems.length > 0 ? "Low Stock Alerts" : "System Status"}
            </h2>
              </div>
          {lowStockItems.length > 0 ? (
              <div className="alert-list">
                {lowStockItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="alert-item">
                    <span className="alert-name">{item.DeviceName}</span>
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
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#4caf50', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CheckSquare size={40} style={{ marginBottom: '10px', opacity: 0.8 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>All systems operational</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Stock levels are healthy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
