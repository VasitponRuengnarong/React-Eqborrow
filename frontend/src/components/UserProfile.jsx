import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Save, Camera } from "lucide-react";
import "./UserProfile.css";
import Swal from "sweetalert2";
import "./Management.css"; // Import Management.css for consistent button styles
import { apiFetch } from "./api";
import ImageDisplay from "./ImageDisplay";

const defaultProfileImage = "https://via.placeholder.com/100"; // Placeholder for profile image

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImage: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFormData({
        firstName: parsedUser.firstName || "",
        lastName: parsedUser.lastName || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || "",
        profileImage: parsedUser.profileImage || "",
      });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiFetch(`/api/profile/${user.EMPID}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire("สำเร็จ!", "อัปเดตข้อมูลส่วนตัวสำเร็จ", "success");
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        // Notify other components (like Sidebar/Header) to update the user info without a full reload
        window.dispatchEvent(new Event("user-updated"));
      } else {
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          data.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
          "error",
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Swal.fire(
        "เกิดข้อผิดพลาด!",
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire("ข้อผิดพลาด!", "รหัสผ่านใหม่ไม่ตรงกัน", "warning");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      Swal.fire(
        "ข้อผิดพลาด!",
        "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
        "warning",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`/api/profile/${user.EMPID}/password`, {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire("สำเร็จ!", "เปลี่ยนรหัสผ่านสำเร็จ", "success");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          data.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
          "error",
        );
      }
    } catch (error) {
      console.error("Error changing password:", error);
      Swal.fire(
        "เกิดข้อผิดพลาด!",
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="user-profile-container">
      <div className="page-header">
        <h2>โปรไฟล์ของฉัน</h2>
        <p>จัดการข้อมูลส่วนตัวและรหัสผ่าน</p>
      </div>

      <div className="profile-content">
        {/* ส่วนแก้ไขข้อมูลส่วนตัว */}
        <div className="profile-card">
          <h3>
            <User size={20} /> ข้อมูลส่วนตัว
          </h3>
          <form onSubmit={handleProfileSubmit}>
            <div className="profile-image-section">
              <div className="profile-avatar">
                <ImageDisplay
                  data={formData.profileImage || defaultProfileImage}
                  alt="Profile"
                />
                <label
                  htmlFor="profile-upload"
                  className="camera-icon"
                  aria-label="เปลี่ยนรูปโปรไฟล์"
                >
                  <Camera size={16} />
                </label>
                <input
                  type="file"
                  id="profile-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName">ชื่อจริง</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">นามสกุล</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={16} /> อีเมล
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">
                  <Phone size={16} /> เบอร์โทรศัพท์
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <Save size={18} /> บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </form>
        </div>

        {/* ส่วนเปลี่ยนรหัสผ่าน */}
        <div className="profile-card">
          <h3>
            <Lock size={20} /> เปลี่ยนรหัสผ่าน
          </h3>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</label>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">รหัสผ่านใหม่</label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={loading}
              >
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
