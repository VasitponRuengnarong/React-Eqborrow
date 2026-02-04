import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Calendar,
  Info,
  Heart,
  Clock,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiFetch } from "./api";
import "./UserDashboard.css";
import Swal from "sweetalert2";

const UserDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user] = useState(JSON.parse(localStorage.getItem("user")));
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [favorites, setFavorites] = useState([]); // Array of ProductIDs
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const navigate = useNavigate();
  const loansRef = useRef(null); // Ref สำหรับเลื่อนไปที่รายการยืม

  // Dashboard Stats State
  const [userStats, setUserStats] = useState({
    itemsOnHand: 0,
    dueSoon: 0,
    pendingRequests: 0,
    currentLoans: [],
    history: [],
  });
  const [filterDueSoon, setFilterDueSoon] = useState(false); // State สำหรับกรองรายการใกล้คืน
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Borrow Modal State
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [borrowItem, setBorrowItem] = useState(null);

  // Borrow Form State
  const [borrowFormData, setBorrowFormData] = useState({
    borrowDate: new Date().toISOString().split("T")[0],
    returnDate: "",
    purpose: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchFavorites();
    if (user) fetchUserStats();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await apiFetch("/api/favorites");
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await apiFetch("/api/dashboard/user-stats");
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleBorrowClick = (e, product) => {
    e.stopPropagation();
    setBorrowItem(product);
    setIsBorrowModalOpen(true);
    // Reset form data
    setBorrowFormData({
      borrowDate: new Date().toISOString().split("T")[0],
      returnDate: "",
      purpose: "",
    });
  };

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!borrowItem) return;

    try {
      const items = [
        {
          name: borrowItem.DeviceName, // Backend expects 'name' (ItemName)
          quantity: 1, // Default 1 for individual assets
          remark: "",
        },
      ];

      const body = {
        userId: user.id,
        borrowDate: borrowFormData.borrowDate,
        returnDate: borrowFormData.returnDate,
        purpose: borrowFormData.purpose,
        items: items,
      };

      const response = await apiFetch("/api/borrow", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        Swal.fire("สำเร็จ", "ส่งคำขอยืมเรียบร้อยแล้ว", "success");
        setIsBorrowModalOpen(false);
        setBorrowItem(null);
        if (selectedProduct) setSelectedProduct(null); // Close detail modal if open
        fetchUserStats();
      } else {
        const err = await response.json();
        Swal.fire("ผิดพลาด", err.message, "error");
      }
    } catch (error) {
      Swal.fire("Error", "Connection error", "error");
    }
  };

  const toggleFavorite = async (e, product) => {
    e.stopPropagation();
    const isFav = favorites.includes(product.DVID);

    // Optimistic update
    if (isFav) {
      setFavorites((prev) => prev.filter((id) => id !== product.DVID));
      try {
        await apiFetch(`/api/favorites/${product.DVID}`, {
          method: "DELETE",
        });
      } catch (error) {
        setFavorites((prev) => [...prev, product.DVID]); // Revert on error
      }
    } else {
      setFavorites((prev) => [...prev, product.DVID]);
      try {
        await apiFetch("/api/favorites", {
          method: "POST",
          body: JSON.stringify({ productId: product.DVID }),
        });
      } catch (error) {
        setFavorites((prev) => prev.filter((id) => id !== product.DVID)); // Revert on error
      }
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const lowerTerm = searchTerm.toLowerCase();
    const matchesSearch =
      (p.DeviceName &&
        String(p.DeviceName).toLowerCase().includes(lowerTerm)) ||
      (p.DeviceCode && String(p.DeviceCode).toLowerCase().includes(lowerTerm));
    const matchesFav = showFavoritesOnly ? favorites.includes(p.DVID) : true;
    return matchesSearch && matchesFav;
  });

  // Calculate countdown days
  const getDaysRemaining = (returnDate) => {
    const today = new Date();
    const due = new Date(returnDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtered Loans based on selection
  const displayedLoans = filterDueSoon
    ? userStats.currentLoans.filter(
        (loan) => getDaysRemaining(loan.ReturnDate) <= 1,
      )
    : userStats.currentLoans;

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="user-dashboard">
      <style>{`
        .stats-grid-user {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        .stat-card-user { /* Add transitions for theme change */
          background: var(--bg-card); 
          border-radius: 24px;
          padding: 28px;
          display: flex;
          align-items: center;
          gap: 24px;
          box-shadow: var(--shadow-sm); 
          border: 1px solid var(--border-color); 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .stat-card-user:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01);
          border-color: transparent;
        }
        .icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .stat-card-user:hover .icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }
        .icon-wrapper.blue { background: #eff6ff; color: #3b82f6; }
        .icon-wrapper.red { background: #fef2f2; color: #ef4444; }
        .icon-wrapper.orange { background: #fff7ed; color: #f97316; }
        
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        .stat-info h3 {
          margin: 0 0 6px 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-value {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary); /* Add transition for color */
          line-height: 1;
          letter-spacing: -0.03em;
        }
        
        /* Styles for chart-card and alert-card-container */
        .dashboard-widgets {
          display: grid; /* Add transitions for theme change */
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        @media (max-width: 768px) {
          .dashboard-widgets { grid-template-columns: 1fr; }
        }
        .chart-card, .alert-card-container { /* Add transitions for theme change */
          background: var(--bg-card); 
          border-radius: 24px;
          padding: 24px;
          box-shadow: var(--shadow-sm); 
          border: 1px solid var(--border-color); 
        }
        .alert-card-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
        }
        .alert-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #fef2f2;
          border-radius: 12px;
          border-left: 4px solid #ef4444;
        }
        .alert-content h4 { margin: 0; font-size: 0.9rem; color: #991b1b; }
        .alert-content p { margin: 0; font-size: 0.8rem; color: #b91c1c; }
        
        .stat-bar-row { margin-bottom: 12px; } /* Add transitions for theme change */
        .stat-bar-label { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px; color: #64748b; }
        .stat-bar-bg { height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden; transition: background-color 0.3s ease; }
        .stat-bar-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }
      `}</style>
      {/* 1. Welcome Section */}
      <div className="welcome-section">
        <h1>สวัสดี, {user?.firstName || "User"} 👋</h1>
        <p>สถานะการยืมปัจจุบันของคุณ</p>
      </div>

      {/* 2. My Active Status (Top Row) */}
      <div className="stats-grid-user">
        <div
          className="stat-card-user"
          onClick={() => {
            setFilterDueSoon(false);
            loansRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div className="icon-wrapper blue">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Assets</h3>
            <p className="stat-value">{userStats.itemsOnHand}</p>
          </div>
        </div>
        <div
          className="stat-card-user"
          onClick={() => {
            setFilterDueSoon(true);
            loansRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div className="icon-wrapper red">
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Overdue</h3>
            <p className="stat-value">{userStats.dueSoon}</p>
          </div>
        </div>
        <div className="stat-card-user" onClick={() => navigate("/history")}>
          <div className="icon-wrapper orange">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>Pending Approval</h3>
            <p className="stat-value">{userStats.pendingRequests}</p>
          </div>
        </div>
      </div>

      {/* New Dashboard Widgets: Chart & Alerts */}
      <div className="dashboard-widgets">
        <div className="chart-card">
          <h3
            style={{
              margin: "0 0 20px 0",
              color: "var(--text-primary)",
              transition: "color 0.3s ease",
            }}
          >
            ภาพรวมอุปกรณ์ (Overview)
          </h3>
          <div className="stat-bar-row">
            <div className="stat-bar-label">
              <span>ว่าง (Available)</span>
              <span>
                {products.filter((p) => p.StatusNameDV === "ว่าง").length}
              </span>
            </div>
            <div className="stat-bar-bg">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${(products.filter((p) => p.StatusNameDV === "ว่าง").length / (products.length || 1)) * 100}%`,
                  background: "#22c55e",
                }}
              ></div>
            </div>
          </div>
          <div className="stat-bar-row">
            <div className="stat-bar-label">
              <span>ถูกยืม (Borrowed)</span>
              <span>
                {products.filter((p) => p.StatusNameDV === "ถูกยืม").length}
              </span>
            </div>
            <div className="stat-bar-bg">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${(products.filter((p) => p.StatusNameDV === "ถูกยืม").length / (products.length || 1)) * 100}%`,
                  background: "#3b82f6",
                }}
              ></div>
            </div>
          </div>
          <div className="stat-bar-row">
            <div className="stat-bar-label">
              <span>ส่งซ่อม/ชำรุด (Maintenance)</span>
              <span>
                {
                  products.filter((p) =>
                    ["ส่งซ่อม", "ชำรุด"].includes(p.StatusNameDV),
                  ).length
                }
              </span>
            </div>
            <div className="stat-bar-bg">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${(products.filter((p) => ["ส่งซ่อม", "ชำรุด"].includes(p.StatusNameDV)).length / (products.length || 1)) * 100}%`,
                  background: "#f97316",
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="alert-card-container">
          <h3
            style={{
              margin: "0 0 12px 0",
              color: "var(--text-primary)",
              transition: "color 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={20} color="#ef4444" /> แจ้งเตือน (Notifications)
          </h3>
          {userStats.currentLoans.filter(
            (l) => getDaysRemaining(l.ReturnDate) <= 3,
          ).length === 0 ? (
            <p
              style={{
                color: "#64748b",
                fontSize: "0.9rem",
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              ไม่มีรายการแจ้งเตือน
            </p>
          ) : (
            userStats.currentLoans
              .filter((l) => getDaysRemaining(l.ReturnDate) <= 3)
              .map((loan) => (
                <div key={loan.BorrowID + loan.ItemName} className="alert-item">
                  <AlertCircle size={20} color="#ef4444" />
                  <div className="alert-content">
                    <h4>{loan.ItemName}</h4>
                    <p>
                      {getDaysRemaining(loan.ReturnDate) < 0
                        ? `เกินกำหนด ${Math.abs(getDaysRemaining(loan.ReturnDate))} วัน`
                        : `ครบกำหนดใน ${getDaysRemaining(loan.ReturnDate)} วัน`}
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* 3. Current Loans List (Main Section) */}
      <div className="section-container" ref={loansRef}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <h2 style={{ margin: 0 }}>Current Loans</h2>
          {filterDueSoon && (
            <span
              style={{
                fontSize: "0.8rem",
                background: "#ffebee",
                color: "#c62828",
                padding: "2px 8px",
                borderRadius: "10px",
                cursor: "pointer",
              }}
              onClick={() => setFilterDueSoon(false)}
            >
              Showing Due Soon{" "}
              <X size={12} style={{ verticalAlign: "middle" }} />
            </span>
          )}
        </div>

        {displayedLoans.length === 0 ? (
          <div className="empty-state-card">You have no active loans.</div>
        ) : (
          <div className="loans-list">
            {displayedLoans.map((loan) => {
              const daysLeft = getDaysRemaining(loan.ReturnDate);
              return (
                <div key={loan.BorrowID + loan.ItemName} className="loan-card">
                  <img
                    src={loan.Image || "/images/logo.png"}
                    alt={loan.ItemName}
                    className="loan-img"
                  />
                  <div className="loan-details">
                    <h4>{loan.ItemName}</h4>
                    <p className="asset-code">#{loan.AssetCode || "N/A"}</p>
                    <div className="loan-meta">
                      <span
                        className={`due-badge ${daysLeft < 0 ? "overdue" : daysLeft <= 1 ? "urgent" : "normal"}`}
                      >
                        {daysLeft < 0
                          ? `Overdue ${Math.abs(daysLeft)} days`
                          : daysLeft === 0
                            ? "Due Today"
                            : `${daysLeft} days left`}
                      </span>
                    </div>
                  </div>
                  <div className="loan-status">
                    <span className="status-indicator return-pending">
                      To Return
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Borrowing History (Collapsible) */}
      <div className="section-container">
        <div
          className="section-header-clickable"
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
        >
          <h2>Borrowing History</h2>
          {isHistoryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {isHistoryOpen && (
          <div className="history-list">
            {userStats.history.length === 0 ? (
              <p className="empty-text">No history available.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Returned Date</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.history.map((h, idx) => (
                    <tr key={idx}>
                      <td>{h.ItemName}</td>
                      <td>
                        {new Date(h.ReturnDate).toLocaleDateString("th-TH")}
                      </td>
                      <td>{h.Quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="search-hero">
        <h2>Browse Items to Borrow</h2>
        <div className="search-large-wrapper">
          <Search className="search-large-icon" size={24} />
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่ออุปกรณ์, รหัสสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className={`btn-filter-fav ${showFavoritesOnly ? "active" : ""}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            title="แสดงเฉพาะรายการโปรด"
          >
            <Heart size={20} fill={showFavoritesOnly ? "#ff4081" : "none"} />
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="product-grid-container">
        {loading ? (
          <p>Loading...</p>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.DVID}
              className="product-card-user"
              onClick={() => handleProductClick(product)}
            >
              <div className="product-img-wrapper">
                <button
                  className={`btn-favorite-card ${favorites.includes(product.DVID) ? "active" : ""}`}
                  onClick={(e) => toggleFavorite(e, product)}
                >
                  <Heart
                    size={18}
                    fill={favorites.includes(product.DVID) ? "#ff4081" : "none"}
                  />
                </button>

                <img
                  src={product.Image || "/images/logo.png"}
                  alt={product.DeviceName}
                />
                <span
                  className={`status-badge ${product.StatusNameDV === "ว่าง" ? "available" : "unavailable"}`}
                >
                  {product.StatusNameDV}
                </span>
              </div>
              <div className="product-info">
                <h3>{product.DeviceName}</h3>
                <p className="product-code">#{product.DeviceCode}</p>
                <button
                  className="btn-borrow"
                  disabled={product.StatusNameDV !== "ว่าง"}
                  onClick={(e) => {
                    handleBorrowClick(e, product);
                  }}
                >
                  {product.StatusNameDV === "ว่าง" ? "ยืมเลย" : "ไม่ว่าง"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Borrow Form Modal */}
      {isBorrowModalOpen && borrowItem && (
        <div
          className="product-modal-overlay"
          onClick={() => setIsBorrowModalOpen(false)}
        >
          <div
            className="borrow-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cart-header">
              <h2>ยืนยันการยืม</h2>
              <button
                onClick={() => setIsBorrowModalOpen(false)}
                className="close-btn-simple"
              >
                <X size={24} />
              </button>
            </div>

            <div className="borrow-item-summary">
              <img
                src={borrowItem.Image || "/images/logo.png"}
                alt={borrowItem.DeviceName}
              />
              <div>
                <h4>{borrowItem.DeviceName}</h4>
                <p>#{borrowItem.DeviceCode}</p>
              </div>
            </div>

            <form onSubmit={handleBorrowSubmit} className="cart-form">
              <div className="form-group">
                <label>
                  <Calendar size={16} /> วันที่ยืม
                </label>
                <input
                  type="date"
                  required
                  value={borrowFormData.borrowDate}
                  onChange={(e) =>
                    setBorrowFormData({
                      ...borrowFormData,
                      borrowDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>
                  <Calendar size={16} /> วันที่คืน
                </label>
                <input
                  type="date"
                  required
                  value={borrowFormData.returnDate}
                  onChange={(e) =>
                    setBorrowFormData({
                      ...borrowFormData,
                      returnDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>
                  <Info size={16} /> วัตถุประสงค์
                </label>
                <textarea
                  required
                  value={borrowFormData.purpose}
                  onChange={(e) =>
                    setBorrowFormData({
                      ...borrowFormData,
                      purpose: e.target.value,
                    })
                  }
                  placeholder="ระบุเหตุผล..."
                ></textarea>
              </div>
              <button type="submit" className="btn-confirm-borrow">
                ยืนยันการยืม
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={closeProductModal}>
          <div
            className="product-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={closeProductModal}>
              <X size={24} />
            </button>
            <div className="product-modal-body">
              <div className="product-modal-image-wrapper">
                <img
                  src={selectedProduct.Image || "/images/sennheiserEW100G4.png"}
                  alt={selectedProduct.DeviceName}
                />
              </div>
              <div className="product-modal-info">
                <h2>{selectedProduct.DeviceName}</h2>
                <p className="modal-code">
                  รหัสอุปกรณ์: {selectedProduct.DeviceCode}
                </p>
                <div className="modal-badges">
                  <span
                    className={`status-badge static ${selectedProduct.StatusNameDV === "ว่าง" ? "available" : "unavailable"}`}
                  >
                    {selectedProduct.StatusNameDV}
                  </span>
                </div>
                <div className="modal-product-details">
                  <div className="detail-row">
                    <span className="detail-label">หมวดหมู่ (Category):</span>
                    <span className="detail-value">
                      {selectedProduct.CategoryName || "-"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">ยี่ห้อ (Brand):</span>
                    <span className="detail-value">
                      {selectedProduct.Brand || "-"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">รุ่น/ชนิด (Type):</span>
                    <span className="detail-value">
                      {selectedProduct.DeviceType || "-"}
                    </span>
                  </div>
                </div>
                <button
                  className="btn-borrow modal-cart-btn"
                  disabled={selectedProduct.StatusNameDV !== "ว่าง"}
                  onClick={() => {
                    handleBorrowClick(null, selectedProduct); // Pass null for event if calling directly
                  }}
                >
                  {selectedProduct.StatusNameDV === "ว่าง"
                    ? "ยืมเลย"
                    : "ไม่ว่าง"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
