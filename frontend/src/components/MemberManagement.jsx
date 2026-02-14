import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  User,
  Filter,
  CheckCircle,
  Edit,
  ChevronLeft,
  ChevronRight,
  X,
  Key,
} from "lucide-react";
import Swal from "sweetalert2";
import { apiFetch } from "./api";
import "./MemberManagement.css";

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [currentUser, setCurrentUser] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
    fetchMembers();
    fetchMasterData();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        // Map API data to component state structure
        const mappedMembers = data.map((user) => ({
          id: user.EMPID,
          firstName: user.fname,
          lastName: user.lname,
          username: user.username,
          email: user.email,
          phone: user.phone,
          employeeId: user.EMP_NUM,
          role: user.RoleName,
          roleId: user.RoleID,
          status: user.StatusName,
          statusId: user.EMPStatusID,
          departmentId: user.DepartmentID,
          institutionId: user.InstitutionID,
          DepartmentName: user.DepartmentName,
          InstitutionName: user.InstitutionName,
          profileImage: null, // API currently doesn't return image in list
        }));
        setMembers(mappedMembers);
      } else {
        console.error("Failed to fetch members");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [rolesRes, instRes, deptRes] = await Promise.all([
        apiFetch("/api/roles"),
        apiFetch("/api/institutions"),
        apiFetch("/api/departments"),
      ]);
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (instRes.ok) setInstitutions(await instRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch (error) {
      console.error("Error fetching master data", error);
    }
  };

  const handleRoleChange = async (member, newRoleId) => {
    const newRoleName = roles.find(r => r.RoleID === parseInt(newRoleId))?.RoleName || newRoleId;
    const result = await Swal.fire({
      title: "เปลี่ยนสิทธิ์ผู้ใช้งาน?",
      text: `คุณต้องการเปลี่ยนสิทธิ์ของ ${member.firstName} เป็น ${newRoleName} ใช่หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ใช่, เปลี่ยนเลย",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#9ca3af",
    });

    if (result.isConfirmed) {
      try {
        const response = await apiFetch(`/api/users/${member.id}`, {
          method: "PUT",
          body: JSON.stringify({ roleId: newRoleId, statusId: member.statusId }),
        });

        if (response.ok) {
          Swal.fire("สำเร็จ", "เปลี่ยนสิทธิ์เรียบร้อยแล้ว", "success");
          fetchMembers(); // Refresh list
        } else {
          const err = await response.json();
          Swal.fire(
            "ผิดพลาด",
            err.message || "ไม่สามารถเปลี่ยนสิทธิ์ได้",
            "error",
          );
        }
      } catch (error) {
        Swal.fire("Error", "Connection error", "error");
      }
    }
  };

  const handleResetPassword = async (member) => {
    const { value: newPassword } = await Swal.fire({
      title: `รีเซ็ตรหัสผ่าน ${member.firstName}?`,
      text: "กรุณากำหนดรหัสผ่านใหม่สำหรับผู้ใช้นี้",
      input: "password",
      inputLabel: "รหัสผ่านใหม่",
      inputPlaceholder: "กรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร",
      inputAttributes: {
        minlength: "6",
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      inputValidator: (value) => {
        if (!value) {
          return "กรุณากรอกรหัสผ่าน!";
        }
        if (value.length < 6) {
          return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
        }
      },
    });

    if (newPassword) {
      try {
        const response = await apiFetch(`/api/users/${member.id}/reset-password`, {
          method: "PUT",
          body: JSON.stringify({ newPassword }),
        });

        if (response.ok) {
          Swal.fire("สำเร็จ", "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว", "success");
        } else {
          const err = await response.json();
          Swal.fire("ผิดพลาด", err.message || "ไม่สามารถรีเซ็ตรหัสผ่านได้", "error");
        }
      } catch (error) {
        Swal.fire("Error", "Connection error", "error");
      }
    }
  };

  const handleDelete = async (member) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: `คุณต้องการลบผู้ใช้ ${member.firstName} ${member.lastName} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ลบผู้ใช้",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const response = await apiFetch(`/api/users/${member.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          Swal.fire("ลบสำเร็จ", "ผู้ใช้ถูกลบออกจากระบบแล้ว", "success");
          fetchMembers();
        } else {
          Swal.fire("ผิดพลาด", "ไม่สามารถลบผู้ใช้ได้", "error");
        }
      } catch (error) {
        Swal.fire("Error", "Connection error", "error");
      }
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "All" || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Edit Handlers
  const handleEditClick = (member) => {
    setEditingMember({ ...member });
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      // ใช้ endpoint เดียวกับ UserProfile หรือสร้างใหม่สำหรับ Admin
      const response = await apiFetch(`/api/profile/${editingMember.id}`, {
        method: "PUT",
        body: JSON.stringify({
          firstName: editingMember.firstName,
          lastName: editingMember.lastName,
          employeeId: editingMember.employeeId,
          phone: editingMember.phone,
          institutionId: editingMember.institutionId,
          departmentId: editingMember.departmentId,
        }),
      });

      if (response.ok) {
        Swal.fire("สำเร็จ", "แก้ไขข้อมูลเรียบร้อย", "success");
        setIsEditModalOpen(false);
        fetchMembers();
      } else {
        const err = await response.json();
        throw new Error(err.message || "Failed to update");
      }
    } catch (error) {
      Swal.fire("ผิดพลาด", error.message || "ไม่สามารถแก้ไขข้อมูลได้", "error");
    }
  };

  const filteredDepartments = editingMember?.institutionId
    ? departments.filter((d) => d.InstitutionID === Number(editingMember.institutionId))
    : departments;

  return (
    <div className="member-management-container">
      <div className="page-header">
        <h2>จัดการสมาชิก</h2>
        <p>ดูรายชื่อ, แก้ไขสิทธิ์, และจัดการผู้ใช้งานในระบบ</p>
      </div>

      <div className="controls-bar">
        <div className="search-wrapper">
          <div className="search-input-group">
            <Search className="search-icon-left" size={20} />
            <input
              type="text"
              className="search-input-custom"
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, หรืออีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-wrapper">
          <button
            className={`filter-toggle-btn ${isFilterOpen ? "active" : ""}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={18} />
            <span>{roleFilter === "All" ? "ทุกตำแหน่ง" : roleFilter}</span>
          </button>
          {isFilterOpen && (
            <div className="chip-popup-container">
              <div className="chip-container">
                {["All", "User", "Admin", "Approver"].map((role) => (
                  <button
                    key={role}
                    className={`chip ${roleFilter === role ? "active" : ""}`}
                    onClick={() => {
                      setRoleFilter(role);
                      setIsFilterOpen(false);
                    }}
                  >
                    {role === "All" ? "ทุกตำแหน่ง" : role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="members-table">
          <thead>
            <tr>
              <th>ผู้ใช้งาน</th>
              <th>รหัสพนักงาน</th>
              <th>สังกัด</th>
              <th>ตำแหน่ง</th>
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
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  ไม่พบข้อมูลสมาชิก
                </td>
              </tr>
            ) : (
              currentMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-circle">
                        {member.profileImage ? (
                          <img src={member.profileImage} alt="profile" />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div className="user-info-cell">
                        <span className="user-fullname">
                          {member.firstName} {member.lastName}
                        </span>
                        <span className="user-email">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{member.employeeId || "-"}</td>
                  <td>
                    <div className="dept-info">
                      <span>{member.InstitutionName || "-"}</span>
                      <small>{member.DepartmentName || "-"}</small>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`role-badge ${member.role?.toLowerCase() || "user"}`}
                    >
                      {member.role || "User"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${member.status === 'Inactive' ? 'inactive' : 'active'}`}>
                      <CheckCircle size={14} /> {member.status || "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <select
                        className="role-edit-select"
                        value={member.roleId}
                        onChange={(e) =>
                          handleRoleChange(member, e.target.value)
                        }
                        disabled={currentUser?.id === member.id}
                      >
                        {roles.map((role) => (
                          <option key={role.RoleID} value={role.RoleID}>
                            {role.RoleName}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn-icon edit"
                        onClick={() => handleEditClick(member)}
                        disabled={currentUser?.id === member.id}
                        title="แก้ไขข้อมูล"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleResetPassword(member)}
                        title="รีเซ็ตรหัสผ่าน"
                        style={{ color: "#f59e0b" }}
                      >
                        <Key size={18} />
                      </button>
                      <button
                        className="btn-delete-icon"
                        onClick={() => handleDelete(member)}
                        disabled={currentUser?.id === member.id}
                        title="ลบผู้ใช้"
                      >
                        <Trash2 size={18} />
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
      {!loading && filteredMembers.length > itemsPerPage && (
        <div className="pagination-container">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="pagination-info">
            หน้า {currentPage} จาก {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingMember && (
        <div className="modal-overlay">
          <div className="modal-content edit-member-modal">
            <div className="modal-header">
              <h3>แก้ไขข้อมูลสมาชิก</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label>ชื่อจริง</label>
                  <input
                    type="text"
                    value={editingMember.firstName}
                    onChange={(e) => setEditingMember({ ...editingMember, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>นามสกุล</label>
                  <input
                    type="text"
                    value={editingMember.lastName}
                    onChange={(e) => setEditingMember({ ...editingMember, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>รหัสพนักงาน</label>
                  <input
                    type="text"
                    value={editingMember.employeeId}
                    onChange={(e) => setEditingMember({ ...editingMember, employeeId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>สำนัก</label>
                  <select
                    value={editingMember.institutionId || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, institutionId: e.target.value, departmentId: "" })}
                  >
                    <option value="">-- เลือกสำนัก --</option>
                    {institutions.map((i) => <option key={i.InstitutionID} value={i.InstitutionID}>{i.InstitutionName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>ฝ่าย</label>
                  <select
                    value={editingMember.departmentId || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, departmentId: e.target.value })}
                  >
                    <option value="">-- เลือกฝ่าย --</option>
                    {filteredDepartments.map((d) => <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn-primary">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
