import React, { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Save, ShoppingCart } from "lucide-react";
import "./BorrowRequest.css";
import Swal from "sweetalert2"; // Import SweetAlert2

const BorrowRequest = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    borrowDate: "",
    returnDate: "",
    purpose: "",
  });
  const [currentItem, setCurrentItem] = useState({
    productId: "",
    name: "",
    quantity: 1,
    remark: "",
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false); // Keep loading state

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
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
    }
  };

  const handleAddItem = () => {
    if (!currentItem.productId) {
      Swal.fire("ข้อผิดพลาด!", "กรุณาเลือกอุปกรณ์", "warning");
      return;
    }
    if (currentItem.quantity <= 0) {
      Swal.fire("ข้อผิดพลาด!", "จำนวนต้องมากกว่า 0", "warning");
      return;
    }

    // Check if item already exists
    const existingItemIndex = selectedItems.findIndex(
      (item) => item.productId === currentItem.productId,
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += parseInt(
        currentItem.quantity,
      );
      setSelectedItems(updatedItems);
    } else {
      setSelectedItems([...selectedItems, currentItem]);
    }

    // Reset current item selection
    setCurrentItem({
      productId: "",
      name: "",
      quantity: 1,
      remark: "",
    });
  };

  const handleRemoveItem = (index) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      Swal.fire("ข้อผิดพลาด!", "กรุณาเข้าสู่ระบบก่อนทำรายการ", "error");
      return;
    }
    if (!formData.borrowDate || !formData.returnDate || !formData.purpose) {
      Swal.fire("ข้อผิดพลาด!", "กรุณากรอกข้อมูลให้ครบถ้วน", "warning");
      return;
    }
    if (selectedItems.length === 0) {
      Swal.fire(
        "ข้อผิดพลาด!",
        "กรุณาเลือกอุปกรณ์อย่างน้อย 1 รายการ",
        "warning",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/borrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`, // Add Authorization header
        },
        body: JSON.stringify({
          userId: user.id,
          borrowDate: formData.borrowDate,
          returnDate: formData.returnDate,
          purpose: formData.purpose,
          items: selectedItems,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire("สำเร็จ!", "บันทึกคำขอสำเร็จ", "success");
        setFormData({ borrowDate: "", returnDate: "", purpose: "" });
        setSelectedItems([]);
      } else {
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          data.message || "เกิดข้อผิดพลาดในการบันทึกคำขอ",
          "error",
        );
      }
    } catch (error) {
      Swal.fire(
        "เกิดข้อผิดพลาด!",
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="borrow-request-page">
      <div className="page-header">
        <h1>ยืมสินค้า</h1>
        <p>กรอกแบบฟอร์มเพื่อขอยืมอุปกรณ์</p>
      </div>

      <div className="borrow-container">
        <form onSubmit={handleSubmit} className="borrow-form">
          <div className="form-section">
            <h3>
              <Calendar size={20} /> ข้อมูลการยืม
            </h3>
            <div className="form-row">
              <div className="form-group">
                <input
                  type="date"
                  value={formData.borrowDate}
                  onChange={(e) =>
                    setFormData({ ...formData, borrowDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) =>
                    setFormData({ ...formData, returnDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <textarea
                rows="3"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                placeholder="ระบุเหตุผลการยืม..."
                required
              ></textarea>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <ShoppingCart size={20} /> รายการอุปกรณ์
            </h3>
            <div className="add-item-box">
              <div className="form-row">
                <div className="form-group flex-grow">
                  <select
                    value={currentItem.productId}
                    onChange={(e) => {
                      const product = products.find(
                        (p) => p.ProductID === parseInt(e.target.value),
                      );
                      setCurrentItem({
                        ...currentItem,
                        productId: e.target.value,
                        name: product ? product.ProductName : "",
                      });
                    }}
                  >
                    <option value="">-- เลือกรายการ --</option>
                    {products.map((p) => (
                      <option key={p.ProductID} value={p.ProductID}>
                        {p.ProductName} (คงเหลือ: {p.Quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group w-100">
                  <input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        quantity: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  value={currentItem.remark}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, remark: e.target.value })
                  }
                  placeholder="เช่น ขอสายชาร์จด้วย"
                />
              </div>
              <button type="button" className="add-btn" onClick={handleAddItem}>
                <Plus size={16} /> เพิ่มรายการ
              </button>
            </div>

            {selectedItems.length > 0 && (
              <div className="items-table-wrapper">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>รายการ</th>
                      <th>จำนวน</th>
                      <th>หมายเหตุ</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.remark || "-"}</td>
                        <td>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              <Save size={18} /> {loading ? "กำลังบันทึก..." : "ยืนยันการยืม"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowRequest;
