import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Image as ImageIcon,
  Save,
} from "lucide-react";
import "./ProductManagement.css";

const ProductManagement = () => {
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
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchProducts();
  }, []);

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
    setFormData(product);
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

  return (
    <div className="product-management">
      <div className="pm-header">
        <h2>จัดการสินค้า</h2>
        {!showForm && (
          <button className="btn-add" onClick={() => setShowForm(true)}>
            <Plus size={18} /> เพิ่มสินค้าใหม่
          </button>
        )}
      </div>

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
                  <label htmlFor="product-image" className="image-upload-label">
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
              <button type="button" className="btn-cancel" onClick={resetForm}>
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
                  filteredProducts.map((product) => (
                    <tr key={product.ProductID}>
                      <td>
                        <img
                          src={
                            product.Image || "https://via.placeholder.com/50"
                          }
                          alt={product.ProductName}
                          className="product-thumb"
                        />
                      </td>
                      <td>{product.ProductCode}</td>
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
        </>
      )}
    </div>
  );
};

export default ProductManagement;
