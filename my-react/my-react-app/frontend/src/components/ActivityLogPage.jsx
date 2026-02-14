import React, { useState, useEffect } from "react";
import { apiFetch } from "./api";
import "./Management.css"; // Reuse existing styles
import { History } from "lucide-react";

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await apiFetch("/api/logs");
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        } else {
          console.error("Failed to fetch logs");
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = logs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(logs.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getActionBadge = (action) => {
    let color = "#fff";
    let bg = "#6b7280";

    switch (action) {
      case "Approved":
        bg = "#22c55e";
        break;
      case "Rejected":
        bg = "#ef4444";
        break;
      case "Returned":
        bg = "#3b82f6";
        break;
      case "Cancelled":
        bg = "#f97316";
        break;
      default:
        bg = "#6b7280";
    }

    return (
      <span
        style={{
          backgroundColor: bg,
          color,
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "0.8em",
          fontWeight: "500",
        }}
      >
        {action}
      </span>
    );
  };

  if (loading) return <div className="p-4">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="management-page">
      <div className="page-header">
        <h2 style={{ transition: "color 0.3s ease" }}>
          <History size={28} style={{ marginRight: "10px" }} />
          ประวัติการทำงาน (Activity Log)
        </h2>
        <p style={{ transition: "color 0.3s ease" }}>
          แสดงประวัติการดำเนินการต่างๆ ในระบบ
        </p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>วัน-เวลา</th>
              <th>การกระทำ</th>
              <th>ผู้ดำเนินการ</th>
              <th>รหัสการยืม</th>
              <th>รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((log) => (
                <tr key={log.LogID}>
                  <td>{new Date(log.CreatedDate).toLocaleString("th-TH")}</td>
                  <td>{getActionBadge(log.ActionType)}</td>
                  <td>{`${log.ActorFirstName} ${log.ActorLastName}`}</td>
                  <td>{log.BorrowID}</td>
                  <td>{log.Details}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  ไม่พบข้อมูลประวัติ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {logs.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            แสดง {indexOfFirstItem + 1} ถึง{" "}
            {Math.min(indexOfLastItem, logs.length)} จากทั้งหมด {logs.length}{" "}
            รายการ
          </div>
          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          
          {/* Smart Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => {
             // Logic to show limited page numbers if there are many pages uses a simple sliding window
             const page = i + 1;
             if (
               page === 1 ||
               page === totalPages ||
               (page >= currentPage - 2 && page <= currentPage + 2)
             ) {
               return (
                 <button
                   key={page}
                   className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                   onClick={() => paginate(page)}
                 >
                   {page}
                 </button>
               );
             } else if (
               page === currentPage - 3 ||
               page === currentPage + 3
             ) {
               return <span key={page} className="pagination-dots">...</span>;
             }
             return null;
          })}

          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogPage;
