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


      <div className="operations-grid">
        {/* Recent Activity List */}
        <div className="chart-card recent-activity-premium">
          <div className="chart-header">
            <Activity size={20} />
            <h2>Recent Activity</h2>
          </div>
          <div className="activity-list-premium">
            {currentActivityItems.length > 0 ? (
              currentActivityItems.map((item) => (
                <div key={item.BorrowID} className="activity-item-premium">
                  <div className="activity-user-info">
                    <div className="user-avatar-placeholder" style={{ overflow: 'hidden' }}>
                      {item.requesterImage ? (
                        <img src={item.requesterImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        item.fname ? item.fname.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div className="user-details">
                      <span className="user-name">{item.fname} {item.lname}</span>
                      <span className="activity-date">
                        {new Date(item.CreatedDate).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="activity-content-info">
                    <span className="equipment-name">{item.EquipmentName}</span>
                    <span
                      className={`status-chip ${
                        item.Status === "Approved"
                          ? "approved"
                          : item.Status === "Pending"
                            ? "pending"
                            : item.Status === "Returned"
                              ? "returned"
                              : "rejected"
                      }`}
                    >
                      {item.Status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                <Activity size={40} strokeWidth={1} />
                <p>No recent activity found</p>
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {stats.recentActivity.length > itemsPerPage && (
            <div className="pagination-compact">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="paging-btn"
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="paging-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className={`chart-card alert-card-premium ${lowStockItems.length === 0 ? 'healthy' : 'warning-stock'}`} style={{ height: 'fit-content' }}>
          <div className="chart-header">
            <AlertTriangle size={20} color={lowStockItems.length > 0 ? "#dc2626" : "#4caf50"} />
            <h2 style={{ color: lowStockItems.length > 0 ? "#dc2626" : "#4caf50" }}>
              {lowStockItems.length > 0 ? "Low Stock Alerts" : "System Status"}
            </h2>
          </div>
          
          {lowStockItems.length > 0 ? (
            <div className="alert-list-premium">
              {lowStockItems.slice(0, 5).map((item, idx) => (
                <div key={idx} className="alert-item-premium">
                  <div className="alert-item-left">
                    <div className="alert-image-wrapper">
                      {item.image ? (
                        <img src={item.image} alt={item.DeviceName} />
                      ) : (
                        <div className="alert-placeholder">N/A</div>
                      )}
                    </div>
                    <div className="alert-details">
                      <span className="alert-name">{item.DeviceName}</span>
                      <span className="alert-code">#{item.DeviceCode || 'NO-CODE'}</span>
                    </div>
                  </div>
                  
                  <div className="alert-item-right">
                    <div className="stock-progress-container">
                      <div className="stock-info">
                        <span className={`stock-level ${item.AvailableCount <= 1 ? 'critical' : ''}`}>
                          {item.AvailableCount} ชิ้นเหลืออยู่
                        </span>
                        <span className="stock-threshold">เป้าหมาย: 5</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div 
                          className={`progress-bar-fill ${item.AvailableCount <= 1 ? 'critical' : 'warning'}`}
                          style={{ width: `${Math.min((item.AvailableCount / 5) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <button 
                      className="manage-stock-btn"
                      onClick={() => navigate("/products")}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <div className="alert-more-premium" onClick={() => navigate("/products")}>
                  See all {lowStockItems.length} items with low stock
                </div>
              )}
            </div>
          ) : (
            <div className="system-healthy-container">
              <div className="healthy-icon-wrapper">
                <CheckSquare size={48} />
              </div>
              <div className="healthy-text">
                <h3>All Systems Operational</h3>
                <p>Stock levels are currently healthy across all items.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
