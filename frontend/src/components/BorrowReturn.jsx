import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Save,
  FileText,
  User,
  Briefcase,
  Repeat,
  CheckCircle,
  Search,
} from "lucide-react";
import "./BorrowReturn.css";
import Swal from "sweetalert2";
import { apiFetch } from "./api";

const BorrowReturn = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("borrow"); // 'borrow' or 'return'
  const [activeBorrows, setActiveBorrows] = useState([]); // List of items to return
  const [masterData, setMasterData] = useState({
    institutions: [],
    departments: [],
  });
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    borrowDate: new Date().toISOString().split("T")[0],
    returnDate: "",
    purpose: "",
    items: [],
  });

  const [newItem, setNewItem] = useState({ name: "", quantity: 1, remark: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchMasterData = async () => {
      try {
        const [instRes, deptRes, prodRes] = await Promise.all([
          apiFetch("/api/institutions"),
          apiFetch("/api/departments"),
          apiFetch("/api/products"),
        ]);
        if (instRes.ok && deptRes.ok) {
          const institutions = await instRes.json();
          const departments = await deptRes.json();
          setMasterData({ institutions, departments });
        }
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods);
        }
      } catch (error) {
        console.error("Error fetching master data", error);
      }
    };
    fetchMasterData();
  }, []);

  const fetchActiveBorrows = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/borrows/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        // Filter only Approved items that can be returned
        const approved = data.filter((item) => item.Status === "Approved");
        setActiveBorrows(approved);
      }
    } catch (error) {
      console.error("Error fetching active borrows:", error);
    }
  }, [user]);

  // Fetch active borrows when switching to 'return' tab
  useEffect(() => {
    if (activeTab === "return" && user?.id) {
      fetchActiveBorrows();
    }
  }, [activeTab, user, fetchActiveBorrows]);

  const getDepartmentName = (id) => {
    const dept = masterData.departments.find((d) => d.DepartmentID === id);
    return dept ? dept.DepartmentName : "-";
  };

  const getInstitutionName = (id) => {
    const inst = masterData.institutions.find((i) => i.InstitutionID === id);
    return inst ? inst.InstitutionName : "-";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setNewItem({ ...newItem, name: value });

    if (value.trim().length > 0) {
      const lowerVal = value.toLowerCase();
      const filtered = products.filter(
        (p) =>
          (p.DeviceName && p.DeviceName.toLowerCase().includes(lowerVal)) ||
          (p.DeviceCode && p.DeviceCode.toLowerCase().includes(lowerVal)),
      );
      setSuggestions(filtered.slice(0, 10)); // Limit suggestions
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (product) => {
    setNewItem({ ...newItem, name: product.DeviceName });
    setShowSuggestions(false);
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const addItem = () => {
    if (newItem.name.trim() === "") return;

    // Check stock availability
    const targetName = newItem.name.trim().toLowerCase();
    const matchingProducts = products.filter(
      (p) => p.DeviceName && p.DeviceName.toLowerCase() === targetName,
    );

    if (matchingProducts.length > 0) {
      const totalAvailable = matchingProducts.reduce((sum, p) => {
        return p.StatusNameDV === "ว่าง" ? sum + (p.Quantity || 0) : sum;
      }, 0);

      const inCartQty = formData.items.reduce((sum, item) => {
        return item.name.toLowerCase() === targetName
          ? sum + parseInt(item.quantity || 0)
          : sum;
      }, 0);

      const requestQty = parseInt(newItem.quantity || 0);

      if (inCartQty + requestQty > totalAvailable) {
        Swal.fire("แจ้งเตือน", `จำนวนอุปกรณ์ไม่เพียงพอ (คงเหลือ: ${totalAvailable})`, "warning");
        return;
      }
    } else {
      Swal.fire("แจ้งเตือน", "ไม่พบข้อมูลอุปกรณ์นี้ในระบบ กรุณาเลือกจากรายการแนะนำ", "warning");
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem, id: Date.now() }],
    });
    setNewItem({ name: "", quantity: 1, remark: "" });
  };

  const removeItem = (id) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== id),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      Swal.fire("แจ้งเตือน", "กรุณาเพิ่มรายการอุปกรณ์อย่างน้อย 1 รายการ", "warning");
      return;
    }

    if (!user || !user.id) {
      Swal.fire("แจ้งเตือน", "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่", "error");
      return;
    }

    try {
      const response = await apiFetch("/api/borrow", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          borrowDate: formData.borrowDate,
          returnDate: formData.returnDate,
          purpose: formData.purpose,
          items: formData.items,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire("สำเร็จ", "บันทึกข้อมูลการยืมเรียบร้อยแล้ว", "success");
        // รีเซ็ตฟอร์มหลังจากบันทึกสำเร็จ
        setFormData({ ...formData, purpose: "", items: [] });
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
      }
    } catch (error) {
      console.error("Error submitting borrow form:", error);
      Swal.fire("เกิดข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "error");
    }
  };

  const handleReturn = async (borrowId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการคืน?',
      text: "คุณต้องการแจ้งคืนอุปกรณ์รายการนี้ใช่หรือไม่?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ใช่, คืนอุปกรณ์',
      cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await apiFetch(`/api/borrows/${borrowId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Returned" }),
      });

      if (response.ok) {
        Swal.fire("สำเร็จ", "บันทึกการคืนอุปกรณ์เรียบร้อยแล้ว", "success");
        fetchActiveBorrows(); // Refresh list
      } else {
        const data = await response.json();
        Swal.fire("เกิดข้อผิดพลาด", data.message || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      console.error("Error returning item:", error);
      Swal.fire("เกิดข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  return (
    <div className="borrow-return-container">
      <style>{`
        .modern-select-wrapper {
          position: relative;
          flex: 2;
          min-width: 250px;
        }
        .modern-input-group {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .modern-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          border: 1px solid var(--border-color); /* Add transition for border-color */
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s;
          background: var(--input-bg); /* Add transition for background-color */
          color: var(--text-primary); /* Add transition for color */
        }
        .modern-input:focus {
          border-color: #ff8000;
          box-shadow: 0 0 0 3px rgba(255, 128, 0, 0.1);
          outline: none;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-secondary); /* Add transition for color */
          pointer-events: none;
        }
        .suggestions-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-card); /* Add transition for background-color */
          border: 1px solid var(--border-color); /* Add transition for border-color */
          border-radius: 8px;
          margin-top: 4px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 50;
          max-height: 250px;
          overflow-y: auto;
          list-style: none;
          padding: 0;
        }
        .suggestion-item {
          padding: 10px 16px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-color); /* Add transition for border-color */
          transition: background 0.1s;
        }
        .suggestion-item:last-child { border-bottom: none; }
        .suggestion-item:hover { background: var(--hover-bg); color: #ff8000; } /* Add transition for background-color, color */
        .suggestion-name { font-weight: 500; font-size: 0.9rem; color: var(--text-primary); } /* Add transition for color */
        .suggestion-code { font-size: 0.8rem; color: var(--text-secondary); } /* Add transition for color */
      `}</style>
      <div className="page-header">
        <h2>ระบบยืม-คืนอุปกรณ์</h2>
        <p>จัดการคำขอยืมและแจ้งคืนอุปกรณ์</p>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "borrow" ? "active" : ""}`}
          onClick={() => setActiveTab("borrow")}
        >
          <Plus size={18} /> แจ้งยืมอุปกรณ์
        </button>
        <button
          className={`tab-btn ${activeTab === "return" ? "active" : ""}`}
          onClick={() => setActiveTab("return")}
        >
          <Repeat size={18} /> แจ้งคืนอุปกรณ์
        </button>
      </div>

      <div className="borrow-content">
        {/* User Info Card */}
        <div className="info-card user-info">
          <h3>
            <User size={20} /> ข้อมูลผู้ยืม
          </h3>
          <div className="info-grid">
            <div className="info-item">
              <label>ชื่อ-นามสกุล</label>
              <div className="info-value">
                {user?.firstName} {user?.lastName}
              </div>
            </div>
            <div className="info-item">
              <label>รหัสพนักงาน</label>
              <div className="info-value">{user?.employeeId}</div>
            </div>
            <div className="info-item">
              <label>ตำแหน่ง</label>
              <div className="info-value">{user?.role}</div>
            </div>
            <div className="info-item">
              <label>ฝ่าย/สำนัก</label>
              <div className="info-value">
                {getDepartmentName(user?.departmentId)} /{" "}
                {getInstitutionName(user?.institutionId)}
              </div>
            </div>
          </div>
        </div>

        {activeTab === "borrow" ? (
          <form onSubmit={handleSubmit} className="borrow-form">
            {/* Borrowing Details */}
            <div className="info-card">
              <h3 className="card-title">
                <FileText size={20} /> รายละเอียดการยืม
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="date"
                    name="borrowDate"
                    value={formData.borrowDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <textarea
                  name="purpose"
                  rows="3"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="ระบุเหตุผลหรือชื่องานที่นำไปใช้..."
                  required
                ></textarea>
              </div>
            </div>

            {/* Items List */}
            <div className="info-card">
              <h3 className="card-title">
                <Briefcase size={20} /> รายการอุปกรณ์
              </h3>

              <div className="add-item-row">
                <div className="modern-select-wrapper">
                  <div className="modern-input-group">
                    <Search className="input-icon" size={18} />
                    <input
                      type="text"
                      name="name"
                      placeholder="ค้นหาชื่ออุปกรณ์..."
                      value={newItem.name}
                      onChange={handleNameChange}
                      className="modern-input"
                      autoComplete="off"
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      onFocus={() => newItem.name && setShowSuggestions(true)}
                    />
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {suggestions.map((p) => (
                        <li
                          key={p.DVID}
                          className="suggestion-item"
                          onClick={() => handleSelectSuggestion(p)}
                        >
                          <div className="suggestion-name">{p.DeviceName}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={newItem.quantity}
                  onChange={handleItemChange}
                  className="item-input-qty"
                />
                <input
                  type="text"
                  name="remark"
                  placeholder="หมายเหตุ"
                  value={newItem.remark}
                  onChange={handleItemChange}
                  className="item-input-remark"
                />
                <button type="button" onClick={addItem} className="add-btn">
                  <Plus size={18} /> เพิ่ม
                </button>
              </div>

              <div className="items-table-wrapper">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>ลำดับ</th>
                      <th>รายการ</th>
                      <th>จำนวน</th>
                      <th>หมายเหตุ</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-row">
                          ยังไม่มีรายการที่เลือก
                        </td>
                      </tr>
                    ) : (
                      formData.items.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{item.remark}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="delete-btn"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                <Save size={18} /> บันทึกการยืม
              </button>
            </div>
          </form>
        ) : (
          <div className="info-card">
            <h3 className="card-title">
              <Repeat size={20} /> รายการที่ต้องคืน (Approved)
            </h3>
            {activeBorrows.length === 0 ? (
              <div className="empty-row" style={{ padding: "40px" }}>
                <CheckCircle
                  size={48}
                  color="#2ecc71"
                  style={{ marginBottom: "10px" }}
                />
                <p>ไม่มีรายการค้างคืนในขณะนี้</p>
              </div>
            ) : (
              <div className="items-table-wrapper">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>รหัสรายการ</th>
                      <th>วันที่ยืม</th>
                      <th>กำหนดคืน</th>
                      <th>วัตถุประสงค์</th>
                      <th>รายการอุปกรณ์</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBorrows.map((borrow) => (
                      <tr key={borrow.BorrowID}>
                        <td>#{borrow.BorrowID}</td>
                        <td>
                          {new Date(borrow.BorrowDate).toLocaleDateString(
                            "th-TH",
                          )}
                        </td>
                        <td>
                          {new Date(borrow.ReturnDate).toLocaleDateString(
                            "th-TH",
                          )}
                        </td>
                        <td>{borrow.Purpose}</td>
                        <td>
                          <ul
                            style={{
                              margin: 0,
                              paddingLeft: "20px",
                              fontSize: "0.9rem",
                            }}
                          >
                            {borrow.items.map((item) => (
                              <li key={item.BorrowDetailID}>
                                {item.ItemName} (x{item.Quantity})
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowReturn;
