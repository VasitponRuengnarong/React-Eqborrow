import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import "./CategoryManagement.css"; // We'll create this CSS file
import { apiFetch } from "./api";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // To check user role for authorization

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null); // For editing
  const [categoryName, setCategoryName] = useState("");

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/categories");
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลหมวดหมู่ได้");
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const openModal = (category = null) => {
    setCurrentCategory(category);
    setCategoryName(category ? category.CategoryName : "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
    setCategoryName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = currentCategory
      ? `/api/categories/${currentCategory.CategoryID}`
      : "/api/categories";
    const method = currentCategory ? "PUT" : "POST";

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({ CategoryName: categoryName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "เกิดข้อผิดพลาด");
      }

      Swal.fire({
        icon: "success",
        title: currentCategory ? "แก้ไขสำเร็จ!" : "เพิ่มสำเร็จ!",
        text: result.message,
        timer: 1500,
        showConfirmButton: false,
      });

      closeModal();
      fetchCategories(); // Refresh list
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
      });
    }
  };

  const handleDelete = (category) => {
    Swal.fire({
      title: `คุณแน่ใจหรือไม่ที่จะลบ "${category.CategoryName}"?`,
      text: "การกระทำนี้ไม่สามารถย้อนกลับได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiFetch(
            `/api/categories/${category.CategoryID}`,
            {
              method: "DELETE",
            },
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "เกิดข้อผิดพลาดในการลบ");
          }

          Swal.fire("ลบสำเร็จ!", "หมวดหมู่ถูกลบเรียบร้อยแล้ว", "success");
          fetchCategories(); // Refresh list
        } catch (err) {
          Swal.fire("เกิดข้อผิดพลาด!", err.message, "error");
        }
      }
    });
  };

  const isAdminUser = user?.role === "Admin";

  if (isLoading) return <div className="loading-container">กำลังโหลด...</div>;
  if (error) return <div className="error-container">ข้อผิดพลาด: {error}</div>; // Keep for initial fetch error

  return (
    <div className="category-management-container">
      <div className="page-header">
        <h1>จัดการหมวดหมู่สินค้า</h1>
        {isAdminUser && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            <span>เพิ่มหมวดหมู่</span>
          </button>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อหมวดหมู่</th>
              <th>การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <tr key={cat.CategoryID}>
                  <td>{cat.CategoryID}</td>
                  <td>{cat.CategoryName}</td>
                  <td className="action-buttons">
                    {isAdminUser && (
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => openModal(cat)}
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {isAdminUser && (
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(cat)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-data">
                  ไม่พบข้อมูลหมวดหมู่
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{currentCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  disabled={!isAdminUser} // Disable if not admin
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!isAdminUser} // Disable if not admin
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
