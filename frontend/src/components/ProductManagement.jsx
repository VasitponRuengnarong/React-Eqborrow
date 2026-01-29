import React, { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Plus,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import "./ProductManagement.css";
import "./Management.css";
import Swal from "sweetalert2";
import { apiFetch } from "./api";

// รูปภาพ Default สำหรับสินค้า
const defaultProductImage = "/logo.png"; // ใช้รูปในเครื่องแทนเพื่อป้องกัน Error เน็ตหลุด

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState("products"); // products, categories, statuses
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState(""); // State สำหรับกรองหมวดหมู่
  const [filterStatus, setFilterStatus] = useState(""); // State สำหรับกรองสถานะ

  // State สำหรับเพิ่มสินค้าใหม่
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    ProductName: "",
    ProductCode: "",
    CategoryID: "",
    StatusID: "",
    Image: "",
  });

  // State สำหรับการแก้ไข (Edit Modal)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState({
    ProductID: null,
    ProductName: "",
    ProductCode: "",
    CategoryID: "",
    StatusID: "",
    Image: "", // รูปใหม่ที่อัปโหลด (Base64)
    currentImage: "", // รูปเดิม (URL/Base64)
  });

  // Master Data (สำหรับ Dropdown และ CRUD ย่อย)
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // State สำหรับ CRUD ตารางย่อย (Categories, Statuses)
  const [newItemName, setNewItemName] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [isMasterDataModalOpen, setIsMasterDataModalOpen] = useState(false);
  const [masterDataType, setMasterDataType] = useState(""); // 'category' or 'status'

  // ดึงข้อมูล User เพื่อเช็คสิทธิ์ (Admin)
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchMasterData();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const isAdminUser = user?.role === "Admin" || user?.role === "admin";

  // --- 1. Fetch Data Section ---
  const fetchProducts = async () => {
    try {
      const response = await apiFetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [catRes, statusRes] = await Promise.all([
        apiFetch("/api/categories"), // API หมวดหมู่สินค้า
        apiFetch("/api/device-statuses"), // API สถานะสินค้า (แก้ไขให้ตรงกับ TB_M_StatusDevice)
      ]);

      if (catRes.ok) setCategories(await catRes.json());
      if (statusRes.ok) setStatuses(await statusRes.json());
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  // --- 2. Main Product Actions (Edit/Delete) ---
  const handleEditClick = (product) => {
    setEditingProduct({
      ProductID: product.ProductID,
      ProductName: product.ProductName,
      ProductCode: product.ProductCode,
      CategoryID: product.CategoryID,
      StatusID: product.StatusID,
      Image: "", // รีเซ็ตค่ารูปใหม่
      currentImage: product.Image || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (
      !editingProduct.ProductName ||
      !editingProduct.ProductCode ||
      !editingProduct.CategoryID ||
      !editingProduct.StatusID
    ) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน", "warning");
      return;
    }

    try {
      const body = {
        ProductName: editingProduct.ProductName,
        ProductCode: editingProduct.ProductCode,
        CategoryID: editingProduct.CategoryID,
        StatusID: editingProduct.StatusID,
      };

      // ส่งรูปภาพไปเฉพาะเมื่อมีการอัปโหลดใหม่
      if (editingProduct.Image) {
        body.Image = editingProduct.Image;
      }

      const response = await apiFetch(
        `/api/products/${editingProduct.ProductID}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        Swal.fire("สำเร็จ", "อัปเดตข้อมูลครุภัณฑ์สำเร็จ", "success");
        setIsEditModalOpen(false);
        fetchProducts();
      } else {
        const errorData = await response.json();
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          errorData.message || "อัปเดตไม่สำเร็จ",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating product:", error);
      Swal.fire("Error", "ไม่สามารถเชื่อมต่อ Server ได้", "error");
    }
  };

  const handleEditProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({ ...editingProduct, Image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "ยืนยันการลบ?",
      text: "คุณต้องการลบรายการสินค้านี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiFetch(`/api/products/${id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            Swal.fire("ลบสำเร็จ!", "ข้อมูลถูกลบเรียบร้อยแล้ว", "success");
            fetchProducts();
          } else {
            Swal.fire("ผิดพลาด", "ไม่สามารถลบข้อมูลได้", "error");
          }
        } catch (error) {
          Swal.fire("Error", "Connection Error", "error");
        }
      }
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (
      !newProduct.ProductName ||
      !newProduct.ProductCode ||
      !newProduct.CategoryID ||
      !newProduct.StatusID
    ) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน", "warning");
      return;
    }

    try {
      const response = await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        Swal.fire("สำเร็จ", "เพิ่มสินค้าเรียบร้อยแล้ว", "success");
        setIsAddModalOpen(false);
        setNewProduct({
          ProductName: "",
          ProductCode: "",
          CategoryID: "",
          StatusID: "",
          Image: "",
        });
        fetchProducts();
      } else {
        const errorData = await response.json();
        Swal.fire(
          "ผิดพลาด",
          errorData.message || "เพิ่มสินค้าไม่สำเร็จ",
          "error",
        );
      }
    } catch (error) {
      console.error("Error adding product:", error);
      Swal.fire("Error", "Connection Error", "error");
    }
  };

  const handleNewProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, Image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- 3. Sub-Table CRUD Logic (Categories/Statuses) ---
  const handleSaveMasterData = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลก่อนกดบันทึก", "warning");
      return;
    }

    let endpoint = "";
    let method = "POST";
    let body = {};

    if (masterDataType === "category") {
      endpoint = editingItemId
        ? `/api/categories/${editingItemId}`
        : "/api/categories";
      body = { CategoryName: newItemName };
    } else if (masterDataType === "status") {
      endpoint = editingItemId
        ? `/api/device-statuses/${editingItemId}`
        : "/api/device-statuses";
      body = { StatusNameDV: newItemName }; // แก้ไข Key ให้ตรงกับ DB (StatusNameDV)
    }

    if (editingItemId) {
      method = "PUT";
    }

    try {
      const res = await apiFetch(endpoint, {
        method: method,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        Swal.fire(
          "สำเร็จ",
          editingItemId ? "แก้ไขข้อมูลเรียบร้อย" : "เพิ่มข้อมูลเรียบร้อย",
          "success",
        );
        setNewItemName("");
        setEditingItemId(null);
        setIsMasterDataModalOpen(false);
        fetchMasterData();
      } else {
        // ตรวจสอบว่า Response เป็น JSON หรือไม่ เพื่อป้องกัน Error SyntaxError
        const contentType = res.headers.get("content-type");
        let errorMessage = "ไม่สามารถดำเนินการได้";

        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          errorMessage = `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${res.status}): API Not Found`;
        }
        Swal.fire("ผิดพลาด", errorMessage, "error");
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleDeleteItem = async (type, id) => {
    Swal.fire({
      title: "ยืนยันการลบ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ลบ",
    }).then(async (result) => {
      if (result.isConfirmed) {
        let endpoint = "";
        if (type === "category") endpoint = `/api/categories/${id}`;
        else if (type === "status") endpoint = `/api/device-statuses/${id}`;

        try {
          const res = await apiFetch(endpoint, {
            method: "DELETE",
          });
          if (res.ok) {
            Swal.fire("สำเร็จ", "ลบข้อมูลเรียบร้อย", "success");
            fetchMasterData();
          }
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  // Helper function to map Thai status names to CSS classes
  const getDeviceStatusClass = (statusName) => {
    switch (statusName) {
      case "ว่าง":
        return "available";
      case "ถูกยืม":
        return "borrowed";
      case "ส่งซ่อม":
        return "maintenance";
      case "ชำรุด":
        return "broken";
      case "สูญหาย":
        return "lost";
      default:
        return "default";
    }
  };

  // --- 4. Filtering ---
  const filteredProducts = products.filter(
    (p) =>
      ((p.ProductName &&
        p.ProductName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.ProductCode &&
          p.ProductCode.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (filterCategory ? p.CategoryID?.toString() === filterCategory : true) && // กรองหมวดหมู่
      (filterStatus ? p.StatusID?.toString() === filterStatus : true), // กรองสถานะ
  );

  // --- 5. Helper Function for Rendering Sub-Tables ---
  const renderCrudTable = (title, items, type, idKey, nameKey) => (
    <div className="crud-section">
      <div className="crud-header">
        <h3>{title}</h3>
        {isAdminUser && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setMasterDataType(type);
              setNewItemName("");
              setEditingItemId(null); // Reset ID เพื่อระบุว่าเป็นการเพิ่มใหม่
              setIsMasterDataModalOpen(true);
            }}
          >
            <Plus size={16} /> เพิ่ม{title}
          </button>
        )}
      </div>
      <div className="table-container">
        <table className="member-table">
          <thead>
            <tr>
              <th className="th-center" style={{ width: "80px" }}>
                ID
              </th>
              <th>ชื่อ</th>
              <th className="th-center" style={{ width: "120px" }}>
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item[idKey]}>
                <td className="td-center">{item[idKey]}</td>
                <td>{item[nameKey]}</td>
                <td>
                  <div className="action-buttons action-center">
                    <button
                      className="btn-icon edit"
                      onClick={() => {
                        setMasterDataType(type);
                        setEditingItemId(item[idKey]);
                        setNewItemName(item[nameKey]);
                        setIsMasterDataModalOpen(true);
                      }}
                      disabled={!isAdminUser}
                      aria-label={`แก้ไข ${item[nameKey]}`}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDeleteItem(type, item[idKey])}
                      disabled={!isAdminUser}
                      aria-label={`ลบ ${item[nameKey]}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- 6. Main Render ---
  return (
    <div className="member-management">
      {" "}
      {/* ใช้ Class เดิมเพื่อให้ CSS ทำงานได้เลย */}
      <div className="page-header">
        <h2>จัดการข้อมูลสินค้า</h2>
        <p>จัดการรายการสินค้า, หมวดหมู่, และสถานะ</p>
      </div>
      <div className="tabs-container" role="tablist">
        {["products", "categories", "statuses"].map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "products" && "รายการสินค้า"}
            {tab === "categories" && "หมวดหมู่สินค้า"}
            {tab === "statuses" && "สถานะสินค้า"}
          </button>
        ))}
      </div>
      {activeTab === "products" && (
        <>
          <div className="filter-bar">
            <div className="search-bar search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="ค้นหาชื่อสินค้า หรือ รหัสสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="ค้นหาสินค้า"
              />
            </div>

            {/* Dropdown กรองหมวดหมู่ */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
              aria-label="กรองตามหมวดหมู่"
            >
              <option value="">ทั้งหมด (หมวดหมู่)</option>
              {categories.map((c) => (
                <option key={c.CategoryID} value={c.CategoryID}>
                  {c.CategoryName}
                </option>
              ))}
            </select>

            {/* Dropdown กรองสถานะ */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
              aria-label="กรองตามสถานะ"
            >
              <option value="">ทั้งหมด (สถานะ)</option>
              {statuses.map((s) => (
                <option key={s.DVStatusID} value={s.DVStatusID}>
                  {s.StatusNameDV}
                </option>
              ))}
            </select>

            {isAdminUser && (
              <button
                className="btn btn-primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={18} /> เพิ่มสินค้า
              </button>
            )}
          </div>

          <div className="table-container">
            <table className="member-table">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th>รหัสสินค้า</th>
                  <th>หมวดหมู่</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      ไม่พบข้อมูลสินค้า
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.ProductID}>
                      <td>
                        <div className="user-cell">
                          <img
                            src={p.Image || defaultProductImage}
                            alt={p.ProductName}
                            className="avatar-circle product-zoom"
                          />
                          <div className="user-name">{p.ProductName}</div>
                        </div>
                      </td>
                      <td>{p.ProductCode}</td>
                      <td>
                        <span className="role-badge">{p.CategoryName}</span>
                      </td>
                      <td>
                        <span
                          className={`status-dot ${getDeviceStatusClass(p.StatusNameDV)}`}
                        >
                          {p.StatusNameDV}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon edit"
                            onClick={() => handleEditClick(p)}
                            disabled={!isAdminUser}
                            aria-label={`แก้ไข ${p.ProductName}`}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(p.ProductID)}
                            disabled={!isAdminUser}
                            aria-label={`ลบ ${p.ProductName}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {activeTab === "categories" &&
        renderCrudTable(
          "จัดการหมวดหมู่",
          categories,
          "category",
          "CategoryID",
          "CategoryName",
        )}
      {activeTab === "statuses" &&
        renderCrudTable(
          "จัดการสถานะสินค้า",
          statuses,
          "status",
          "DVStatusID",
          "StatusNameDV",
        )}
      {/* Modal เพิ่มสินค้า */}
      {isAddModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-modal-title"
        >
          <div className="modal-content">
            <h2 id="add-modal-title">เพิ่มสินค้าใหม่</h2>
            <form onSubmit={handleAddProduct} className="product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="addProductName">ชื่อสินค้า</label>
                  <input
                    id="addProductName"
                    type="text"
                    value={newProduct.ProductName}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        ProductName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addProductCode">รหัสสินค้า</label>
                  <input
                    id="addProductCode"
                    type="text"
                    value={newProduct.ProductCode}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        ProductCode: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addProductCategory">หมวดหมู่</label>
                  <select
                    id="addProductCategory"
                    value={newProduct.CategoryID}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        CategoryID: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map((c) => (
                      <option key={c.CategoryID} value={c.CategoryID}>
                        {c.CategoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="addProductStatus">สถานะ</label>
                  <select
                    id="addProductStatus"
                    value={newProduct.StatusID}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, StatusID: e.target.value })
                    }
                    required
                  >
                    <option value="">-- เลือกสถานะ --</option>
                    {statuses.map((s) => (
                      <option key={s.DVStatusID} value={s.DVStatusID}>
                        {s.StatusNameDV}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label htmlFor="addProductImage">รูปภาพ</label>
                  <div className="image-upload-wrapper">
                    <div className="image-preview">
                      {newProduct.Image ? (
                        <img src={newProduct.Image} alt="Preview" />
                      ) : (
                        <div className="image-placeholder">ไม่มีรูปภาพ</div>
                      )}
                    </div>
                    <input
                      id="addProductImage"
                      type="file"
                      accept="image/*"
                      onChange={handleNewProductImageChange}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal แก้ไขสินค้า */}
      {isEditModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div className="modal-content">
            <h2 id="edit-modal-title">แก้ไขข้อมูลสินค้า</h2>
            <form onSubmit={handleUpdateProduct} className="product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="editProductName">ชื่อสินค้า</label>
                  <input
                    id="editProductName"
                    type="text"
                    value={editingProduct.ProductName}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        ProductName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editProductCode">รหัสสินค้า</label>
                  <input
                    id="editProductCode"
                    type="text"
                    value={editingProduct.ProductCode}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        ProductCode: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editProductCategory">หมวดหมู่</label>
                  <select
                    id="editProductCategory"
                    value={editingProduct.CategoryID}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        CategoryID: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map((c) => (
                      <option key={c.CategoryID} value={c.CategoryID}>
                        {c.CategoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="editProductStatus">สถานะ</label>
                  <select
                    id="editProductStatus"
                    value={editingProduct.StatusID}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        StatusID: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">-- เลือกสถานะ --</option>
                    {statuses.map((s) => (
                      <option key={s.DVStatusID} value={s.DVStatusID}>
                        {s.StatusNameDV}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label htmlFor="editProductImage">
                    รูปภาพ (อัปโหลดใหม่เพื่อเปลี่ยน)
                  </label>
                  <div className="image-upload-wrapper">
                    <div className="image-preview">
                      <img
                        src={
                          editingProduct.Image ||
                          editingProduct.currentImage ||
                          defaultProductImage
                        }
                        alt="Preview"
                      />
                    </div>
                    <input
                      id="editProductImage"
                      type="file"
                      accept="image/*"
                      onChange={handleEditProductImageChange}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal เพิ่มหมวดหมู่/สถานะ */}
      {isMasterDataModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="master-modal-title"
        >
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <h2 id="master-modal-title">
              {masterDataType === "category"
                ? editingItemId
                  ? "แก้ไขหมวดหมู่สินค้า"
                  : "เพิ่มหมวดหมู่สินค้า"
                : editingItemId
                  ? "แก้ไขสถานะสินค้า"
                  : "เพิ่มสถานะสินค้า"}
            </h2>
            <form onSubmit={handleSaveMasterData}>
              <div className="form-group">
                <label htmlFor="masterDataName">
                  {masterDataType === "category" ? "ชื่อหมวดหมู่" : "ชื่อสถานะ"}
                </label>
                <input
                  id="masterDataName"
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="กรอกข้อมูล..."
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsMasterDataModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
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

export default ProductManagement;
