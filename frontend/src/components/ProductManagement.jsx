import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Search,
  Edit,
  Trash2,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileUp,
  FileDown,
  Filter,
  Loader,
  Layers,
  Box,
  CheckSquare,
  ArrowRightLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import "./ProductManagement.css";
import Swal from "sweetalert2";
import { apiFetch } from "./api";
import Cropper from "react-easy-crop";

// รูปภาพ Default สำหรับสินค้า
const defaultProductImage = "/images/logo.png"; // ใช้รูปในเครื่องแทนเพื่อป้องกัน Error เน็ตหลุด

const getInitialProductState = () => ({
  DeviceName: "",
  DeviceCode: "",
  SerialNumber: "",
  StickerID: "",
  CategoryID: "",
  StatusID: "",
  Image: "", // Base64 for new image
  Brand: "",
  DeviceType: "",
  Price: "",
  Quantity: 1, // Default to 1
  Description: "",
});
const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState("products"); // products, categories, statuses
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategories, setFilterCategories] = useState([]); // State สำหรับกรองหมวดหมู่ (Multi)
  const [filterStatuses, setFilterStatuses] = useState([]); // State สำหรับกรองสถานะ (Multi)
  const [suggestions, setSuggestions] = useState([]); // รายการแนะนำ Auto-complete
  const [showSuggestions, setShowSuggestions] = useState(false); // ควบคุมการแสดง Dropdown
  const [isSearching, setIsSearching] = useState(false); // สถานะ Loading
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  // Unified state for Add/Edit Product Modal
  const [productModal, setProductModal] = useState({
    isOpen: false,
    mode: "add", // 'add' or 'edit'
    data: null,
  });

  // State for Stock Detail Modal
  const [stockDetailModal, setStockDetailModal] = useState({
    isOpen: false,
    group: null,
    items: [],
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const fileInputRef = useRef(null); // Ref for hidden file input

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategories, filterStatuses]);

  const isAdminUser = user?.role === "Admin" || user?.role === "admin";

  // --- 1. Fetch Data Section ---
  const fetchProducts = useCallback(async () => {
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
  }, []);

  const fetchMasterData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchMasterData();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [fetchProducts, fetchMasterData]);

  // --- Search & Auto-complete Logic ---
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length > 0) {
      setIsSearching(true);
      setShowSuggestions(true);

      // จำลองการค้นหา (Simulate Async) เพื่อแสดง Loading Spinner
      setTimeout(() => {
        const lowerValue = value.toLowerCase();
        const matches = products
          .filter(
            (p) =>
              (p.DeviceName &&
                String(p.DeviceName).toLowerCase().includes(lowerValue)) ||
              (p.DeviceCode &&
                String(p.DeviceCode).toLowerCase().includes(lowerValue)) ||
              (p.SerialNumber &&
                String(p.SerialNumber).toLowerCase().includes(lowerValue)),
          )
          .slice(0, 5); // แสดงสูงสุด 5 รายการ

        setSuggestions(matches);
        setIsSearching(false);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (product) => {
    setSearchTerm(product.DeviceName);
    setShowSuggestions(false);
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  // --- 2. Main Product Actions (Edit/Delete) ---
  const handleAddClick = () => {
    setProductModal({
      isOpen: true,
      mode: "add",
      data: getInitialProductState(), // Use initial state for new product
    });
  };

  const handleEditClick = (product) => {
    setProductModal({
      isOpen: true,
      mode: "edit",
      data: product,
    });
  };

  const handleSaveProduct = async (formData) => {
    const { mode } = productModal;
    const isEditMode = mode === "edit";

    if (
      !formData.DeviceName ||
      !formData.DeviceCode ||
      !formData.CategoryID ||
      !formData.StatusID
    ) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน", "warning");
      return;
    }

    // --- Validation Logic: Unique SerialNumber and StickerID ---
    if (formData.SerialNumber) {
      const duplicateSerial = products.find(
        (p) =>
          p.SerialNumber &&
          p.SerialNumber.toString().toLowerCase() ===
            formData.SerialNumber.toString().toLowerCase() &&
          p.DVID !== formData.DVID,
      );

      if (duplicateSerial) {
        Swal.fire(
          "แจ้งเตือน",
          `Serial Number "${formData.SerialNumber}" มีอยู่ในระบบแล้ว`,
          "warning",
        );
        return;
      }
    }

    if (formData.StickerID) {
      const duplicateSticker = products.find(
        (p) =>
          p.StickerID &&
          p.StickerID.toString().toLowerCase() ===
            formData.StickerID.toString().toLowerCase() &&
          p.DVID !== formData.DVID,
      );

      if (duplicateSticker) {
        Swal.fire(
          "แจ้งเตือน",
          `Sticker ID "${formData.StickerID}" มีอยู่ในระบบแล้ว`,
          "warning",
        );
        return;
      }
    }
    // -----------------------------------------------------------

    try {
      const endpoint = isEditMode
        ? `/api/products/${formData.DVID}`
        : "/api/products";
      const method = isEditMode ? "PUT" : "POST";

      const body = {
        ...formData,
      };

      // Don't send currentImage URL to backend
      delete body.currentImage;

      // จัดการรูปภาพ
      if (formData.isImageDeleted && !formData.Image) {
        // กรณีลบรูป: ส่งค่าว่างไปเพื่อลบใน DB
        body.Image = "";
      } else if (!formData.Image && isEditMode) {
        // กรณีแก้ไขและไม่ได้เปลี่ยนรูป: ลบ key ออกเพื่อไม่ให้ส่งค่าว่างไปทับรูปเดิม
        delete body.Image;
      }

      const response = await apiFetch(endpoint, {
        method: method,
        body: JSON.stringify(body),
      });

      if (response.ok) {
        Swal.fire(
          "สำเร็จ",
          isEditMode ? "อัปเดตข้อมูลสำเร็จ" : "เพิ่มสินค้าสำเร็จ",
          "success",
        );
        setProductModal({ isOpen: false, mode: "add", data: null });
        fetchProducts();
      } else {
        const errorData = await response.json();
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          errorData.message || "ดำเนินการไม่สำเร็จ",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating product:", error);
      Swal.fire("Error", "ไม่สามารถเชื่อมต่อ Server ได้", "error");
    }
  };

  const handleDelete = async (product) => {
    // Logic to delete a single product instance
    Swal.fire({
      title: "ยืนยันการลบ?",
      text: `คุณต้องการลบ "${product.DeviceName}" (SN: ${product.SerialNumber || "N/A"}) ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiFetch(`/api/products/${product.DVID}`, {
            method: "DELETE",
          });

          if (response.ok) {
            Swal.fire("ลบสำเร็จ!", "ข้อมูลถูกลบเรียบร้อยแล้ว", "success");
            fetchProducts();
          } else {
            const errorData = await response.json();
            Swal.fire(
              "ผิดพลาด",
              errorData.message || "ไม่สามารถลบข้อมูลได้",
              "error",
            );
          }
        } catch (error) {
          console.error("Delete error:", error);
          Swal.fire("Error", "Connection Error", "error");
        }
      }
    });
  };

  const handleStockCardClick = (group) => {
    // Filter items that belong to this group
    const items = products.filter((p) => {
      const pKey = `${p.DeviceName}|${p.DeviceType}|${p.CategoryID}|${p.Brand || ""}|${p.Model || ""}`;
      const gKey = `${group.DeviceName}|${group.DeviceType}|${group.CategoryID}|${group.Brand || ""}|${group.Model || ""}`;
      return pKey === gKey;
    });
    setStockDetailModal({ isOpen: true, group, items });
  };

  const handleExportClick = () => {
    if (products.length === 0) {
      Swal.fire("แจ้งเตือน", "ไม่มีข้อมูลสำหรับส่งออก", "warning");
      return;
    }

    // 1. กำหนดหัวตาราง (Headers)
    const headers = [
      "ชื่อสินค้า",
      "รหัสสินค้า",
      "Serial No.",
      "Sticker ID",
      "หมวดหมู่",
      "สถานะ",
      "ยี่ห้อ",
      "รุ่น/ชนิด",
      "ราคา",
      "รายละเอียด",
      "จำนวน",
    ];

    // 2. แปลงข้อมูลสินค้าเป็น CSV Rows
    const csvRows = products.map((item) => {
      return [
        `"${(item.DeviceName || "").replace(/"/g, '""')}"`,
        `"${(item.DeviceCode || "").replace(/"/g, '""')}"`,
        `"${(item.SerialNumber || "").replace(/"/g, '""')}"`,
        `"${(item.StickerID || "").replace(/"/g, '""')}"`,
        `"${(item.CategoryName || "").replace(/"/g, '""')}"`,
        `"${(item.StatusNameDV || "").replace(/"/g, '""')}"`,
        `"${(item.Brand || "").replace(/"/g, '""')}"`,
        `"${(item.DeviceType || "").replace(/"/g, '""')}"`,
        `"${item.Price || 0}"`,
        `"${(item.Description || "").replace(/"/g, '""')}"`,
        `"${item.Quantity || 0}"`,
      ].join(",");
    });

    // 3. รวม Headers และ Rows เข้าด้วยกัน พร้อมใส่ BOM (\uFEFF) เพื่อรองรับภาษาไทยใน Excel
    const csvString = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `products_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Import Excel Logic ---
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // Show loading
    Swal.fire({
      title: "กำลังนำเข้าข้อมูล...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // Do NOT set Content-Type for FormData
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        Swal.fire("สำเร็จ", result.message, "success");
        fetchProducts();
      } else {
        Swal.fire(
          "ผิดพลาด",
          result.message || "นำเข้าข้อมูลไม่สำเร็จ",
          "error",
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      Swal.fire("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      e.target.value = ""; // Reset input
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

  // --- 4. Data Processing for Display ---
  const stats = React.useMemo(() => {
    const inStock = products.filter((p) => p.StatusNameDV === "ว่าง").length;
    const borrowed = products.filter((p) => p.StatusNameDV === "ถูกยืม").length;
    return {
      total: products.length,
      inStock,
      borrowed,
      categories: categories.length,
    };
  }, [products, categories]);

  const SummaryCard = ({ title, value, icon: Icon, color }) => (
    <div className={`stat-card`}>
      <div className={`stat-icon-wrapper ${color}`}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  // Create a summary for the "stock" tab by grouping products
  const stockSummary = React.useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      // Group by Name, Type, Category, Brand (and Model if available)
      const key = `${product.DeviceName}|${product.DeviceType}|${product.CategoryID}|${product.Brand || ""}|${product.Model || ""}`;
      if (!acc[key]) {
        acc[key] = {
          ...product, // Use the first item as a template
          Quantity: 0,
          DVID: `group-${key}`, // Create a stable unique key for the group row
        };
      }
      acc[key].Quantity += 1;
      return acc;
    }, {});
    return Object.values(grouped);
  }, [products]);

  // Determine which list of items to show based on the active tab
  const itemsToDisplay = React.useMemo(() => {
    return activeTab === "stock" ? stockSummary : products;
  }, [activeTab, products, stockSummary]);

  // Filter the items based on search and filter criteria
  const filteredProducts = itemsToDisplay.filter((p) => {
    const lowerTerm = searchTerm.toLowerCase();
    return (
      ((p.DeviceName &&
        String(p.DeviceName).toLowerCase().includes(lowerTerm)) ||
        (p.DeviceCode &&
          String(p.DeviceCode).toLowerCase().includes(lowerTerm)) ||
        (p.SerialNumber &&
          String(p.SerialNumber).toLowerCase().includes(lowerTerm))) &&
      (filterCategories.length > 0 // This logic works for both tabs
        ? filterCategories.includes(p.CategoryID?.toString())
        : true) && // กรองหมวดหมู่
      (filterStatuses.length > 0
        ? filterStatuses.includes(p.StatusID?.toString())
        : true)
    ); // กรองสถานะ
  });

  // --- Sorting Logic ---
  const sortedItems = React.useMemo(() => {
    let sortableItems = [...filteredProducts];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] || ""; // Handle null/undefined
        const valB = b[sortConfig.key] || ""; // Handle null/undefined

        // Use localeCompare for robust string comparison, including numbers within strings
        if (typeof valA === "string" && typeof valB === "string") {
          return sortConfig.direction === "ascending"
            ? valA.localeCompare(valB, undefined, { numeric: true })
            : valB.localeCompare(valA, undefined, { numeric: true });
        }

        // Fallback for numbers or other types
        if (valA < valB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProducts, sortConfig]);

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

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
    <div className="management-page product-management-container">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">จัดการสินค้า</h2>
          <p className="text-gray-500 mt-1">
            ภาพรวมและจัดการรายการสินค้า, หมวดหมู่, และสถานะในระบบ
          </p>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        <SummaryCard
          title="สินค้าทั้งหมด"
          value={stats.total}
          icon={Box}
          color="bg-blue-light"
        />
        <SummaryCard
          title="พร้อมใช้งาน"
          value={stats.inStock}
          icon={CheckSquare}
          color="bg-green-light"
        />
        <SummaryCard
          title="ถูกยืม"
          value={stats.borrowed}
          icon={ArrowRightLeft}
          color="bg-orange-light"
        />
        <SummaryCard
          title="หมวดหมู่"
          value={stats.categories}
          icon={Layers}
          color="bg-purple-light"
        />
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          รายการสินค้า
        </button>
        <button
          className={`tab-btn ${activeTab === "stock" ? "active" : ""}`}
          onClick={() => setActiveTab("stock")}
        >
          จำนวนคงเหลือ
        </button>
        <button
          className={`tab-btn ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          หมวดหมู่
        </button>
        <button
          className={`tab-btn ${activeTab === "statuses" ? "active" : ""}`}
          onClick={() => setActiveTab("statuses")}
        >
          สถานะ
        </button>
      </div>
      {(activeTab === "products" || activeTab === "stock") && (
        <>
          <style>{`
            .product-grid-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
              gap: 20px;
              padding: 20px 0;
            }
            .product-card-stock {
              background: var(--bg-card);
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
              transition: transform 0.2s, box-shadow 0.2s;
              border: 1px solid var(--border-color);
              display: flex;
              flex-direction: column;
            }
            .product-card-stock:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .product-img-wrapper {
              height: 180px;
              width: 100%;
              position: relative;
              background: var(--bg-body);
              display: flex;
              align-items: center;
              justify-content: center;
              border-bottom: 1px solid var(--border-color);
            }
            .product-img-wrapper img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              padding: 16px;
            }
            .stock-badge {
              position: absolute;
              top: 12px;
              right: 12px;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 0.75rem;
              font-weight: 600;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              color: white;
            }
            .stock-badge.available { background-color: #22c55e; }
            .stock-badge.borrowed { background-color: #f59e0b; }
            .stock-badge.maintenance { background-color: #f97316; }
            .stock-badge.broken { background-color: #ef4444; }
            .stock-badge.lost { background-color: #64748b; }
            .stock-badge.default { background-color: #94a3b8; }
            
            .product-info {
              padding: 16px;
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .product-info h3 {
              margin: 0 0 4px 0;
              font-size: 1rem;
              font-weight: 600;
              color: var(--text-primary);
              line-height: 1.4;
            }
            .product-code {
              color: var(--text-secondary);
              font-size: 0.85rem;
              margin-bottom: 12px;
            }
            .stock-footer {
              margin-top: auto;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-top: 12px;
              border-top: 1px solid var(--border-color);
            }
            .stock-count {
              font-size: 0.9rem;
              font-weight: 600;
              color: var(--text-primary);
            }
            .stock-count span {
              color: #3b82f6;
              font-size: 1.1rem;
              margin-left: 4px;
            }
            .stock-count.low-stock, .stock-count.low-stock span {
              color: #dc2626;
            }
            .low-stock-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              background-color: #fee2e2;
              color: #b91c1c;
              font-size: 0.7rem;
              padding: 2px 6px;
              border-radius: 4px;
              margin-left: 8px;
              vertical-align: middle;
            }
            .quantity-cell {
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 150px; /* Ensure it has enough space */
            }
            .quantity-value {
              font-weight: 700;
              font-size: 1.1rem;
              min-width: 30px;
              text-align: right;
            }
            .quantity-value.low {
              color: #dc2626;
            }
            .quantity-bar-container {
              flex-grow: 1;
              height: 8px;
              background-color: var(--border-color);
              border-radius: 4px;
              overflow: hidden;
            }
            .quantity-bar {
              height: 100%;
              border-radius: 4px;
              transition: width 0.3s ease-in-out;
            }
            .quantity-bar.high { background-color: #22c55e; }
            .quantity-bar.medium { background-color: #f59e0b; }
            .quantity-bar.low { background-color: #ef4444; }
            .sortable-header {
              cursor: pointer;
              user-select: none;
              position: relative;
            }
            .sortable-header:hover {
              background-color: #f8fafc;
            }
            .sort-icon {
              display: inline-flex;
              margin-left: 6px;
            }
          `}</style>
          <div className="filter-bar">
            {/* Search Bar Design ใหม่ */}
            <div className="search-wrapper">
              <div className="search-input-group">
                <Search size={20} className="search-icon-left" />
                <input
                  type="text"
                  className="search-input-custom"
                  placeholder="ค้นหาด้วยชื่ออุปกรณ์, รหัสสินค้า หรือ หมายเลขซีเรียล..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchTerm) setShowSuggestions(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                />
                <div className="search-actions-right">
                  {searchTerm && (
                    <button
                      className="btn-clear"
                      onClick={handleClearSearch}
                      title="ล้างคำค้นหา"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Auto-complete Dropdown */}
              {showSuggestions && (
                <div className="suggestions-dropdown">
                  {isSearching ? (
                    <div className="search-status">
                      <Loader size={18} className="spinner-icon" />{" "}
                      กำลังค้นหา...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((p) => (
                      <div
                        key={p.DVID}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(p)}
                      >
                        <img
                          src={p.Image || defaultProductImage}
                          alt={p.DeviceName}
                          className="suggestion-img"
                        />
                        <div className="suggestion-info">
                          <span className="suggestion-name">
                            {p.DeviceName}
                          </span>
                          <span className="suggestion-code">
                            #{p.DeviceCode}{" "}
                            {p.SerialNumber ? `(SN: ${p.SerialNumber})` : ""}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="search-status">ไม่พบข้อมูล</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {/* Category Filter */}
              <div className="filter-wrapper">
                <button
                  className={`filter-toggle-btn ${isCategoryFilterOpen ? "active" : ""}`}
                  onClick={() => {
                    setIsCategoryFilterOpen(!isCategoryFilterOpen);
                    setIsStatusFilterOpen(false);
                  }}
                >
                  <Filter size={18} />
                  <span>
                    {filterCategories.length > 0
                      ? filterCategories.length === 1
                        ? categories.find(
                            (c) =>
                              c.CategoryID.toString() === filterCategories[0],
                          )?.CategoryName
                        : `หมวดหมู่ (${filterCategories.length})`
                      : "หมวดหมู่"}
                  </span>
                </button>
                {isCategoryFilterOpen && (
                  <div className="chip-popup-container">
                    <div className="chip-container">
                      <button
                        className={`chip ${filterCategories.length === 0 ? "active" : ""}`}
                        onClick={() => {
                          setFilterCategories([]);
                          // setIsCategoryFilterOpen(false); // Keep open for multi-select
                        }}
                      >
                        <Layers size={14} /> ทั้งหมด
                      </button>
                      {categories.map((c) => (
                        <button
                          key={c.CategoryID}
                          className={`chip ${filterCategories.includes(c.CategoryID.toString()) ? "active" : ""}`}
                          onClick={() => {
                            const id = c.CategoryID.toString();
                            setFilterCategories((prev) =>
                              prev.includes(id)
                                ? prev.filter((item) => item !== id)
                                : [...prev, id],
                            );
                          }}
                        >
                          {c.CategoryName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <div className="filter-wrapper">
                <button
                  className={`filter-toggle-btn ${isStatusFilterOpen ? "active" : ""}`}
                  onClick={() => {
                    setIsStatusFilterOpen(!isStatusFilterOpen);
                    setIsCategoryFilterOpen(false);
                  }}
                >
                  <Filter size={18} />
                  <span>
                    {filterStatuses.length > 0
                      ? filterStatuses.length === 1
                        ? statuses.find(
                            (s) =>
                              s.DVStatusID.toString() === filterStatuses[0],
                          )?.StatusNameDV
                        : `สถานะ (${filterStatuses.length})`
                      : "สถานะ"}
                  </span>
                </button>
                {isStatusFilterOpen && (
                  <div className="chip-popup-container">
                    <div className="chip-container">
                      <button
                        className={`chip ${filterStatuses.length === 0 ? "active" : ""}`}
                        onClick={() => {
                          setFilterStatuses([]);
                          // setIsStatusFilterOpen(false);
                        }}
                      >
                        <Layers size={14} /> ทั้งหมด
                      </button>
                      {statuses.map((s) => (
                        <button
                          key={s.DVStatusID}
                          className={`chip ${filterStatuses.includes(s.DVStatusID.toString()) ? "active" : ""}`}
                          onClick={() => {
                            const id = s.DVStatusID.toString();
                            setFilterStatuses((prev) =>
                              prev.includes(id)
                                ? prev.filter((item) => item !== id)
                                : [...prev, id],
                            );
                          }}
                        >
                          {s.StatusNameDV}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isAdminUser && (
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleExportClick}
                >
                  <FileDown size={18} /> Export Excel
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleImportClick}
                >
                  <FileUp size={18} /> Import Excel
                </button>
                <button className="btn btn-primary" onClick={handleAddClick}>
                  <Plus size={18} /> เพิ่มสินค้า
                </button>
              </div>
            )}
          </div>

          {activeTab === "products" && (
            <div className="table-container" style={{ marginTop: "1.5rem" }}>
              <table className="member-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => requestSort("DeviceName")}
                      className="sortable-header"
                    >
                      สินค้า
                      {sortConfig.key === "DeviceName" && (
                        <span className="sort-icon">
                          {sortConfig.direction === "ascending" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </th>
                    <th
                      onClick={() => requestSort("DeviceCode")}
                      className="sortable-header"
                    >
                      รหัสสินค้า
                      {sortConfig.key === "DeviceCode" && (
                        <span className="sort-icon">
                          {sortConfig.direction === "ascending" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </th>
                    <th
                      onClick={() => requestSort("SerialNumber")}
                      className="sortable-header"
                    >
                      Serial No.
                      {sortConfig.key === "SerialNumber" && (
                        <span className="sort-icon">
                          {sortConfig.direction === "ascending" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                        </span>
                      )}
                    </th>
                    <th>หมวดหมู่</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        กำลังโหลด...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        ไม่พบข้อมูลสินค้า
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((p) => (
                      <tr key={p.DVID}>
                        <td>
                          <div className="user-cell">
                            <img
                              src={p.Image || defaultProductImage} // Use local default image
                              alt={p.DeviceName}
                              className="avatar-circle product-zoom"
                            />
                            <div className="user-name">{p.DeviceName}</div>
                          </div>
                        </td>
                        <td>{p.DeviceCode}</td>
                        <td>{p.SerialNumber || "-"}</td>
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
                            <button // Use the helper function here
                              className="btn-icon edit"
                              onClick={() => handleEditClick(p)}
                              disabled={!isAdminUser}
                              aria-label={`แก้ไข ${p.DeviceName}`}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDelete(p)}
                              disabled={!isAdminUser}
                              aria-label={`ลบ ${p.DeviceName}`}
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
          )}

          {activeTab === "stock" && (
            <div
              className="product-grid-container"
              style={{ marginTop: "1.5rem" }}
            >
              {loading ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "40px",
                  }}
                >
                  กำลังโหลด...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "40px",
                  }}
                >
                  ไม่พบข้อมูลสินค้า
                </div>
              ) : (
                currentItems.map((p) => (
                  <div
                    key={p.DVID}
                    className="product-card-stock"
                    onClick={() => handleStockCardClick(p)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="product-img-wrapper">
                      <img
                        src={p.Image || defaultProductImage}
                        alt={p.DeviceName}
                      />
                      <span className="stock-badge available">
                        {p.CategoryName}
                      </span>
                    </div>
                    <div className="product-info">
                      <h3>{p.DeviceName}</h3>
                      <p className="product-code">
                        {p.Brand || "-"}{" "}
                        {p.DeviceType ? `• ${p.DeviceType}` : ""}
                      </p>
                      <div className="stock-footer">
                        <div className="stock-count">
                          คงเหลือ: <span>{p.Quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && sortedItems.length > itemsPerPage && (
            <div
              className="pagination-controls"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "10px",
                marginTop: "1rem",
              }}
            >
              <button // Use the helper function here
                className="btn btn-secondary"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 12px",
                }}
              >
                <ChevronLeft size={16} /> ก่อนหน้า
              </button>
              <span style={{ fontSize: "0.9rem" }}>
                หน้า <strong>{currentPage}</strong> จาก{" "}
                <strong>{totalPages}</strong>
              </span>
              <button // Use the helper function here
                className="btn btn-secondary"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 12px",
                }}
              >
                ถัดไป <ChevronRight size={16} />
              </button>
            </div>
          )}
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
      <ProductModal
        modal={productModal}
        onClose={() => setProductModal({ ...productModal, isOpen: false })}
        onSave={handleSaveProduct}
        categories={categories}
        statuses={statuses}
      />
      {/* Modal เพิ่มหมวดหมู่/สถานะ */}
      {isMasterDataModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-modal-title"
        >
          <div className="modal-content">
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
      {/* Modal รายละเอียดสต็อก (Stock Detail Modal) */}
      {stockDetailModal.isOpen && stockDetailModal.group && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() =>
            setStockDetailModal({ ...stockDetailModal, isOpen: false })
          }
        >
          <div
            className="modal-content"
            style={{ maxWidth: "800px", width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>{stockDetailModal.group.DeviceName}</h2>
            </div>

            <div
              className="table-container"
              style={{ maxHeight: "60vh", overflowY: "auto" }}
            >
              <table className="member-table">
                <thead>
                  <tr>
                    <th>รูปภาพ</th>
                    <th>รหัสทรัพย์สิน</th>
                    <th>Serial No.</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {stockDetailModal.items.map((item) => (
                    <tr key={item.DVID}>
                      <td>
                        <img
                          src={item.Image || defaultProductImage}
                          alt={item.DeviceName}
                          className="product-table-image"
                          style={{ width: "40px", height: "40px" }}
                        />
                      </td>
                      <td>{item.DeviceCode}</td>
                      <td>{item.SerialNumber || "-"}</td>
                      <td>
                        <span
                          className={`status-dot ${getDeviceStatusClass(item.StatusNameDV)}`}
                        >
                          {item.StatusNameDV}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  setStockDetailModal({ ...stockDetailModal, isOpen: false })
                }
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductModal = React.memo(
  ({ modal, onClose, onSave, categories, statuses }) => {
    const { isOpen, mode, data } = modal;
    const isEditMode = mode === "edit";

    const [formData, setFormData] = useState(getInitialProductState());
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);

    useEffect(() => {
      if (isOpen) {
        if (isEditMode && data) {
          setFormData({
            ...getInitialProductState(),
            ...data,
            currentImage: data.Image || "", // Store original image
            Image: "", // Reset new image
            isImageDeleted: false,
          });
        } else {
          setFormData(getInitialProductState());
        }
      } else {
        // Reset all modal-specific states on close
        setIsCropModalOpen(false);
        setImageToCrop(null);
        setUploadProgress(0);
      }
    }, [isOpen, mode, data, isEditMode]);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };

    // --- Image & Crop Handlers (now inside the modal) ---

    const validateImage = (file) => {
      if (!file.type.startsWith("image/")) {
        Swal.fire("ข้อผิดพลาด", "กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น", "error");
        return false;
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        Swal.fire("ข้อผิดพลาด", "ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB", "error");
        return false;
      }
      return true;
    };

    const readFileWithProgress = (file, callback) => {
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };
      reader.onloadstart = () => setUploadProgress(1);
      reader.onloadend = () => {
        setUploadProgress(0);
        callback(reader.result);
      };
      reader.readAsDataURL(file);
    };

    const initiateCrop = (imageSrc) => {
      setImageToCrop(imageSrc);
      setIsCropModalOpen(true);
    };

    const handleImageFileChange = (e) => {
      const file = e.target.files[0];
      if (file && validateImage(file)) {
        readFileWithProgress(file, (result) => initiateCrop(result));
      }
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropSave = async () => {
      try {
        const croppedImage = await getCroppedImg(
          imageToCrop,
          croppedAreaPixels,
        );
        setFormData({ ...formData, Image: croppedImage });
        setIsCropModalOpen(false);
        setImageToCrop(null);
        setZoom(1);
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "เกิดข้อผิดพลาดในการตัดรูปภาพ", "error");
      }
    };

    const handleRemoveImage = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isEditMode) {
        Swal.fire({
          title: "ยืนยันการลบรูปภาพ?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "ลบเลย",
          cancelButtonText: "ยกเลิก",
        }).then((result) => {
          if (result.isConfirmed) {
            setFormData({
              ...formData,
              Image: "",
              currentImage: "",
              isImageDeleted: true,
            });
          }
        });
      } else {
        setFormData({ ...formData, Image: "" });
      }
    };

    // Drag & Drop Handlers
    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };
    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && validateImage(file)) {
        readFileWithProgress(file, (result) => initiateCrop(result));
      }
    };

    if (!isOpen) return null;

    const modalId = isEditMode ? "edit" : "add";

    return (
      <>
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${modalId}-modal-title`}
        >
          <div className="modal-content">
            <h2 id={`${modalId}-modal-title`}>
              {isEditMode ? "แก้ไขข้อมูลสินค้า" : "เพิ่มสินค้าใหม่"}
            </h2>
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-grid">
                {/* All form fields now use formData and a generic handler */}
                <div className="form-group">
                  <label htmlFor={`${modalId}DeviceName`}>ชื่อสินค้า</label>
                  <input
                    id={`${modalId}DeviceName`}
                    type="text"
                    value={formData.DeviceName}
                    onChange={(e) =>
                      setFormData({ ...formData, DeviceName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`${modalId}DeviceCode`}>รหัสสินค้า</label>
                  <input
                    id={`${modalId}DeviceCode`}
                    type="text"
                    value={formData.DeviceCode}
                    onChange={(e) =>
                      setFormData({ ...formData, DeviceCode: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`${modalId}SerialNumber`}>
                    Serial Number
                  </label>
                  <input
                    id={`${modalId}SerialNumber`}
                    type="text"
                    value={formData.SerialNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        SerialNumber: e.target.value,
                      })
                    }
                    placeholder="ระบุ Serial Number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`${modalId}StickerID`}>Sticker ID</label>
                  <input
                    id={`${modalId}StickerID`}
                    type="text"
                    value={formData.StickerID}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        StickerID: e.target.value,
                      })
                    }
                    placeholder="ระบุ Sticker ID"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`${modalId}Brand`}>ยี่ห้อ (Brand)</label>
                  <input
                    id={`${modalId}Brand`}
                    type="text"
                    value={formData.Brand}
                    onChange={(e) =>
                      setFormData({ ...formData, Brand: e.target.value })
                    }
                    placeholder="ระบุยี่ห้อ (ถ้ามี)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`${modalId}DeviceType`}>
                    รุ่น/ชนิด (Type)
                  </label>
                  <input
                    id={`${modalId}DeviceType`}
                    type="text"
                    value={formData.DeviceType}
                    onChange={(e) =>
                      setFormData({ ...formData, DeviceType: e.target.value })
                    }
                    placeholder="ระบุรุ่นหรือชนิด (ถ้ามี)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`${modalId}CategoryID`}>หมวดหมู่</label>
                  <select
                    id={`${modalId}CategoryID`}
                    value={formData.CategoryID}
                    onChange={(e) =>
                      setFormData({ ...formData, CategoryID: e.target.value })
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
                  <label htmlFor={`${modalId}StatusID`}>สถานะ</label>
                  <select
                    id={`${modalId}StatusID`}
                    value={formData.StatusID}
                    onChange={(e) =>
                      setFormData({ ...formData, StatusID: e.target.value })
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
                <div className="form-group">
                  <label htmlFor={`${modalId}Price`}>ราคา</label>
                  <input
                    id={`${modalId}Price`}
                    type="number"
                    value={formData.Price}
                    onChange={(e) =>
                      setFormData({ ...formData, Price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group form-group-full">
                  <label htmlFor={`${modalId}Description`}>รายละเอียด</label>
                  <textarea
                    id={`${modalId}Description`}
                    value={formData.Description}
                    onChange={(e) =>
                      setFormData({ ...formData, Description: e.target.value })
                    }
                    rows="3"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>
                <div className="form-group form-group-full">
                  <label htmlFor={`${modalId}ProductImage`}>รูปภาพ</label>
                  <div className="image-upload-wrapper">
                    <label
                      htmlFor={`${modalId}ProductImage`}
                      className={`image-preview ${isDragging ? "dragging" : ""}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="image-preview-content">
                        <img
                          src={
                            formData.Image ||
                            formData.currentImage ||
                            defaultProductImage
                          }
                          alt="Preview"
                        />
                        {(formData.Image || formData.currentImage) && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="btn-remove-image"
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        )}
                      </div>
                      {uploadProgress > 0 && (
                        <div className="progress-overlay">
                          <div className="progress-bar-track">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {uploadProgress}%
                          </span>
                        </div>
                      )}
                    </label>
                    <input
                      id={`${modalId}ProductImage`}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditMode ? "บันทึกการแก้ไข" : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {isCropModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: "600px" }}>
              <h2>ปรับแต่งรูปภาพ</h2>
              <div className="crop-container">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="crop-controls">
                <label>Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="zoom-range"
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsCropModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button className="btn btn-primary" onClick={handleCropSave}>
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);

// --- Utility Functions for Cropping ---

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // set canvas width to match the bounding box
  canvas.width = image.width;
  canvas.height = image.height;

  // draw image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  // As Base64 string
  return canvas.toDataURL("image/jpeg");
}

export default ProductManagement;
