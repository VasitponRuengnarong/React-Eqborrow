import React, { useState, useEffect } from "react";
import { Edit, Trash, ChevronLeft, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";
import "./Management.css"; // ใช้ CSS กลาง
import { apiFetch } from "./api";

const InstitutionManagement = () => {
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({ id: null, name: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null); // To check user role for authorization
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = institutions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(institutions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Fetch all institutions
  const fetchInstitutions = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/institutions");
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
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
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
      Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลก่อนกดเพิ่ม", "warning");
      return;
    }

    const url = isEditing
      ? `/api/institutions/${formData.id}`
      : "/api/institutions";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({ InstitutionName: formData.name }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "เกิดข้อผิดพลาด");
      }

      // Reset form and refetch data
      handleCancelEdit();
      await fetchInstitutions();
      Swal.fire(
        "สำเร็จ!",
        isEditing ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มข้อมูลสำเร็จ",
        "success",
      );
    } catch (err) {
      Swal.fire("เกิดข้อผิดพลาด!", err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการลบข้อมูลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiFetch(`/api/institutions/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "เกิดข้อผิดพลาดในการลบ");
          }
          await fetchInstitutions();
          Swal.fire("ลบสำเร็จ!", "ข้อมูลถูกลบเรียบร้อยแล้ว", "success");
        } catch (err) {
          Swal.fire("เกิดข้อผิดพลาด!", err.message, "error");
        }
      }
    });
  };

  const isAdminUser = user?.role === "Admin" || user?.role === "admin";

  return (
    <div className="management-page category-management-container">
      {" "}
      {/* Reusing category-management-container for consistent styling */}
      <h2>จัดการข้อมูลสำนัก</h2>
      {/* Form for Add/Edit */}
      <form
        onSubmit={handleSubmit}
        className="add-edit-form" // Add a class for styling
      >
        <div className="form-group">
          <label htmlFor="institutionName">ชื่อสำนัก</label>
          <input
            type="text"
            id="institutionName"
            placeholder={isEditing ? "ระบุชื่อสำนัก" : "ระบุชื่อสำนักใหม่"}
            value={formData.name}
            onChange={handleInputChange}
            disabled={!isAdminUser} // Disable if not admin
            className="form-input" // Add a class for styling
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {isEditing ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="btn btn-secondary" // Use existing button styles
          >
            ยกเลิก
          </button>
        )}
      </form>
      {/* Table of Institutions */}
      {isLoading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <div className="table-container">
          {" "}
          {/* Wrap table in container for consistent styling */}
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>ชื่อสำนัก</th>
                <th>การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((inst) => (
                <tr key={inst.InstitutionID}>
                  <td>{inst.InstitutionID}</td>
                  <td>{inst.InstitutionName}</td>
                  <td className="action-buttons">
                    <button
                      onClick={() => handleEditClick(inst)}
                      className="btn-icon btn-edit" // Use existing button styles
                      title="แก้ไข"
                      disabled={!isAdminUser} // Disable if not admin
                    >
                      <Edit size={18} color="blue" />
                    </button>
                    <button
                      onClick={() => handleDelete(inst.InstitutionID)}
                      className="btn-icon btn-delete" // Use existing button styles
                      title="ลบ"
                      disabled={!isAdminUser} // Disable if not admin
                    >
                      <Trash size={18} color="red" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {institutions.length > itemsPerPage && (
            <div className="pagination-container" style={{ marginTop: "1rem" }}>
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
  );
};

export default InstitutionManagement;
