import React, { useState, useEffect } from "react";
import { apiFetch } from "./api";
import Swal from "sweetalert2";
import { Download, ChevronLeft, ChevronRight, Search } from "lucide-react"; // Import ไอคอน Download
import "./Management.css"; // ใช้ CSS เดิมเพื่อให้หน้าตาสอดคล้องกัน

const BorrowHistory = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchBorrows();
  }, []);

  const fetchBorrows = async () => {
    try {
      // เรียก API ใหม่ที่รองรับทั้ง Admin (เห็นทั้งหมด) และ User (เห็นของตัวเอง)
      const response = await apiFetch("/api/borrows");
      if (response.ok) {
        const data = await response.json();
        setBorrows(data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiFetch("/api/borrows/export");
      if (response.ok) {
        // แปลง Response เป็น Blob เพื่อดาวน์โหลด
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `borrow_history_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถดาวน์โหลดไฟล์ได้", "error");
      }
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire("เกิดข้อผิดพลาด", "การเชื่อมต่อขัดข้อง", "error");
    }
  };

  const handleCancel = async (borrowId) => {
    Swal.fire({
      title: "ยืนยันการยกเลิก?",
      text: "คุณต้องการยกเลิกคำขอนี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ยกเลิกเลย",
      cancelButtonText: "ไม่, เก็บไว้",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiFetch(`/api/borrows/${borrowId}/cancel`, {
            method: "PUT",
          });
          if (response.ok) {
            Swal.fire("สำเร็จ!", "ยกเลิกคำขอเรียบร้อยแล้ว", "success");
            fetchBorrows(); // โหลดข้อมูลใหม่
          } else {
            const data = await response.json();
            Swal.fire(
              "เกิดข้อผิดพลาด!",
              data.message || "ไม่สามารถยกเลิกได้",
              "error",
            );
          }
        } catch (error) {
          Swal.fire(
            "เกิดข้อผิดพลาด!",
            "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
            "error",
          );
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    let color = "#6b7280";
    let bg = "#f3f4f6";

    switch (status) {
      case "Approved":
        color = "#059669";
        bg = "#d1fae5";
        break;
      case "Pending":
        color = "#d97706";
        bg = "#fef3c7";
        break;
      case "Rejected":
        color = "#dc2626";
        bg = "#fee2e2";
        break;
      case "Returned":
        color = "#2563eb";
        bg = "#dbeafe";
        break;
      case "Cancelled":
        color = "#9ca3af";
        bg = "#f3f4f6";
        break;
    }

    return (
      <span
        style={{
          color,
          backgroundColor: bg,
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "0.85em",
          fontWeight: "500",
        }}
      >
        {status}
      </span>
    );
  };

  // Filter Logic
  const filteredBorrows = borrows.filter((borrow) => {
    const term = searchTerm.toLowerCase();
    const borrowerName =
      `${borrow.fname || ""} ${borrow.lname || ""}`.toLowerCase();
    const itemNames = borrow.items
      ? borrow.items
          .map((item) => (item.ItemName || "").toLowerCase())
          .join(" ")
      : "";
    return borrowerName.includes(term) || itemNames.includes(term);
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBorrows.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBorrows.length / itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) return <div className="p-4">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h2>ประวัติการยืม-คืน</h2>
          <p>รายการคำขอและการยืมคืนทั้งหมด</p>
        </div>
        {user?.role === "Admin" && (
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={18} /> Export Excel
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
          />
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ยืม หรือ ชื่ออุปกรณ์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 10px 10px 40px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "0.95rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#ff8000")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>วันที่ทำรายการ</th>
              <th>ผู้ยืม</th>
              <th>วันที่ยืม - คืน</th>
              <th>วัตถุประสงค์</th>
              <th>สถานะ</th>
              <th>รายการอุปกรณ์</th>
            </tr>
          </thead>
          <tbody>
            {filteredBorrows.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  {searchTerm ? "ไม่พบข้อมูลที่ค้นหา" : "ไม่พบรายการประวัติ"}
                </td>
              </tr>
            ) : (
              currentItems.map((borrow) => (
                <tr key={borrow.BorrowID}>
                  <td>
                    {new Date(borrow.CreatedDate).toLocaleDateString("th-TH")}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {borrow.fname} {borrow.lname}
                    </div>
                    <div style={{ fontSize: "0.8em", color: "#666" }}>
                      {borrow.DepartmentName}
                    </div>
                  </td>
                  <td>
                    {new Date(borrow.BorrowDate).toLocaleDateString("th-TH")} -{" "}
                    {new Date(borrow.ReturnDate).toLocaleDateString("th-TH")}
                  </td>
                  <td>{borrow.Purpose}</td>
                  <td>{getStatusBadge(borrow.Status)}</td>
                  <td>
                    <ul
                      style={{
                        paddingLeft: "20px",
                        margin: 0,
                        fontSize: "0.9em",
                      }}
                    >
                      {borrow.items &&
                        borrow.items.map((item, idx) => (
                          <li key={idx}>
                            {item.ItemName} (x{item.Quantity})
                          </li>
                        ))}
                    </ul>
                  </td>
                  <td>
                    {/* User can only cancel their own pending requests */}
                    {user?.role !== "Admin" && borrow.Status === "Pending" && (
                      <button
                        className="btn btn-delete"
                        style={{ fontSize: "0.8em", padding: "4px 8px" }}
                        onClick={() => handleCancel(borrow.BorrowID)}
                      >
                        ยกเลิกคำขอ
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && filteredBorrows.length > 0 && (
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

export default BorrowHistory;
