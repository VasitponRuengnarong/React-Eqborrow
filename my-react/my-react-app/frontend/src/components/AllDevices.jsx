import React, { useState, useEffect } from "react";
import "./AllDevices.css";

const AllDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // เรียก API ที่เราเตรียมไว้ใน server.js
        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch devices");
        }

        const data = await response.json();
        setDevices(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching devices:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [catRes, statusRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/device-statuses"),
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (statusRes.ok) setStatuses(await statusRes.json());
      } catch (err) {
        console.error("Error fetching master data:", err);
      }
    };
    fetchMasterData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("คุณต้องการลบอุปกรณ์นี้ใช่หรือไม่?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete device");
      }

      setDevices(devices.filter((device) => device.DVID !== id));
      alert("ลบอุปกรณ์สำเร็จ");
    } catch (err) {
      console.error("Error deleting device:", err);
      alert("เกิดข้อผิดพลาดในการลบอุปกรณ์: " + err.message);
    }
  };

  const handleEditClick = (device) => {
    setEditingDevice({ ...device });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setEditingDevice((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/products/${editingDevice.DVID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          DeviceName: editingDevice.DeviceName,
          DeviceCode: editingDevice.DeviceCode,
          SerialNumber: editingDevice.SerialNumber,
          CategoryID: editingDevice.CategoryID,
          StatusID: editingDevice.StatusID,
          Brand: editingDevice.Brand,
          DeviceType: editingDevice.DeviceType,
          Price: editingDevice.Price,
          Quantity: editingDevice.Quantity,
          Description: editingDevice.Description,
          Image: editingDevice.Image,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update device");
      }

      // Update local state
      setDevices(
        devices.map((d) => (d.DVID === editingDevice.DVID ? editingDevice : d)),
      );
      alert("แก้ไขข้อมูลสำเร็จ");
      handleModalClose();
    } catch (err) {
      console.error("Error updating device:", err);
      alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + err.message);
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case "ว่าง":
      case "Active": // รองรับ TB_M_StatusEMP
        return "status-available";
      case "ถูกยืม":
        return "status-borrowed";
      case "ส่งซ่อม":
      case "ชำรุด":
      case "Inactive": // รองรับ TB_M_StatusEMP
        return "status-repair";
      case "สูญหาย":
        return "status-lost";
      default:
        return "";
    }
  };

  if (loading) return <div className="p-4 text-center">กำลังโหลดข้อมูล...</div>;
  if (error)
    return (
      <div className="p-4 text-center text-red-500">
        เกิดข้อผิดพลาด: {error}
      </div>
    );

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        รายการอุปกรณ์ทั้งหมด
      </h2>

      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                รูปภาพ
              </th>
              <th scope="col" className="px-6 py-3">
                ชื่ออุปกรณ์
              </th>
              <th scope="col" className="px-6 py-3">
                รหัสครุภัณฑ์
              </th>
              <th scope="col" className="px-6 py-3">
                Serial Number
              </th>
              <th scope="col" className="px-6 py-3">
                ยี่ห้อ
              </th>
              <th scope="col" className="px-6 py-3">
                ประเภท
              </th>
              <th scope="col" className="px-6 py-3">
                หมวดหมู่
              </th>
              <th scope="col" className="px-6 py-3">
                สถานะ
              </th>
              <th scope="col" className="px-6 py-3">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.length > 0 ? (
              devices.map((device) => (
                <tr
                  key={device.DVID}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    {device.Image ? (
                      <img
                        src={device.Image}
                        alt={device.DeviceName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        ไม่มีรูป
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    <div className="user-profile-section">
                      <div
                        className={`status-dot ${getStatusColorClass(device.StatusNameDV)}`}
                      ></div>
                      <div className="user-name">{device.DeviceName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{device.DeviceCode || "-"}</td>
                  <td className="px-6 py-4">{device.SerialNumber || "-"}</td>
                  <td className="px-6 py-4">
                    {/* แสดง BrandName จากตาราง Master ถ้าไม่มีให้แสดง Brand เดิม */}
                    {device.BrandName || device.Brand || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {/* แสดง TypeName จากตาราง Master ถ้าไม่มีให้แสดง DeviceType เดิม */}
                    {device.TypeName || device.DeviceType || "-"}
                  </td>
                  <td className="px-6 py-4">{device.CategoryName || "-"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${
                        device.StatusNameDV === "ว่าง"
                          ? "bg-green-100 text-green-800"
                          : device.StatusNameDV === "ถูกยืม"
                            ? "bg-yellow-100 text-yellow-800"
                            : device.StatusNameDV === "ส่งซ่อม"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {device.StatusNameDV || "ไม่ระบุ"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(device)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(device.DVID)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">
                  ไม่พบข้อมูลอุปกรณ์
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">แก้ไขข้อมูลอุปกรณ์</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      ชื่ออุปกรณ์
                    </label>
                    <input
                      type="text"
                      name="DeviceName"
                      value={editingDevice.DeviceName || ""}
                      onChange={handleModalChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      รหัสครุภัณฑ์
                    </label>
                    <input
                      type="text"
                      name="DeviceCode"
                      value={editingDevice.DeviceCode || ""}
                      onChange={handleModalChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      name="SerialNumber"
                      value={editingDevice.SerialNumber || ""}
                      onChange={handleModalChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      หมวดหมู่
                    </label>
                    <select
                      name="CategoryID"
                      value={editingDevice.CategoryID || ""}
                      onChange={handleModalChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                      <option value="">-- เลือกหมวดหมู่ --</option>
                      {categories.map((c) => (
                        <option key={c.CategoryID} value={c.CategoryID}>
                          {c.CategoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      สถานะ
                    </label>
                    <select
                      name="StatusID"
                      value={editingDevice.StatusID || ""}
                      onChange={handleModalChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                      <option value="">-- เลือกสถานะ --</option>
                      {statuses.map((s) => (
                        <option key={s.DVStatusID} value={s.DVStatusID}>
                          {s.StatusNameDV}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      ราคา
                    </label>
                    <input
                      type="number"
                      name="Price"
                      value={editingDevice.Price || 0}
                      onChange={handleModalChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      ยี่ห้อ (Brand)
                    </label>
                    <input
                      type="text"
                      name="Brand"
                      value={editingDevice.Brand || ""}
                      onChange={handleModalChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      ประเภท (Type)
                    </label>
                    <input
                      type="text"
                      name="DeviceType"
                      value={editingDevice.DeviceType || ""}
                      onChange={handleModalChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllDevices;
