import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import "./ResetPassword.css";
import Swal from "sweetalert2";
import Aurora from "./Aurora";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="reset-password-page">
      {/* Background Aurora Layer */}
      <div className="aurora-bg-layer">
        <Aurora
          colorStops={["#ff8000", "#ea580c", "#ff8000"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      <div className="reset-password-container">
        {/* Left Side - Brand Section */}
        <div className="reset-password-brand">
          <div className="brand-content">
            <div className="thai-pbs-logo">
              <img
                src="/images/logo.png"
                alt="Eqborrow Logo"
                style={{ height: "120px", width: "auto" }}
              />
            </div>
            <h1 className="brand-title">Eqborrow</h1>
            <div className="brand-badge">NEW PASSWORD</div>
            <p className="brand-subtitle">Set your new access code</p>
          </div>
          <div className="brand-decoration"></div>
        </div>

        {/* Right Side - Form Section */}
        <div className="reset-password-form-section">
          <div className="reset-password-header">
            <h2>ตั้งรหัสผ่านใหม่</h2>
            <p>กรุณากำหนดรหัสผ่านใหม่ที่จำง่ายและปลอดภัย</p>
          </div>

          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label className="input-label">รหัสผ่านใหม่</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">ยืนยันรหัสผ่านใหม่</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className="login-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="reset-password-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span> กำลังบันทึก...
                </span>
              ) : (
                "บันทึกรหัสผ่านใหม่"
              )}
            </button>
          </form>

          <div className="reset-password-footer">
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} /> กลับไปยังหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
