import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "./api";
import Swal from "sweetalert2";
import ImageDisplay from "./ImageDisplay"; // Import ImageDisplay
import {
  Check,
  X,
  ArchiveRestore,
  User,
  Calendar,
  ClipboardList,
  Info,
  Search,
} from "lucide-react";
import "./ApprovalPage.css"; // สร้างไฟล์ CSS ใหม่สำหรับหน้านี้

const ApprovalPage = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending"); // 'Pending', 'Approved'
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [borrowToReturn, setBorrowToReturn] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});

  useEffect(() => {
    fetchBorrows();
  }, [filter]);

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      // API เดิมดึงข้อมูลทั้งหมดมา แล้วเรามา filter ที่ Frontend
      const response = await apiFetch("/api/borrows");
      if (response.ok) {
        const data = await response.json();
        const filteredData = data.filter((item) => item.Status === filter);
        setBorrows(filteredData);
      }
    } catch (error) {
      console.error("Error fetching borrows:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (borrowToReturn) {
      const initialQuantities = borrowToReturn.items.reduce((acc, item) => {
        // Use BorrowDetailID as the key
        acc[item.BorrowDetailID] = item.Quantity;
        return acc;
      }, {});
      setReturnQuantities(initialQuantities);
    }
  }, [borrowToReturn]);

  const handleStatusChange = async (borrowId, newStatus) => {
    const actionText = {
      Approved: "อนุมัติ",
      Rejected: "ปฏิเสธ",
      Returned: "ยืนยันการคืน",
    };

    Swal.fire({
      title: `ยืนยันการ${actionText[newStatus]}?`,
      text: `คุณต้องการ${actionText[newStatus]}รายการนี้ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: newStatus === "Rejected" ? "#d33" : "#3085d6",
      cancelButtonColor: "#6e7881",
      confirmButtonText: `ใช่, ${actionText[newStatus]}`,
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiFetch(`/api/borrows/${borrowId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus }),
          });

          if (response.ok) {
            Swal.fire("สำเร็จ!", "ดำเนินการเรียบร้อย", "success");
            fetchBorrows(); // โหลดข้อมูลใหม่
          } else {
            const data = await response.json();
            Swal.fire("เกิดข้อผิดพลาด!", data.message, "error");
          }
        } catch (error) {
          Swal.fire("เกิดข้อผิดพลาด!", "การเชื่อมต่อขัดข้อง", "error");
        }
      }
    });
  };

  const handleQuantityChange = (borrowDetailId, value, maxQuantity) => {
    const numValue = Number(value);
    // Allow values between 0 and the max borrowed quantity
    if (!isNaN(numValue) && numValue >= 0 && numValue <= maxQuantity) {
      setReturnQuantities((prev) => ({ ...prev, [borrowDetailId]: numValue }));
    }
  };

  const handleConfirmReturn = async () => {
    if (!borrowToReturn) return;

    const itemsToReturn = Object.entries(returnQuantities).map(
      ([borrowDetailId, returnedQuantity]) => ({
        borrowDetailId,
        returnedQuantity: Number(returnedQuantity),
      }),
    );

    try {
      const response = await apiFetch(
        `/api/borrows/${borrowToReturn.BorrowID}/status`,
        {
          method: "PUT",
          body: JSON.stringify({
            status: "Returned",
            items: itemsToReturn,
          }),
        },
      );

      if (response.ok) {
        Swal.fire("สำเร็จ!", "บันทึกการคืนอุปกรณ์เรียบร้อย", "success");
        setIsReturnModalOpen(false);
        setBorrowToReturn(null);
        fetchBorrows(); // Refresh the list
      } else {
        const data = await response.json();
        Swal.fire("เกิดข้อผิดพลาด!", data.message, "error");
      }
    } catch (error) {
      console.error("Error confirming return:", error);
      Swal.fire("เกิดข้อผิดพลาด!", "การเชื่อมต่อขัดข้อง", "error");
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // กรองข้อมูลที่แสดงผลตามคำค้นหา (ทำงานฝั่ง Client)
  const displayedBorrows = useMemo(() => {
    if (!searchQuery) {
      return borrows;
    }
    return borrows.filter((borrow) =>
      `${borrow.fname} ${borrow.lname}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [borrows, searchQuery]);

  const renderCard = (borrow) => (
    <div key={borrow.BorrowID} className="approval-card">
      <div className="card-header">
        <div className="user-info">
          <div className="avatar">
            <User size={20} />
          </div>
          <div>
            <p className="user-name">
              {borrow.fname} {borrow.lname}
            </p>
            <p className="user-department">{borrow.DepartmentName}</p>
          </div>
        </div>
        <div className="borrow-date">
          <Calendar size={16} />
          <span>
            {new Date(borrow.BorrowDate).toLocaleDateString("th-TH")} -{" "}
            {new Date(borrow.ReturnDate).toLocaleDateString("th-TH")}
          </span>
        </div>
      </div>
      <div className="card-body">
        <div className="info-item">
          <Info size={16} />
          <strong>วัตถุประสงค์:</strong> {borrow.Purpose}
        </div>
        <div className="info-item">
          <ClipboardList size={16} />
          <strong>รายการอุปกรณ์:</strong>
          <ul className="item-list">
            {borrow.items.map((item, idx) => (
              <li key={idx} onClick={() => handleItemClick(item)}>
                <span className="item-name-clickable">{item.ItemName}</span>{" "}
                <span>(x{item.Quantity})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card-footer">
        {borrow.Status === "Pending" && (
          <>
            <button
              className="btn-approve"
              onClick={() => handleStatusChange(borrow.BorrowID, "Approved")}
            >
              <Check size={16} /> อนุมัติ
            </button>
            <button
              className="btn-reject"
              onClick={() => handleStatusChange(borrow.BorrowID, "Rejected")}
            >
              <X size={16} /> ปฏิเสธ
            </button>
          </>
        )}
        {borrow.Status === "Approved" && (
          <button
            className="btn-return"
            onClick={() => {
              setBorrowToReturn(borrow);
              setIsReturnModalOpen(true);
            }}
          >
            <ArchiveRestore size={16} /> ยืนยันการคืน
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="management-page">
      <div className="page-header">
        <h2>อนุมัติการยืม-คืน</h2>
        <p>จัดการคำขอยืมและยืนยันการคืนอุปกรณ์</p>
      </div>

      <div className="approval-controls">
        <div className="tabs-container">
          <button
            className={`tab-btn ${filter === "Pending" ? "active" : ""}`}
            onClick={() => setFilter("Pending")}
          >
            รออนุมัติ
          </button>
          <button
            className={`tab-btn ${filter === "Approved" ? "active" : ""}`}
            onClick={() => setFilter("Approved")}
          >
            รอการคืน
          </button>
        </div>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหาจากชื่อผู้ยืม..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-container">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="approval-grid">
          {displayedBorrows.length > 0 ? (
            displayedBorrows.map(renderCard)
          ) : (
            <div className="no-data-card">
              <ClipboardList size={48} />
              <p>
                {searchQuery
                  ? "ไม่พบผลลัพธ์ที่ตรงกัน"
                  : "ไม่มีรายการในหมวดหมู่นี้"}
              </p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && selectedItem && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content item-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>รายละเอียดอุปกรณ์</h2>
            <div className="item-detail-content">
              <ImageDisplay
                data={selectedItem.Image}
                alt={selectedItem.ItemName}
                className="item-detail-image"
              />
              <div className="item-detail-info">
                <p>
                  <strong>ชื่ออุปกรณ์:</strong> {selectedItem.ItemName}
                </p>
                <p>
                  <strong>Serial No.:</strong> {selectedItem.ProductCode || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isReturnModalOpen && borrowToReturn && (
        <div
          className="modal-overlay"
          onClick={() => setIsReturnModalOpen(false)}
        >
          <div
            className="modal-content item-return-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>ยืนยันการคืนอุปกรณ์</h2>
            <p>
              กรุณาตรวจสอบและแก้ไขจำนวนอุปกรณ์ที่ได้รับคืน
              (กรณีคืนไม่ครบตามจำนวนที่ยืม)
            </p>
            <div className="return-item-list">
              {borrowToReturn.items.map((item) => (
                <div key={item.BorrowDetailID} className="return-item">
                  <span className="return-item-name">{item.ItemName}</span>
                  <div className="return-quantity-control">
                    <input
                      type="number"
                      className="quantity-input"
                      value={returnQuantities[item.BorrowDetailID] || 0}
                      onChange={(e) =>
                        handleQuantityChange(
                          item.BorrowDetailID,
                          e.target.value,
                          item.Quantity,
                        )
                      }
                      max={item.Quantity}
                      min="0"
                    />
                    <span className="total-quantity">/ {item.Quantity}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setIsReturnModalOpen(false)}
              >
                ยกเลิก
              </button>
              <button className="btn btn-primary" onClick={handleConfirmReturn}>
                ยืนยันการคืน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalPage;
