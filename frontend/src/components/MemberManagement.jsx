import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, Save, X, User, Plus } from "lucide-react";
import "./MemberManagement.css";

const MemberManagement = () => {
  const [activeTab, setActiveTab] = useState("members"); // members, departments, roles
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ roleId: "", statusId: "" });
  const [masterData, setMasterData] = useState({ roles: [], statuses: [] });

  // State for simple CRUD (Departments & Roles)
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchMasterData();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
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
      const [rolesRes, statusRes] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/emp-statuses"),
      ]);
      if (rolesRes.ok && statusRes.ok) {
        const rolesData = await rolesRes.json();
        setMasterData({
          roles: rolesData,
          statuses: await statusRes.json(),
        });
        setRoles(rolesData); // Set for management tab
      }

      const deptRes = await fetch("/api/departments");
      if (deptRes.ok) {
        setDepartments(await deptRes.json());
      }
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
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        alert("อัปเดตข้อมูลสำเร็จ");
        setEditingId(null);
        fetchUsers();
      } else {
        alert("เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิกคนนี้?")) {
      try {
        const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
        if (response.ok) {
          fetchUsers();
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
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

  const handleAddItem = async (type) => {
    if (!newItemName.trim()) return;
    const endpoint = type === "department" ? "/api/departments" : "/api/roles";
    const body =
      type === "department"
        ? { DepartmentName: newItemName }
        : { RoleName: newItemName };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setNewItemName("");
        fetchMasterData(); // Refresh data
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleUpdateItem = async (type, id) => {
    if (!editingItemName.trim()) return;
    const endpoint =
      type === "department" ? `/api/departments/${id}` : `/api/roles/${id}`;
    const body =
      type === "department"
        ? { DepartmentName: editingItemName }
        : { RoleName: editingItemName };

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditingItemId(null);
        setEditingItemName("");
        fetchMasterData();
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm("ยืนยันการลบข้อมูล?")) return;
    const endpoint =
      type === "department" ? `/api/departments/${id}` : `/api/roles/${id}`;
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        fetchMasterData();
      } else {
        const data = await res.json();
        alert(data.message || "ไม่สามารถลบได้");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
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
            placeholder={`ชื่อ${title}...`}
          />
          <button className="btn-add-mini" onClick={() => handleAddItem(type)}>
            <Plus size={16} /> เพิ่ม
          </button>
        </div>
      </div>
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
                        className="btn-icon save"
                        onClick={() => handleUpdateItem(type, item[idKey])}
                      >
                        <Save size={16} />
                      </button>
                      <button
                        className="btn-icon cancel"
                        onClick={() => setEditingItemId(null)}
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-icon edit"
                        onClick={() => {
                          setEditingItemId(item[idKey]);
                          setEditingItemName(item[nameKey]);
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
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
          className={`tab-btn ${activeTab === "roles" ? "active" : ""}`}
          onClick={() => setActiveTab("roles")}
        >
          ประเภทสมาชิก
        </button>
      </div>

      {activeTab === "members" && (
        <>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, Username, หรือรหัสพนักงาน..."
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
                          <div className="avatar-circle">
                            {user.fname.charAt(0)}
                          </div>
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
                                {s.StatusName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`status-dot ${user.StatusName.toLowerCase()}`}
                          >
                            {user.StatusName}
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
      {activeTab === "roles" &&
        renderCrudTable(
          "จัดการประเภทสมาชิก",
          roles,
          "role",
          "RoleID",
          "RoleName",
        )}
    </div>
  );
};

export default MemberManagement;
