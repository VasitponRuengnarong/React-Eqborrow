import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  User,
  Filter,
  CheckCircle,
  Shield,
  Mail,
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      } else {
        console.error("Failed to fetch members");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (member, newRole) => {
    const result = await Swal.fire({
      title: "เปลี่ยนสิทธิ์ผู้ใช้งาน?",
      text: `คุณต้องการเปลี่ยนสิทธิ์ของ ${member.firstName} เป็น ${newRole} ใช่หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ใช่, เปลี่ยนเลย",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#3085d6",
    });

    if (result.isConfirmed) {
      try {
        const response = await apiFetch(`/api/users/${member.id}/role`, {
          method: "PUT",
          body: JSON.stringify({ role: newRole }),
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
          <Filter
            size={20}
            className="filter-icon"
            style={{ color: "#6b7280" }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-select"
          >
            <option value="All">ทุกตำแหน่ง</option>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
            <option value="Approver">Approver</option>
          </select>
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
              filteredMembers.map((member) => (
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
                    <span className="status-active">
                      <CheckCircle size={14} /> Active
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <select
                        className="role-edit-select"
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member, e.target.value)
                        }
                        disabled={currentUser?.id === member.id}
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Approver">Approver</option>
                      </select>

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
    </div>
  );
};

export default MemberManagement;
