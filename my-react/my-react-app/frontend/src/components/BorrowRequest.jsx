import { useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  ShoppingCart,
  Filter,
  Layers,
  Box,
  Camera,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Headphones,
  Mic,
  Speaker,
  ChevronDown,
  FileText,
} from "lucide-react";
import "./BorrowRequest.css";
import Swal from "sweetalert2"; // Import SweetAlert2

const BorrowRequest = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const location = useLocation();

  // Find selected product for preview
  const selectedProduct = products.find(
    (p) => p.DVID.toString() === currentItem.productId.toString(),
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchProducts();
    fetchCategories();
  }, []);

  // Handle pre-selected item from dashboard
  useEffect(() => {
    if (location.state?.preSelectedId && products.length > 0) {
      const productId = location.state.preSelectedId;
      const product = products.find(p => p.DVID === productId);
      if (product) {
        setCurrentItem({
          productId: product.DVID.toString(),
          name: product.DeviceName,
          quantity: 1,
          remark: "",
        });
        // Scroll to the selection area or show a hint if needed
      }
    }
  }, [location.state, products]);

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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
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
    if (new Date(formData.returnDate) < new Date(formData.borrowDate)) {
      Swal.fire(
        "ข้อผิดพลาด!",
        "กรุณากรอกวันที่คืนต้องไม่น้อยกว่าวันที่ยืม",
        "warning",
      );
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

  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return <Box size={16} />;
    const name = categoryName.toLowerCase();
    if (name.includes("กล้อง") || name.includes("camera"))
      return <Camera size={16} />;
    if (
      name.includes("คอม") ||
      name.includes("computer") ||
      name.includes("pc") ||
      name.includes("monitor")
    )
      return <Monitor size={16} />;
    if (name.includes("โน้ตบุ๊ก") || name.includes("laptop"))
      return <Laptop size={16} />;
    if (
      name.includes("มือถือ") ||
      name.includes("phone") ||
      name.includes("mobile")
    )
      return <Smartphone size={16} />;
    if (
      name.includes("แท็บเล็ต") ||
      name.includes("tablet") ||
      name.includes("ipad")
    )
      return <Tablet size={16} />;
    if (
      name.includes("หูฟัง") ||
      name.includes("headphone") ||
      name.includes("headset")
    )
      return <Headphones size={16} />;
    if (
      name.includes("ไมค์") ||
      name.includes("mic") ||
      name.includes("microphone")
    )
      return <Mic size={16} />;
    if (
      name.includes("ลำโพง") ||
      name.includes("speaker") ||
      name.includes("audio")
    )
      return <Speaker size={16} />;
    return <Box size={16} />;
  };

  return (
    <div className="borrow-request-page">
      <div className="page-header">
        <h2>ยืมอุปกรณ์</h2>
        <p>กรอกแบบฟอร์มและเลือกรายการอุปกรณ์ที่ต้องการยืม</p>
      </div>

      <div className="borrow-container">
        <form onSubmit={handleSubmit} className="borrow-form">
          <div className="form-card">
            <div className="card-header-title">
              <FileText size={20} /> ข้อมูลการยืม
            </div>
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

          <div className="form-card">
            <div className="items-header">
              <div className="card-header-title">
                <ShoppingCart size={20} /> รายการอุปกรณ์
              </div>

              {/* Filter Section */}
              <div className="filter-wrapper">
                <button
                  type="button"
                  className={`filter-toggle-btn ${isFilterOpen ? "active" : ""}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Filter size={18} />
                  <span>
                    {selectedCategories.length > 0
                      ? selectedCategories.length === 1
                        ? categories.find(
                            (c) => c.CategoryID == selectedCategories[0],
                          )?.CategoryName
                        : `หมวดหมู่ (${selectedCategories.length})`
                      : "หมวดหมู่สินค้า"}
                  </span>
                </button>

                {isFilterOpen && (
                  <div className="chip-popup-container">
                    <div className="chip-container">
                      <button
                        type="button"
                        className={`chip ${selectedCategories.length === 0 ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategories([]);
                          // setIsFilterOpen(false);
                        }}
                      >
                        <Layers size={16} /> ทั้งหมด
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.CategoryID}
                          type="button"
                          className={`chip ${selectedCategories.includes(cat.CategoryID.toString()) ? "active" : ""}`}
                          onClick={() => {
                            const id = cat.CategoryID.toString();
                            setSelectedCategories((prev) =>
                              prev.includes(id)
                                ? prev.filter((item) => item !== id)
                                : [...prev, id],
                            );
                          }}
                        >
                          {getCategoryIcon(cat.CategoryName)}
                          {cat.CategoryName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="add-item-box">
              <div
                className="form-group item-product"
                style={{ position: "relative" }}
              >
                <label>ชื่ออุปกรณ์</label>
                <div
                  className="custom-select-wrapper"
                  onMouseEnter={() => setShowPreview(true)}
                  onMouseLeave={() => setShowPreview(false)}
                >
                  <select
                    className="modern-select"
                    value={currentItem.productId}
                    onChange={(e) => {
                      const product = products.find(
                        (p) => p.DVID === parseInt(e.target.value),
                      );
                      setCurrentItem({
                        ...currentItem,
                        productId: e.target.value,
                        name: product ? product.DeviceName : "",
                      });
                    }}
                  >
                    <option value="">-- เลือกรายการ --</option>
                    {products
                      .filter(
                        (p) =>
                          selectedCategories.length === 0 ||
                          selectedCategories.includes(p.CategoryID.toString()),
                      )
                      .map((p) => (
                        <option key={p.DVID} value={p.DVID}>
                          {p.DeviceName}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="select-arrow" size={18} />
                </div>
                {selectedProduct && selectedProduct.Image && showPreview && (
                  <div
                    className="product-preview-popup"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 5px)",
                      left: "0",
                      zIndex: 50,
                      backgroundColor: "white",
                      padding: "10px",
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      border: "1px solid #e2e8f0",
                      width: "220px",
                      pointerEvents: "none",
                    }}
                  >
                    <img
                      src={selectedProduct.Image}
                      alt={selectedProduct.DeviceName}
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "160px",
                        objectFit: "contain",
                        borderRadius: "4px",
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        color: "#64748b",
                        textAlign: "center",
                      }}
                    >
                      {selectedProduct.DeviceName}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group item-quantity">
                <label>จำนวน</label>
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
              <div className="form-group item-remark">
                <input
                  type="text"
                  value={currentItem.remark}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, remark: e.target.value })
                  }
                  placeholder="เช่น ขอสายชาร์จด้วย"
                />
              </div>
              <div className="item-actions">
                <button
                  type="button"
                  className="add-btn"
                  onClick={handleAddItem}
                >
                  <Plus size={16} /> เพิ่ม
                </button>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="items-table-container">
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
                        <td className="text-center">{item.quantity}</td>
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

          <div className="form-footer">
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
