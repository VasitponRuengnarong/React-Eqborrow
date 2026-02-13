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
      // Limit file size to 2MB to prevent large Base64 strings causing issues
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire("ข้อผิดพลาด", "ขนาดไฟล์ต้องไม่เกิน 2MB", "error");
        return;
      }
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
      const response = await apiFetch(`/api/profile/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedUser = result.user; // Extract the user object from the response
        // อัปเดต LocalStorage
        const newUserState = { ...user, ...updatedUser };
        localStorage.setItem("user", JSON.stringify(newUserState));
        setUser(newUserState);

        // แจ้งเตือน Sidebar ให้อัปเดตข้อมูล
        window.dispatchEvent(new Event("user-updated"));

        Swal.fire("สำเร็จ", "อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว", "success");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "ไม่สามารถอัปเดตโปรไฟล์ได้");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("ข้อผิดพลาด", error.message, "เกิดการผิดพลาด");
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

      <div className="profile-layout">
        {/* Left Column: Identity & Read-only Info */}
        <div className="profile-sidebar">
          <div className="profile-card identity-card">
            <div className="profile-avatar-section">
              <div className="avatar-wrapper">
                <img
                  src={formData.profileImage || "/images/logo.png"}
                  alt="Profile"
                  className="profile-avatar"
                />
                <label htmlFor="profile-upload" className="avatar-upload-btn">
                  <Camera size={18} />
                </label>
                <input
                  type="file"
                  id="profile-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </div>
              <h3 className="user-fullname">
                {user.firstName} {user.lastName}
              </h3>
              <span className="user-role-badge">{user.role}</span>
            </div>

            <div className="identity-details">
              <div className="detail-item">
                <span className="detail-icon">
                  <Building size={16} />
                </span>
                <div className="detail-content">
                  <label>สังกัด</label>
                  <p>{user.InstitutionName || "-"}</p>
                  <p className="sub-text">{user.DepartmentName || "-"}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">
                  <MapPin size={16} />
                </span>
                <div className="detail-content">
                  <label>รหัสพนักงาน</label>
                  <p>{user.employeeId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Forms */}
        <div className="profile-main">
          <div className="profile-card settings-card">
            <div className="card-header">
              <h3>ข้อมูลส่วนตัว</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <User size={16} /> ชื่อจริง
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-input"
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
                    className="form-input"
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
                    className="form-input"
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
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner-sm"></div>
                  ) : (
                    <>
                      <Save size={18} /> บันทึกการเปลี่ยนแปลง
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="profile-card security-card">
            <div
              className={`card-header clickable ${showPasswordForm ? "active" : ""}`}
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              <h3>
                <Lock size={20} /> ความปลอดภัยและรหัสผ่าน
              </h3>
              {showPasswordForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {showPasswordForm && (
              <form onSubmit={handleUpdatePassword} className="password-form-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label>รหัสผ่านปัจจุบัน</label>
                    <div className="input-with-icon">
                      <Key size={16} className="input-icon" />
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>รหัสผ่านใหม่</label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>ยืนยันรหัสผ่านใหม่</label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-secondary"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="spinner-sm"></div>
                    ) : (
                      <>อัปเดตรหัสผ่าน</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
