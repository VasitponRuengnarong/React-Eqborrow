import React, { useState, useEffect } from "react";
import { Edit, Trash, PlusCircle } from "lucide-react";
// You might want to create a specific CSS file for this component
// import './Management.css';
import { API_BASE_URL } from "../config";

const InstitutionManagement = () => {
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({ id: null, name: "" });
  const [isEditing, setIsEditing] = useState(false);

  // Fetch all institutions
  const fetchInstitutions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/institutions`);
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const data = await response.json();
      setInstitutions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({ id: null, name: "" });
  };

  const handleEditClick = (inst) => {
    setIsEditing(true);
    setFormData({ id: inst.InstitutionID, name: inst.InstitutionName });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("กรุณากรอกชื่อสำนัก");
      return;
    }

    const url = isEditing
      ? `${API_BASE_URL}/api/institutions/${formData.id}`
      : `${API_BASE_URL}/api/institutions`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ InstitutionName: formData.name }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "เกิดข้อผิดพลาด");
      }

      // Reset form and refetch data
      handleCancelEdit();
      await fetchInstitutions();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/institutions/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "เกิดข้อผิดพลาดในการลบ");
        }
        await fetchInstitutions();
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="management-page" style={{ padding: "2rem" }}>
      <h2>จัดการข้อมูลสำนัก</h2>

      {/* Form for Add/Edit */}
      <form
        onSubmit={handleSubmit}
        style={{ marginBottom: "2rem", display: "flex", gap: "1rem" }}
      >
        <input
          type="text"
          placeholder={isEditing ? "แก้ไขชื่อสำนัก" : "เพิ่มชื่อสำนักใหม่"}
          value={formData.name}
          onChange={handleInputChange}
          style={{ padding: "0.5rem", flexGrow: 1 }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          {isEditing ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleCancelEdit}
            style={{ padding: "0.5rem 1rem" }}
          >
            ยกเลิก
          </button>
        )}
      </form>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}

      {/* Table of Institutions */}
      {isLoading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>ID</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>
                ชื่อสำนัก
              </th>
              <th style={{ textAlign: "right", padding: "0.5rem" }}>
                การกระทำ
              </th>
            </tr>
          </thead>
          <tbody>
            {institutions.map((inst) => (
              <tr
                key={inst.InstitutionID}
                style={{ borderBottom: "1px solid #eee" }}
              >
                <td style={{ padding: "0.5rem" }}>{inst.InstitutionID}</td>
                <td style={{ padding: "0.5rem" }}>{inst.InstitutionName}</td>
                <td style={{ textAlign: "right", padding: "0.5rem" }}>
                  <button
                    onClick={() => handleEditClick(inst)}
                    style={{
                      marginRight: "0.5rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    title="แก้ไข"
                  >
                    <Edit size={18} color="blue" />
                  </button>
                  <button
                    onClick={() => handleDelete(inst.InstitutionID)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    title="ลบ"
                  >
                    <Trash size={18} color="red" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InstitutionManagement;
