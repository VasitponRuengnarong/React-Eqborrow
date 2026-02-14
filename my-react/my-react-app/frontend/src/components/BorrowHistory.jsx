import React, { useState, useEffect } from "react";
import { apiFetch } from "./api";
import {
  Calendar,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./BorrowHistory.css";

const BorrowHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = history.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(history.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const fetchHistory = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      try {
        // ดึงข้อมูลการยืมทั้งหมดของผู้ใช้
        const response = await apiFetch(`/api/borrows/user/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          // เรียงลำดับจากวันที่ล่าสุดไปเก่าสุด
          const sortedData = data.sort(
            (a, b) => new Date(b.BorrowDate) - new Date(a.BorrowDate),
          );
          setHistory(sortedData);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="status-badge approved">
            <CheckCircle size={14} /> อนุมัติแล้ว
          </span>
        );
      case "Pending":
        return (
          <span className="status-badge pending">
            <Clock size={14} /> รออนุมัติ
          </span>
        );
      case "Rejected":
        return (
          <span className="status-badge rejected">
            <XCircle size={14} /> ปฏิเสธ
          </span>
        );
      case "Returned":
        return (
          <span className="status-badge returned">
            <RotateCcw size={14} /> คืนแล้ว
          </span>
        );
      default:
        return <span className="status-badge default">{status}</span>;
    }
  };

  return (
    <div className="history-container">
      <div className="page-header">
        <h2>ประวัติการยืม-คืน</h2>
        <p>ตรวจสอบสถานะและประวัติการทำรายการย้อนหลัง</p>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading-state">กำลังโหลดข้อมูล...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <Package size={48} color="#9ca3af" />
            <p>ยังไม่มีประวัติการยืมอุปกรณ์</p>
          </div>
        ) : (
          <div className="history-list">
            {currentItems.map((item) => (
              <div key={item.BorrowID} className="history-card">
                <div className="history-card-header">
                  <div className="history-id">
                    <span className="label">ID:</span> #{item.BorrowID}
                  </div>
                  <div className="history-date">
                    <Calendar size={14} />
                    {new Date(item.BorrowDate).toLocaleDateString("th-TH")}
                  </div>
                </div>

                <div className="history-card-body">
                  <div className="history-info-row">
                    <div className="info-group">
                      <span className="info-label">กำหนดคืน</span>
                      <span className="info-value">
                        {new Date(item.ReturnDate).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                    <div className="info-group">
                      <span className="info-label">วัตถุประสงค์</span>
                      <span className="info-value">{item.Purpose}</span>
                    </div>
                  </div>

                  <div className="history-items">
                    <span className="info-label">รายการอุปกรณ์:</span>
                    <ul className="item-list-compact">
                      {item.items &&
                        item.items.map((detail, idx) => (
                          <li key={idx}>
                            {detail.ItemName}{" "}
                            <span className="qty">x{detail.Quantity}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                <div className="history-card-footer">
                  <div className="status-wrapper">
                    {getStatusBadge(item.Status)}
                  </div>
                  {item.Status === "Rejected" && item.RejectReason && (
                    <div className="reject-reason">
                      <AlertCircle size={14} /> เหตุผล: {item.RejectReason}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Pagination Controls */}
            {history.length > itemsPerPage && (
              <div className="pagination-container">
                <div className="pagination-info">
                  หน้า <strong>{currentPage}</strong> จาก{" "}
                  <strong>{totalPages}</strong>
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowHistory;
