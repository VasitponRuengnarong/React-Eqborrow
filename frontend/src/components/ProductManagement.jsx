import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Plus,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Filter,
  Loader,
  Layers,
} from "lucide-react";
import "./ProductManagement.css";
import "./Management.css";
import Swal from "sweetalert2";
import { apiFetch } from "./api";
import Cropper from "react-easy-crop";

// รูปภาพ Default สำหรับสินค้า
const defaultProductImage = "/images/logo.png"; // ใช้รูปในเครื่องแทนเพื่อป้องกัน Error เน็ตหลุด

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

  // State สำหรับเพิ่มสินค้าใหม่
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    DeviceName: "",
    DeviceCode: "",
    SerialNumber: "",
    CategoryID: "",
    StatusID: "",
    Image: "",
    Brand: "",
    DeviceType: "",
    Price: "",
    Quantity: 0,
    Description: "",
  });

  // State สำหรับการแก้ไข (Edit Modal)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState({
    DVID: null,
    DeviceName: "",
    DeviceCode: "",
    SerialNumber: "",
    CategoryID: "",
    StatusID: "",
    Image: "", // รูปใหม่ที่อัปโหลด (Base64)
    currentImage: "", // รูปเดิม (URL/Base64)
    Quantity: "", // เพิ่ม State สำหรับจำนวนคงเหลือในโหมดแก้ไข
    Brand: "",
    DeviceType: "",
    Price: "",
    Description: "",
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

  // State สำหรับ Drag & Drop
  const [isDragging, setIsDragging] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Image Upload Progress State
  const [uploadProgress, setUploadProgress] = useState(0);

  // Crop State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // 'new' or 'edit'

  const fileInputRef = useRef(null); // Ref for hidden file input

  useEffect(() => {
    fetchProducts();
    fetchMasterData();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategories, filterStatuses]);

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

  // --- 2. Main Product Actions (Edit/Delete) ---
  const handleEditClick = (product) => {
    setEditingProduct({
      DVID: product.DVID,
      DeviceName: product.DeviceName,
      DeviceCode: product.DeviceCode,
      SerialNumber: product.SerialNumber || "",
      CategoryID: product.CategoryID,
      StatusID: product.StatusID,
      Image: "", // รีเซ็ตค่ารูปใหม่
      currentImage: product.Image || "",
      isImageDeleted: false,
      Brand: product.Brand || "",
      DeviceType: product.DeviceType || "",
      Price: product.Price || "",
      Quantity: product.Quantity || 0,
      Description: product.Description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (
      !editingProduct.DeviceName ||
      !editingProduct.DeviceCode ||
      !editingProduct.CategoryID ||
      !editingProduct.StatusID
    ) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน", "warning");
      return;
    }

    try {
      const body = {
        DeviceName: editingProduct.DeviceName,
        DeviceCode: editingProduct.DeviceCode,
        SerialNumber: editingProduct.SerialNumber,
        CategoryID: editingProduct.CategoryID,
        StatusID: editingProduct.StatusID,
        Brand: editingProduct.Brand,
        DeviceType: editingProduct.DeviceType,
        Price: editingProduct.Price,
        Quantity: editingProduct.Quantity,
        Description: editingProduct.Description,
      };

      // ส่งรูปภาพไปเฉพาะเมื่อมีการอัปโหลดใหม่ หรือมีการลบรูปภาพ
      if (editingProduct.Image) {
        body.Image = editingProduct.Image;
      } else if (editingProduct.isImageDeleted) {
        body.Image = "";
      }

      const response = await apiFetch(`/api/products/${editingProduct.DVID}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        Swal.fire("สำเร็จ", "อัปเดตข้อมูลสินค้าสำเร็จ", "success");
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

  // Helper function for image validation
  const validateImage = (file) => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      Swal.fire("ข้อผิดพลาด", "กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น", "error");
      return false;
    }
    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      Swal.fire("ข้อผิดพลาด", "ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB", "error");
      return false;
    }
    return true;
  };

  // Helper to read file with progress
  const readFileWithProgress = (file, callback) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    reader.onloadstart = () => setUploadProgress(1); // Start at 1%
    reader.onloadend = () => {
      setUploadProgress(0); // Reset on finish
      callback(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // --- Crop Logic ---
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (cropTarget === "new") {
        setNewProduct({ ...newProduct, Image: croppedImage });
      } else if (cropTarget === "edit") {
        setEditingProduct({ ...editingProduct, Image: croppedImage });
      }
      setIsCropModalOpen(false);
      setImageToCrop(null);
      setZoom(1);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "เกิดข้อผิดพลาดในการตัดรูปภาพ", "error");
    }
  };

  const initiateCrop = (imageSrc, target) => {
    setImageToCrop(imageSrc);
    setCropTarget(target);
    setIsCropModalOpen(true);
  };

  const handleEditProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!validateImage(file)) return;
      readFileWithProgress(file, (result) => {
        initiateCrop(result, "edit");
      });
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
      !newProduct.DeviceName ||
      !newProduct.DeviceCode ||
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
          DeviceName: "",
          DeviceCode: "",
          SerialNumber: "",
          CategoryID: "",
          StatusID: "",
          Image: "",
          Brand: "",
          DeviceType: "",
          Price: "",
          Quantity: 0,
          Description: "",
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
      if (!validateImage(file)) return;
      readFileWithProgress(file, (result) => {
        initiateCrop(result, "new");
      });
    }
  };

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDropNewProduct = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && validateImage(file)) {
      readFileWithProgress(file, (result) => {
        initiateCrop(result, "new");
      });
    }
  };

  const handleDropEditProduct = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && validateImage(file)) {
      readFileWithProgress(file, (result) => {
        initiateCrop(result, "edit");
      });
    }
  };

  const handleRemoveNewProductImage = (e) => {
    e.preventDefault();
    e.stopPropagation(); // ป้องกันไม่ให้ event ทะลุไป trigger input file
    setNewProduct({ ...newProduct, Image: "" });
  };

  const handleRemoveEditProductImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    Swal.fire({
      title: "ยืนยันการลบรูปภาพ?",
      text: "คุณต้องการลบรูปภาพสินค้านี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        setEditingProduct({
          ...editingProduct,
          Image: "",
          currentImage: "",
          isImageDeleted: true,
        });
        Swal.fire(
          "ลบสำเร็จ!",
          "รูปภาพถูกลบแล้ว (กดบันทึกเพื่อยืนยัน)",
          "success",
        );
      }
    });
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

  // --- 4. Filtering ---
  const filteredProducts = products.filter((p) => {
    const lowerTerm = searchTerm.toLowerCase();
    return (
      ((p.DeviceName &&
        String(p.DeviceName).toLowerCase().includes(lowerTerm)) ||
        (p.DeviceCode &&
          String(p.DeviceCode).toLowerCase().includes(lowerTerm)) ||
        (p.SerialNumber &&
          String(p.SerialNumber).toLowerCase().includes(lowerTerm))) &&
      (filterCategories.length > 0
        ? filterCategories.includes(p.CategoryID?.toString())
        : true) && // กรองหมวดหมู่
      (filterStatuses.length > 0
        ? filterStatuses.includes(p.StatusID?.toString())
        : true)
    ); // กรองสถานะ
  });

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

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
                  onClick={handleImportClick}
                >
                  <FileUp size={18} /> Import Excel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus size={18} /> เพิ่มสินค้า
                </button>
              </div>
            )}
          </div>

          <div className="table-container">
            <table className="member-table">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th>รหัสสินค้า</th>
                  <th>Serial No.</th>
                  <th>หมวดหมู่</th>
                  <th>จำนวน</th>
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
                            src={p.Image || defaultProductImage}
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
                      <td>{p.Quantity}</td>
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
                            aria-label={`แก้ไข ${p.DeviceName}`}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(p.DVID)}
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

          {/* Pagination Controls */}
          {!loading && filteredProducts.length > 0 && (
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
              <button
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
              <button
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
                    value={newProduct.DeviceName}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        DeviceName: e.target.value,
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
                    value={newProduct.DeviceCode}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        DeviceCode: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addSerialNumber">Serial Number</label>
                  <input
                    id="addSerialNumber"
                    type="text"
                    value={newProduct.SerialNumber}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        SerialNumber: e.target.value,
                      })
                    }
                    placeholder="ระบุ Serial Number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addBrand">ยี่ห้อ (Brand)</label>
                  <input
                    id="addBrand"
                    type="text"
                    value={newProduct.Brand}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, Brand: e.target.value })
                    }
                    placeholder="ระบุยี่ห้อ (ถ้ามี)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addDeviceType">รุ่น/ชนิด (Type)</label>
                  <input
                    id="addDeviceType"
                    type="text"
                    value={newProduct.DeviceType}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        DeviceType: e.target.value,
                      })
                    }
                    placeholder="ระบุรุ่นหรือชนิด (ถ้ามี)"
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
                <div className="form-group">
                  <label htmlFor="addPrice">ราคา</label>
                  <input
                    id="addPrice"
                    type="number"
                    value={newProduct.Price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, Price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addQuantity">จำนวน</label>
                  <input
                    id="addQuantity"
                    type="number"
                    value={newProduct.Quantity}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, Quantity: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="form-group form-group-full">
                  <label htmlFor="addDescription">รายละเอียด</label>
                  <textarea
                    id="addDescription"
                    value={newProduct.Description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        Description: e.target.value,
                      })
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
                  <label htmlFor="addProductImage">รูปภาพ</label>
                  <div className="image-upload-wrapper">
                    <label
                      htmlFor="addProductImage"
                      className={`image-preview ${isDragging ? "dragging" : ""}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDropNewProduct}
                    >
                      {newProduct.Image ? (
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <img src={newProduct.Image} alt="Preview" />
                          <button
                            type="button"
                            onClick={handleRemoveNewProductImage}
                            className="btn-remove-image"
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="image-placeholder"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            color: "#888",
                          }}
                        >
                          <ImageIcon size={32} />
                          <span
                            style={{ marginTop: "8px", fontSize: "0.9rem" }}
                          >
                            คลิกเพื่อเพิ่มรูปภาพ
                          </span>
                        </div>
                      )}
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
                      id="addProductImage"
                      type="file"
                      accept="image/*"
                      onChange={handleNewProductImageChange}
                      style={{ display: "none" }}
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
                    value={editingProduct.DeviceName}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        DeviceName: e.target.value,
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
                    value={editingProduct.DeviceCode}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        DeviceCode: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editSerialNumber">Serial Number</label>
                  <input
                    id="editSerialNumber"
                    type="text"
                    value={editingProduct.SerialNumber}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        SerialNumber: e.target.value,
                      })
                    }
                    placeholder="ระบุ Serial Number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editBrand">ยี่ห้อ (Brand)</label>
                  <input
                    id="editBrand"
                    type="text"
                    value={editingProduct.Brand}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        Brand: e.target.value,
                      })
                    }
                    placeholder="ระบุยี่ห้อ"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editDeviceType">รุ่น/ชนิด (Type)</label>
                  <input
                    id="editDeviceType"
                    type="text"
                    value={editingProduct.DeviceType}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        DeviceType: e.target.value,
                      })
                    }
                    placeholder="ระบุรุ่นหรือชนิด"
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
                <div className="form-group">
                  <label htmlFor="editPrice">ราคา</label>
                  <input
                    id="editPrice"
                    type="number"
                    value={editingProduct.Price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        Price: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editQuantity">จำนวน</label>
                  <input
                    id="editQuantity"
                    type="number"
                    value={editingProduct.Quantity}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        Quantity: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group form-group-full">
                  <label htmlFor="editDescription">รายละเอียด</label>
                  <textarea
                    id="editDescription"
                    value={editingProduct.Description}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        Description: e.target.value,
                      })
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
                  <label htmlFor="editProductImage">
                    รูปภาพ (อัปโหลดใหม่เพื่อเปลี่ยน)
                  </label>
                  <div className="image-upload-wrapper">
                    <label
                      htmlFor="editProductImage"
                      className={`image-preview ${isDragging ? "dragging" : ""}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDropEditProduct}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={
                            editingProduct.Image ||
                            editingProduct.currentImage ||
                            defaultProductImage
                          }
                          alt="Preview"
                        />
                        {(editingProduct.Image ||
                          editingProduct.currentImage) && (
                          <button
                            type="button"
                            onClick={handleRemoveEditProductImage}
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
                      id="editProductImage"
                      type="file"
                      accept="image/*"
                      onChange={handleEditProductImageChange}
                      style={{ display: "none" }}
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
      {/* Modal สำหรับ Crop รูปภาพ */}
      {isCropModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <h2>ปรับแต่งรูปภาพ</h2>
            <div className="crop-container">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1} // อัตราส่วน 1:1 (สี่เหลี่ยมจัตุรัส)
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
    </div>
  );
};

export default ProductManagement;

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
