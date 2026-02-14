import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2"; // Import SweetAlert2
import "./PendingRequests.css";

const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch("/api/borrows/pending");
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    Swal.fire({
      title: `คุณต้องการ ${status === "Approved" ? "อนุมัติ" : "ไม่อนุมัติ"} รายการนี้ใช่หรือไม่?`,
      text: "การกระทำนี้จะเปลี่ยนสถานะคำขอทันที",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: status === "Approved" ? "#28a745" : "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText:
        status === "Approved" ? "ใช่, อนุมัติ!" : "ใช่, ไม่อนุมัติ!",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("accessToken");
        try {
          const response = await fetch(`/api/borrows/${id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          });

          if (response.ok) {
            Swal.fire(
              "สำเร็จ!",
              `บันทึกสถานะเป็น ${status} เรียบร้อยแล้ว`,
              "success",
            );
            fetchPendingRequests(); // Refresh list
          } else {
            const data = await response.json();
            Swal.fire(
              "เกิดข้อผิดพลาด!",
              data.message || "เกิดข้อผิดพลาดในการบันทึกสถานะ",
              "error",
            );
          }
        } catch (error) {
          console.error("Error updating status:", error);
          Swal.fire(
            "เกิดข้อผิดพลาด!",
            "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
            "error",
          );
        }
      }
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ดึงรายชื่อแผนกทั้งหมดที่มีในรายการเพื่อมาทำ Dropdown
  const departments = [
    ...new Set(requests.map((req) => req.DepartmentName).filter(Boolean)),
  ];

  // กรองข้อมูลตามคำค้นหาและแผนก
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.EMP_NUM.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept
      ? req.DepartmentName === selectedDept
      : true;

    return matchesSearch && matchesDept;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="loading-text">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="pending-requests-container">
      <div className="page-header">
        <h2>อนุมัติการยืม</h2>
        <p>รายการคำขอที่รอการตรวจสอบและอนุมัติ</p>
      </div>

      {/* Search & Filter Section */}
      <div className="filter-section">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัสพนักงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={18} className="filter-icon" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">ทุกแผนก</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          {requests.length === 0 ? (
            <>
              <Clock size={48} color="#ccc" />
              <p>ไม่มีรายการรออนุมัติในขณะนี้</p>
            </>
          ) : (
            <>
              <Search size={48} color="#ccc" />
              <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
            </>
          )}
        </div>
      ) : (
        <div className="requests-grid">
          {currentItems.map((req) => (
            <div key={req.BorrowID} className="request-card">
              <div className="request-header">
                <div className="user-profile-mini">
                  <div className="avatar-placeholder">
                    {req.fname.charAt(0)}
                  </div>
                  <div>
                    <h4>
                      {req.fname} {req.lname}
                    </h4>
                    <span>
                      {req.DepartmentName} / {req.InstitutionName}
                    </span>
                  </div>
                </div>
                <span className="request-date">
                  {formatDate(req.CreatedDate)}
                </span>
              </div>

              <div className="request-body">
                <div className="info-row">
                  <Calendar size={16} />
                  <span>
                    ยืม: {formatDate(req.BorrowDate)} — คืน:{" "}
                    {formatDate(req.ReturnDate)}
                  </span>
                </div>
                <div className="info-row">
                  <FileText size={16} />
                  <span>{req.Purpose}</span>
                </div>

                <div className="items-list-mini">
                  <h5>รายการอุปกรณ์:</h5>
                  <ul>
                    {req.items.map((item) => (
                      <li key={item.BorrowDetailID}>
                        {item.ItemName} (x{item.Quantity}){" "}
                        <span className="remark">{item.Remark}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="request-actions">
                <button
                  className="btn-reject"
                  onClick={() => handleStatusUpdate(req.BorrowID, "Rejected")}
                >
                  <XCircle size={18} /> ไม่อนุมัติ
                </button>
                <button
                  className="btn-approve"
                  onClick={() => handleStatusUpdate(req.BorrowID, "Approved")}
                >
                  <CheckCircle size={18} /> อนุมัติ
                </button>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {filteredRequests.length > itemsPerPage && (
            <div className="pagination-container" style={{ width: "100%", marginTop: "20px" }}>
              <div className="pagination-info">
                หน้า <strong>{currentPage}</strong> จาก <strong>{totalPages}</strong>
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
  );
};

export default PendingRequests;
