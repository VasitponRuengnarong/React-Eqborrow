import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Camera,
  Save,
  MapPin,
  Lock,
  Key,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Swal from "sweetalert2";
import { apiFetch } from "./api";
import "./UserProfile.css";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImage: "",
  });
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      setFormData({
        firstName: storedUser.firstName || "",
        lastName: storedUser.lastName || "",
        email: storedUser.email || "",
        phone: storedUser.phone || "",
        profileImage: storedUser.profileImage || "",
      });
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // จำลองการส่งข้อมูล (ปรับ Endpoint ตาม Backend จริง)
      const response = await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // อัปเดต LocalStorage
        const newUserState = { ...user, ...updatedUser };
        localStorage.setItem("user", JSON.stringify(newUserState));
        setUser(newUserState);

        // แจ้งเตือน Sidebar ให้อัปเดตข้อมูล
        window.dispatchEvent(new Event("user-updated"));

        Swal.fire("สำเร็จ", "อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว", "success");
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน", "warning");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire("ข้อผิดพลาด", "รหัสผ่านใหม่ไม่ตรงกัน", "error");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      Swal.fire("ข้อผิดพลาด", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`/api/users/${user.id}/change-password`, {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        Swal.fire("สำเร็จ", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "success");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordForm(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      }
    } catch (error) {
      Swal.fire("ข้อผิดพลาด", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="profile-container">
      <div className="page-header">
        <h2>โปรไฟล์ของฉัน</h2>
        <p>จัดการข้อมูลส่วนตัวและบัญชีผู้ใช้</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <form onSubmit={handleSubmit}>
            <div className="profile-header-section">
              <div className="profile-avatar-large-wrapper">
                <img
                  src={formData.profileImage || "/images/logo.png"}
                  alt="Profile"
                  className="profile-avatar-large"
                />
                <label htmlFor="profile-upload" className="camera-btn-large">
                  <Camera size={20} />
                </label>
                <input
                  type="file"
                  id="profile-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </div>
              <div className="profile-title-info">
                <h3>
                  {user.firstName} {user.lastName}
                </h3>
                <span className="role-badge">{user.role}</span>
              </div>
            </div>

            <div className="form-grid-profile">
              <div className="form-group">
                <label>
                  <User size={16} /> ชื่อจริง
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>
                  <User size={16} /> นามสกุล
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>
                  <Mail size={16} /> อีเมล
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>
                  <Phone size={16} /> เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group disabled">
                <label>
                  <Building size={16} /> สังกัด (แก้ไขไม่ได้)
                </label>
                <input
                  type="text"
                  value={`${user.InstitutionName || "-"} / ${user.DepartmentName || "-"}`}
                  disabled
                />
              </div>
              <div className="form-group disabled">
                <label>
                  <MapPin size={16} /> รหัสพนักงาน (แก้ไขไม่ได้)
                </label>
                <input type="text" value={user.employeeId} disabled />
              </div>
            </div>

            <div className="form-actions-profile">
              <button
                type="submit"
                className="btn-save-profile"
                disabled={loading}
              >
                <Save size={18} />
                {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="profile-card password-section">
          <div
            className="password-header"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            <h3>
              <Lock size={20} /> เปลี่ยนรหัสผ่าน
            </h3>
            {showPasswordForm ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handleUpdatePassword} className="password-form">
              <div className="form-grid-profile">
                <div className="form-group">
                  <label>
                    <Key size={16} /> รหัสผ่านปัจจุบัน
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="ระบุรหัสผ่านเดิม"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Lock size={16} /> รหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Lock size={16} /> ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  />
                </div>
              </div>
              <div className="form-actions-profile">
                <button
                  type="submit"
                  className="btn-save-profile btn-password"
                  disabled={loading}
                >
                  <Save size={18} />
                  {loading ? "กำลังบันทึก..." : "อัปเดตรหัสผ่าน"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
