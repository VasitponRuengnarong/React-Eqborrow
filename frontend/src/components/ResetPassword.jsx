import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import "./Login.css"; // ใช้ CSS เดียวกับหน้า Login
import Swal from "sweetalert2"; // Import SweetAlert2
import Aurora from "./Aurora";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      Swal.fire("ข้อผิดพลาด!", "รหัสผ่านไม่ตรงกัน", "warning");
      return;
    }
    if (password.length < 6) {
      Swal.fire(
        "ข้อผิดพลาด!",
        "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
        "warning",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire("สำเร็จ!", data.message, "success");
        navigate("/login");
      } else {
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          data.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน",
          "error",
        );
      }
    } catch (err) {
      Swal.fire(
        "เกิดข้อผิดพลาด!",
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        <Aurora
          colorStops={["#ff8000", "#ff8000", "#ff8000"]}
          blend={0.5}
          amplitude={1.0}
          speed={1}
        />
      </div>
      <div
        className="login-container"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* Left Side - Brand */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="thai-pbs-logo">
              <img
                src="/logo.png"
                alt="Eqborrow Logo"
                style={{ height: "120px", width: "auto" }}
              />
            </div>
            <h1 className="brand-title">Eqborrow</h1>
            <p className="brand-subtitle">Reset Password</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="login-form-section">
          <div className="login-header">
            <h2>ตั้งรหัสผ่านใหม่</h2>
            <p>กรุณากรอกรหัสผ่านใหม่ของคุณ</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <div className="password-input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label htmlFor="newPassword">รหัสผ่านใหม่</label>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <div className="password-input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder=" "
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : "บันทึกรหัสผ่านใหม่"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
