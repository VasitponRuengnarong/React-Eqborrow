import React, { useState, useEffect } from "react";
import { apiFetch } from "./api";
import { History, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Management.css";

const LatestActivityWidget = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await apiFetch("/api/logs?limit=5");
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getActionStyle = (action) => {
    switch (action) {
      case "Approved":
        return { color: "#059669", bg: "#d1fae5" };
      case "Rejected":
        return { color: "#dc2626", bg: "#fee2e2" };
      case "Returned":
        return { color: "#2563eb", bg: "#dbeafe" };
      case "Cancelled":
        return { color: "#d97706", bg: "#fef3c7" };
      default:
        return { color: "#4b5563", bg: "#f3f4f6" };
    }
  };

  return (
    <div className="chart-card" style={{ minHeight: "auto", height: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          borderBottom: "1px solid #f3f4f6",
          paddingBottom: "1rem",
        }}
      >
        <h3 style={{ margin: 0, border: "none", padding: 0 }}>
          <History
            size={20}
            style={{ marginRight: "8px", verticalAlign: "middle" }}
          />
          กิจกรรมล่าสุด
        </h3>
        <button
          onClick={() => navigate("/logs")}
          style={{
            background: "none",
            border: "none",
            color: "#3b82f6",
            cursor: "pointer",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          ดูทั้งหมด <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
          กำลังโหลด...
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
          ไม่มีกิจกรรมล่าสุด
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {logs.map((log) => {
            const style = getActionStyle(log.ActionType);
            return (
              <div
                key={log.LogID}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #f9fafb",
                }}
              >
                <div
                  style={{
                    minWidth: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: style.bg,
                    color: style.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                  }}
                >
                  {log.ActionType.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      color: "#1f2937",
                    }}
                  >
                    {log.Details}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#6b7280",
                      marginTop: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Clock size={12} />
                    {new Date(log.CreatedDate).toLocaleString("th-TH")}
                    <span style={{ margin: "0 4px" }}>•</span>
                    {log.ActorFirstName} {log.ActorLastName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LatestActivityWidget;
