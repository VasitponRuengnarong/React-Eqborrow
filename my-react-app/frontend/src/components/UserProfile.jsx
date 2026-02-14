import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Save, Camera } from "lucide-react";
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
      const response = await fetch(`/api/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        alert("อัปเดตข้อมูลส่วนตัวสำเร็จ");
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        window.location.reload(); // รีโหลดเพื่อให้ Sidebar อัปเดตรูปภาพ
      } else {
        alert(data.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/profile/${user.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("เปลี่ยนรหัสผ่านสำเร็จ");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        alert(data.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
                <img
                  src={
                    formData.profileImage || "https://via.placeholder.com/100"
                  }
                  alt="Profile"
                />
                <label htmlFor="profile-upload" className="camera-icon">
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
                <label>ชื่อ</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>นามสกุล</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
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
                  onChange={handleInputChange}
                  required
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
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={loading}>
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
              <label>รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label>รหัสผ่านใหม่</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <input
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
                className="btn-save outline"
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
