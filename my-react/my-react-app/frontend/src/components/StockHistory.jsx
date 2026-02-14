import React, { useState, useEffect } from "react";
import {
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./Management.css"; // ใช้ CSS ร่วมกับหน้าจัดการอื่นๆ เพื่อความคุมธีม
import Swal from "sweetalert2";
import { apiFetch } from "./api";

const StockHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // จำนวนรายการต่อหน้า

  useEffect(() => {
    fetchStockMovements();
  }, []);

  const fetchStockMovements = async () => {
    try {
      const response = await apiFetch("/api/stock-movements");

      if (response.ok) {
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } else {
        if (response.status === 403) {
          Swal.fire(
            "แจ้งเตือน",
            "คุณไม่มีสิทธิ์เข้าถึงข้อมูลประวัตินี้",
            "error",
          );
        } else {
          console.error("Failed to fetch stock movements");
        }
      }
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      Swal.fire("Error", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันจัดรูปแบบวันที่
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("th-TH", options);
  };

  // กรองข้อมูลตามคำค้นหา
  const filteredLogs = logs.filter(
    (log) =>
      (log.ProductName &&
        log.ProductName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.ProductCode &&
        log.ProductCode.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1); // รีเซ็ตไปหน้า 1 เมื่อมีการค้นหา
  }, [searchTerm]);

  return (
    <div className="member-management">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <History size={28} color="#4a90e2" />
          <div>
            <h2>ประวัติการเปลี่ยนแปลงสต็อก</h2>
            <p>
              ตรวจสอบรายการรับเข้า (คืน/เพิ่ม) และจ่ายออก (ยืม/ลด) ของสินค้า
            </p>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-bar search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า หรือ รหัสสินค้า..."
            aria-label="ค้นหาประวัติสต็อก"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="member-table">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>วันที่/เวลา</th>
              <th style={{ width: "15%" }}>รหัสสินค้า</th>
              <th style={{ width: "25%" }}>ชื่อสินค้า</th>
              <th style={{ width: "15%", textAlign: "center" }}>ประเภท</th>
              <th style={{ width: "10%", textAlign: "right" }}>จำนวน</th>
              <th style={{ width: "15%", textAlign: "right" }}>
                คงเหลือ (เก่า &rarr; ใหม่)
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  ไม่พบข้อมูลประวัติ
                </td>
              </tr>
            ) : (
              currentItems.map((log) => (
                <tr key={log.LogID}>
                  <td>{formatDate(log.CreatedDate)}</td>
                  <td>{log.ProductCode}</td>
                  <td>{log.ProductName}</td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        backgroundColor:
                          log.MovementType === "IN" ? "#d4edda" : "#f8d7da",
                        color:
                          log.MovementType === "IN" ? "#155724" : "#721c24",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                      }}
                    >
                      {log.MovementType === "IN" ? (
                        <ArrowUpCircle size={14} />
                      ) : (
                        <ArrowDownCircle size={14} />
                      )}
                      {log.MovementType === "IN" ? "รับเข้า" : "จ่ายออก"}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      color: log.MovementType === "IN" ? "green" : "red",
                    }}
                  >
                    {log.MovementType === "IN" ? "+" : "-"}
                    {log.ChangeAmount}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ color: "#666" }}>{log.OldQuantity}</span>
                    <span style={{ margin: "0 8px" }}>&rarr;</span>
                    <span style={{ fontWeight: "bold" }}>
                      {log.NewQuantity}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && filteredLogs.length > 0 && (
        <div
          className="pagination-controls"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            marginTop: "1rem",
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={16} /> ก่อนหน้า
          </button>
          <span style={{ fontSize: "0.9rem", color: "#555" }}>
            หน้า <strong>{currentPage}</strong> จาก{" "}
            <strong>{totalPages}</strong>
          </span>
          <button
            className="btn btn-secondary"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            style={{
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            ถัดไป <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default StockHistory;
