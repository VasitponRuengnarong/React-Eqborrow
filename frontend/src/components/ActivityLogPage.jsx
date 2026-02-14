import React, { useState, useEffect } from "react";
import { apiFetch } from "./api";
import "./Management.css"; // Reuse existing styles
import { History } from "lucide-react";

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <p style={{ transition: "color 0.3s ease" }}>แสดงประวัติการดำเนินการต่างๆ ในระบบ</p>
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
            {logs.map((log) => (
              <tr key={log.LogID}>
                <td>{new Date(log.CreatedDate).toLocaleString("th-TH")}</td>
                <td>{getActionBadge(log.ActionType)}</td>
                <td>{`${log.ActorFirstName} ${log.ActorLastName}`}</td>
                <td>{log.BorrowID}</td>
                <td>{log.Details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogPage;
