import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Image as ImageIcon,
  Save,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import "./ProductManagement.css";

const ITEMS_PER_PAGE = 10;

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState("products"); // 'products' or 'categories'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const initialFormState = {
    ProductID: null,
    ProductName: "",
    ProductCode: "",
    Price: "",
    Quantity: "",
    Description: "",
    Image: "",
    CategoryID: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  // State for Categories CRUD
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/product-categories");
      if (response.ok) {
        setCategories(await response.json());
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Clear search term when switching tabs
  useEffect(() => {
    setSearchTerm("");
    setCurrentPage(1);
  }, [activeTab]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, Image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing
      ? `/api/products/${formData.ProductID}`
      : "/api/products";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(isEditing ? "แก้ไขสินค้าสำเร็จ" : "เพิ่มสินค้าสำเร็จ");
        fetchProducts();
        resetForm();
      } else {
        alert("เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleEdit = (product) => {
    setFormData({ ...product, CategoryID: product.CategoryID || "" });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?")) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchProducts();
        }
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setShowForm(false);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.ProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ProductCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination Logic
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const filteredCategories = categories.filter((cat) =>
    cat.CategoryName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- Category CRUD Handlers ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || isAddingCategory) return;

    setIsAddingCategory(true);
    try {
      const res = await fetch("/api/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CategoryName: newCategoryName }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewCategoryName("");
        fetchCategories();
      } else {
        alert(data.message || "เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleUpdateCategory = async (id) => {
    if (!editingCategoryName.trim()) return;
    try {
      const res = await fetch(`/api/product-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CategoryName: editingCategoryName }),
      });
      if (res.ok) {
        setEditingCategoryId(null);
        setEditingCategoryName("");
        fetchCategories();
      }
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("ยืนยันการลบหมวดหมู่นี้?")) return;
    try {
      const res = await fetch(`/api/product-categories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <div className="product-management">
      <div className="pm-header">
        <h2>
          <Package className="header-icon" />
          จัดการข้อมูลสินค้า
        </h2>
        {!showForm && activeTab === "products" && (
          <button className="btn-add" onClick={() => setShowForm(true)}>
            <Plus size={18} /> เพิ่มสินค้าใหม่
          </button>
        )}
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          รายการสินค้า
        </button>
        <button
          className={`tab-btn ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          หมวดหมู่สินค้า
        </button>
      </div>

      {activeTab === "products" && (
        <>
          {showForm ? (
            <div className="product-form-card">
              <div className="form-header">
                <h3>{isEditing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h3>
                <button className="btn-close" onClick={resetForm}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>ชื่อสินค้า</label>
                    <input
                      type="text"
                      name="ProductName"
                      value={formData.ProductName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>รหัสสินค้า</label>
                    <input
                      type="text"
                      name="ProductCode"
                      value={formData.ProductCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>หมวดหมู่สินค้า</label>
                    <select
                      name="CategoryID"
                      value={formData.CategoryID}
                      onChange={handleInputChange}
                    >
                      <option value="">-- เลือกหมวดหมู่ --</option>
                      {categories.map((cat) => (
                        <option key={cat.CategoryID} value={cat.CategoryID}>
                          {cat.CategoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ราคา (บาท)</label>
                    <input
                      type="number"
                      name="Price"
                      value={formData.Price}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>จำนวนคงเหลือ</label>
                    <input
                      type="number"
                      name="Quantity"
                      value={formData.Quantity}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>รายละเอียด</label>
                    <textarea
                      name="Description"
                      rows="3"
                      value={formData.Description}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  <div className="form-group full-width">
                    <label>รูปภาพสินค้า</label>
                    <div className="image-upload-container">
                      <label
                        htmlFor="product-image"
                        className="image-upload-label"
                      >
                        <ImageIcon size={24} />
                        <span>
                          {formData.Image ? "เปลี่ยนรูปภาพ" : "อัปโหลดรูปภาพ"}
                        </span>
                      </label>
                      <input
                        type="file"
                        id="product-image"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                      />
                      {formData.Image && (
                        <img
                          src={formData.Image}
                          alt="Preview"
                          className="image-preview-box"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={resetForm}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn-save">
                    <Save size={18} /> บันทึก
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อ หรือ รหัสสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>รูปภาพ</th>
                      <th>รหัสสินค้า</th>
                      <th>หมวดหมู่</th>
                      <th>ชื่อสินค้า</th>
                      <th>ราคา</th>
                      <th>คงเหลือ</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          กำลังโหลด...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          ไม่พบข้อมูลสินค้า
                        </td>
                      </tr>
                    ) : (
                      currentProducts.map((product) => (
                        <tr key={product.ProductID}>
                          <td>
                            <img
                              src={
                                product.Image ||
                                "https://via.placeholder.com/50"
                              }
                              alt={product.ProductName}
                              className="product-thumb"
                            />
                          </td>
                          <td>{product.ProductCode}</td>
                          <td>{product.CategoryName || "-"}</td>
                          <td>{product.ProductName}</td>
                          <td>{Number(product.Price).toLocaleString()}</td>
                          <td>
                            <span
                              className={`badge ${product.Quantity > 0 ? "success" : "danger"}`}
                            >
                              {product.Quantity}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-icon edit"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="btn-icon delete"
                                onClick={() => handleDelete(product.ProductID)}
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

              {/* Pagination Controls */}
              {filteredProducts.length > 0 && (
                <div className="pagination">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="page-btn"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="page-info">
                    หน้า {currentPage} จาก {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="page-btn"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === "categories" && (
        <div className="crud-section">
          <div className="crud-header">
            <div className="crud-controls">
              <div className="search-bar mini">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="ค้นหาหมวดหมู่..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="add-row">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="ชื่อหมวดหมู่ใหม่..."
                  disabled={isAddingCategory}
                />
                <button
                  className="btn-add-mini"
                  onClick={handleAddCategory}
                  disabled={isAddingCategory || !newCategoryName.trim()}
                >
                  {isAddingCategory ? (
                    <div className="spinner-mini" />
                  ) : (
                    <Plus size={16} />
                  )}
                  เพิ่ม
                </button>
              </div>
            </div>
          </div>
          <div className="table-container">
            <table className="product-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ชื่อหมวดหมู่</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.CategoryID}>
                    <td style={{ width: "50px" }}>{cat.CategoryID}</td>
                    <td>
                      {editingCategoryId === cat.CategoryID ? (
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) =>
                            setEditingCategoryName(e.target.value)
                          }
                          className="edit-input"
                        />
                      ) : (
                        cat.CategoryName
                      )}
                    </td>
                    <td style={{ width: "100px" }}>
                      <div className="action-buttons">
                        {editingCategoryId === cat.CategoryID ? (
                          <>
                            <button
                              className="btn-icon save"
                              onClick={() =>
                                handleUpdateCategory(cat.CategoryID)
                              }
                            >
                              <Save size={16} />
                            </button>
                            <button
                              className="btn-icon cancel"
                              onClick={() => setEditingCategoryId(null)}
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-icon edit"
                              onClick={() => {
                                setEditingCategoryId(cat.CategoryID);
                                setEditingCategoryName(cat.CategoryName);
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() =>
                                handleDeleteCategory(cat.CategoryID)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
