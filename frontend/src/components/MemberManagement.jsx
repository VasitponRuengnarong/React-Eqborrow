import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, Save, X, User, Plus } from "lucide-react";
import "./MemberManagement.css";
import "./Management.css";
import Swal from "sweetalert2"; // Import SweetAlert2

const defaultProfileImage = "/logo.png"; // Placeholder for profile image

const MemberManagement = () => {
  const [activeTab, setActiveTab] = useState("members"); // members, departments, roles
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null); // To check user role for authorization
  const [editForm, setEditForm] = useState({ roleId: "", statusId: "" });
  const [masterData, setMasterData] = useState({ roles: [], statuses: [] });

  // State for simple CRUD (Departments & Roles)
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchMasterData();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [rolesRes, statusRes, deptRes, instRes] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/emp-statuses"),
        fetch("/api/departments"),
        fetch("/api/institutions"),
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData);
        setMasterData((prev) => ({ ...prev, roles: rolesData }));
      }
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatuses(statusData);
        setMasterData((prev) => ({ ...prev, statuses: statusData }));
      }
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (instRes.ok) setInstitutions(await instRes.json());
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  const handleEditClick = (user) => {
    setEditingId(user.EMPID);
    setEditForm({ roleId: user.RoleID, statusId: user.EMPStatusID });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        Swal.fire("แจ้งเตือน", "ไม่พบ Token การยืนยันตัวตน", "error");
        return;
      }

      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        Swal.fire("สำเร็จ!", "อัปเดตข้อมูลสำเร็จ", "success");
        setEditingId(null);
        fetchUsers();
      } else {
        const errorData = await response.json();
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          errorData.message || "ไม่สามารถอัปเดตข้อมูลได้",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating user:", error);
      Swal.fire(
        "เกิดข้อผิดพลาด!",
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        "error",
      );
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการลบสมาชิกคนนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          Swal.fire("ข้อผิดพลาด!", "ไม่พบโทเค็นการยืนยันตัวตน", "error");
          return;
        }

        try {
          const response = await fetch(`/api/users/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            Swal.fire("ลบสำเร็จ!", "สมาชิกถูกลบเรียบร้อยแล้ว", "success");
            fetchUsers();
          } else {
            const errorData = await response.json();
            Swal.fire(
              "เกิดข้อผิดพลาด!",
              errorData.message || "ไม่สามารถลบสมาชิกได้",
              "error",
            );
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          Swal.fire(
            "เกิดข้อผิดพลาด!",
            "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
            "error",
          );
        }
      }
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.EMP_NUM.includes(searchTerm),
  );

  // --- Simple CRUD Logic for Departments & Roles ---
  const [newItemName, setNewItemName] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemName, setEditingItemName] = useState("");

  // Check if the current user is an Admin
  const isAdminUser = user?.role === "Admin" || user?.role === "admin";
  if (!isAdminUser) {
    // If not admin, disable all CRUD actions for master data
  }

  const handleAddItem = async (type) => {
    if (!newItemName.trim()) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลก่อนกดเพิ่ม", "warning");
      return;
    }

    let endpoint = "";
    let body = {};

    if (type === "department") {
      endpoint = "/api/departments";
      body = { DepartmentName: newItemName };
    } else if (type === "role") {
      endpoint = "/api/roles";
      body = { RoleName: newItemName };
    } else if (type === "institution") {
      endpoint = "/api/institutions";
      body = { InstitutionName: newItemName };
    } else if (type === "status") {
      endpoint = "/api/emp-statuses";
      body = { StatusNameEMP: newItemName };
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        Swal.fire("แจ้งเตือน", "ไม่พบ Token การยืนยันตัวตน", "error");
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        Swal.fire("เพิ่มสำเร็จ!", "ข้อมูลถูกเพิ่มเรียบร้อยแล้ว", "success");
        setNewItemName("");
        fetchMasterData(); // Refresh data
      } else {
        const errorData = await res.json();
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          errorData.message || "ไม่สามารถเพิ่มข้อมูลได้",
          "error",
        );
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleUpdateItem = async (type, id) => {
    if (!editingItemName.trim()) return;

    let endpoint = "";
    let body = {};

    if (type === "department") {
      endpoint = `/api/departments/${id}`;
      body = { DepartmentName: editingItemName };
    } else if (type === "role") {
      endpoint = `/api/roles/${id}`;
      body = { RoleName: editingItemName };
    } else if (type === "institution") {
      endpoint = `/api/institutions/${id}`;
      body = { InstitutionName: editingItemName };
    } else if (type === "status") {
      endpoint = `/api/emp-statuses/${id}`;
      body = { StatusNameEMP: editingItemName };
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        Swal.fire("แจ้งเตือน", "ไม่พบ Token การยืนยันตัวตน", "error");
        return;
      }

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        Swal.fire("แก้ไขสำเร็จ!", "ข้อมูลถูกแก้ไขเรียบร้อยแล้ว", "success");
        setEditingItemId(null);
        setEditingItemName("");
        fetchMasterData();
      } else {
        const errorData = await res.json();
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          errorData.message || "ไม่สามารถแก้ไขข้อมูลได้",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDeleteItem = async (type, id) => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการลบข้อมูลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        let endpoint = "";
        if (type === "department") endpoint = `/api/departments/${id}`;
        else if (type === "role") endpoint = `/api/roles/${id}`;
        else if (type === "institution") endpoint = `/api/institutions/${id}`;
        else if (type === "status") endpoint = `/api/emp-statuses/${id}`;

        const token = localStorage.getItem("accessToken");
        try {
          const res = await fetch(endpoint, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            Swal.fire("ลบสำเร็จ!", "ข้อมูลถูกลบเรียบร้อยแล้ว", "success");
            fetchMasterData();
          } else {
            const data = await res.json();
            Swal.fire(
              "เกิดข้อผิดพลาด!",
              data.message || "ไม่สามารถลบข้อมูลได้",
              "error",
            );
          }
        } catch (error) {
          Swal.fire(
            "เกิดข้อผิดพลาด!",
            "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
            "error",
          );
        }
      }
    });
  };

  const renderCrudTable = (title, items, type, idKey, nameKey) => (
    <div className="crud-section">
      <div className="crud-header">
        <h3>{title}</h3>
        <div className="add-row">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={`ระบุชื่อ${title}...`}
            disabled={!isAdminUser} // Disable if not admin
          />
          <button className="btn-add-mini" onClick={() => handleAddItem(type)}>
            <Plus size={16} /> เพิ่ม
          </button>
        </div>
      </div>
      <div className="table-container">
        <table className="member-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item[idKey]}>
                <td style={{ width: "50px" }}>{item[idKey]}</td>
                <td>
                  {editingItemId === item[idKey] ? (
                    <input
                      type="text"
                      value={editingItemName}
                      onChange={(e) => setEditingItemName(e.target.value)}
                      disabled={!isAdminUser} // Disable if not admin
                      className="edit-input"
                    />
                  ) : (
                    item[nameKey]
                  )}
                </td>
                <td style={{ width: "100px" }}>
                  <div className="action-buttons">
                    {editingItemId === item[idKey] ? (
                      <>
                        <button
                          disabled={!isAdminUser} // Disable if not admin
                          className="btn-icon save"
                          onClick={() => handleUpdateItem(type, item[idKey])}
                        >
                          <Save size={16} />
                        </button>
                        <button
                          disabled={!isAdminUser} // Disable if not admin
                          className="btn-icon cancel"
                          onClick={() => setEditingItemId(null)}
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          disabled={!isAdminUser} // Disable if not admin
                          className="btn-icon edit"
                          onClick={() => {
                            setEditingItemId(item[idKey]);
                            setEditingItemName(item[nameKey]);
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          disabled={!isAdminUser} // Disable if not admin
                          className="btn-icon delete"
                          onClick={() => handleDeleteItem(type, item[idKey])}
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
  );

  return (
    <div className="member-management">
      <div className="page-header">
        <h2>จัดการข้อมูลสมาชิก</h2>
        <p>จัดการรายชื่อ, แผนก, และประเภทสมาชิก</p>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "members" ? "active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          รายชื่อสมาชิก
        </button>
        <button
          className={`tab-btn ${activeTab === "departments" ? "active" : ""}`}
          onClick={() => setActiveTab("departments")}
        >
          จัดการแผนก
        </button>
        <button
          className={`tab-btn ${activeTab === "institutions" ? "active" : ""}`}
          onClick={() => setActiveTab("institutions")}
        >
          จัดการสำนัก
        </button>
        <button
          className={`tab-btn ${activeTab === "roles" ? "active" : ""}`}
          onClick={() => setActiveTab("roles")}
        >
          ประเภทสมาชิก
        </button>
        <button
          className={`tab-btn ${activeTab === "statuses" ? "active" : ""}`}
          onClick={() => setActiveTab("statuses")}
        >
          สถานะพนักงาน
        </button>
      </div>

      {activeTab === "members" && (
        <>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหาจาก ชื่อจริง, ชื่อผู้ใช้, หรือรหัสพนักงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-container">
            <table className="member-table">
              <thead>
                <tr>
                  <th>ชื่อ-นามสกุล</th>
                  <th>รหัสพนักงาน</th>
                  <th>แผนก/สำนัก</th>
                  <th>ตำแหน่ง (Role)</th>
                  <th>สถานะ</th>
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
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      ไม่พบข้อมูลสมาชิก
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.EMPID}>
                      <td>
                        <div className="user-cell">
                          <img // Use local default image
                            src={
                              user.profileImage ||
                              user.image ||
                              defaultProfileImage
                            }
                            alt={user.fname}
                            className="avatar-circle"
                          />
                          <div>
                            <div className="user-name">
                              {user.fname} {user.lname}
                            </div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.EMP_NUM}</td>
                      <td>
                        {user.DepartmentName} / {user.InstitutionName}
                      </td>
                      <td>
                        {editingId === user.EMPID ? (
                          <select
                            value={editForm.roleId}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                roleId: e.target.value,
                              })
                            }
                          >
                            {masterData.roles.map((r) => (
                              <option key={r.RoleID} value={r.RoleID}>
                                {r.RoleName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`role-badge ${user.RoleName.toLowerCase()}`}
                          >
                            {user.RoleName}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingId === user.EMPID ? (
                          <select
                            value={editForm.statusId}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                statusId: e.target.value,
                              })
                            }
                          >
                            {masterData.statuses.map((s) => (
                              <option key={s.EMPStatusID} value={s.EMPStatusID}>
                                {s.StatusNameEMP}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`status-dot ${user.StatusNameEMP?.toLowerCase()}`}
                          >
                            {user.StatusNameEMP}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingId === user.EMPID ? (
                          <div className="action-buttons">
                            <button
                              className="btn-icon save"
                              onClick={() => handleSaveEdit(user.EMPID)}
                            >
                              <Save size={16} />
                            </button>
                            <button
                              className="btn-icon cancel"
                              onClick={handleCancelEdit}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button
                              className="btn-icon edit"
                              onClick={() => handleEditClick(user)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDelete(user.EMPID)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "departments" &&
        renderCrudTable(
          "จัดการแผนก",
          departments,
          "department",
          "DepartmentID",
          "DepartmentName",
        )}
      {activeTab === "institutions" &&
        renderCrudTable(
          "จัดการสำนัก",
          institutions,
          "institution",
          "InstitutionID",
          "InstitutionName",
        )}
      {activeTab === "roles" &&
        renderCrudTable(
          "จัดการประเภทสมาชิก",
          roles,
          "role",
          "RoleID",
          "RoleName",
        )}
      {activeTab === "statuses" &&
        renderCrudTable(
          "จัดการสถานะพนักงาน",
          statuses,
          "status",
          "EMPStatusID",
          "StatusNameEMP",
        )}
    </div>
  );
};

export default MemberManagement;
