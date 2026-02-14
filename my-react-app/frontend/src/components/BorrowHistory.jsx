import React, { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle, XCircle, Package, Calendar } from "lucide-react";
import "./BorrowHistory.css";

const BorrowHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/borrows/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleReturn = async (borrowId) => {
    if (!window.confirm("คุณต้องการแจ้งคืนอุปกรณ์รายการนี้ใช่หรือไม่?")) return;

    try {
      const response = await fetch(`/api/borrows/${borrowId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Returned" }),
      });

      if (response.ok) {
        alert("บันทึกการคืนอุปกรณ์เรียบร้อยแล้ว");
        fetchHistory(); // รีโหลดข้อมูลใหม่
      } else {
        const data = await response.json();
        alert(data.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error returning item:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="status-badge approved">
            <CheckCircle size={14} /> อนุมัติแล้ว
          </span>
        );
      case "Rejected":
        return (
          <span className="status-badge rejected">
            <XCircle size={14} /> ไม่อนุมัติ
          </span>
        );
      case "Returned":
        return (
          <span className="status-badge returned">
            <Package size={14} /> คืนแล้ว
          </span>
        );
      default:
        return (
          <span className="status-badge pending">
            <Clock size={14} /> รออนุมัติ
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return <div className="loading-text">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="borrow-history-container">
      <div className="page-header">
        <h2>ประวัติการยืม-คืน</h2>
        <p>รายการคำขอเบิก-ยืมอุปกรณ์ทั้งหมดของคุณ</p>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <Package size={48} color="#ccc" />
          <p>คุณยังไม่มีประวัติการยืมอุปกรณ์</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.BorrowID} className="history-card">
              <div className="history-header">
                <div className="header-left">
                  <span className="borrow-id">#{item.BorrowID}</span>
                  <span className="borrow-date">
                    {formatDate(item.CreatedDate)}
                  </span>
                </div>
                <div className="header-right">
                  {getStatusBadge(item.Status)}
                  {item.Status === "Approved" && (
                    <button
                      className="btn-return"
                      onClick={() => handleReturn(item.BorrowID)}
                    >
                      คืนอุปกรณ์
                    </button>
                  )}
                </div>
              </div>

              <div className="history-body">
                <div className="history-info">
                  <p>
                    <strong>วัตถุประสงค์:</strong> {item.Purpose}
                  </p>
                  <p>
                    <Calendar size={14} />
                    ยืม: {formatDate(item.BorrowDate)} — คืน:{" "}
                    {formatDate(item.ReturnDate)}
                  </p>
                </div>

                <div className="history-items">
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>รายการ</th>
                        <th>จำนวน</th>
                        <th>หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(item.items || []).map((detail) => (
                        <tr key={detail.BorrowDetailID}>
                          <td>{detail.ItemName}</td>
                          <td>{detail.Quantity}</td>
                          <td>{detail.Remark || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BorrowHistory;
