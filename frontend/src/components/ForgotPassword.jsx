import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, CreditCard, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import "./ForgotPassword.css";
import Aurora from "./Aurora";
import { apiFetch } from "./api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!username) {
      newErrors.username = "กรุณากรอกชื่อผู้ใช้";
    }
    if (!employeeId) {
      newErrors.employeeId = "กรุณากรอกรหัสพนักงาน";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiFetch("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ username, employeeId }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = {
          message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ (500 Internal Server Error)",
        };
      }

      if (!response.ok) {
        throw new Error(data.message || "ข้อมูลไม่ถูกต้อง");
      }

      Swal.fire({
        icon: "success",
        title: "ตรวจสอบสำเร็จ",
        text: "ยืนยันตัวตนสำเร็จ กำลังนำคุณไปยังหน้าตั้งรหัสผ่านใหม่",
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: "#ff8000",
      }).then(() => {
        if (data.resetToken) {
          navigate(`/reset-password/${data.resetToken}`);
        } else {
          navigate("/login");
        }
      });
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      {/* Background Aurora Layer */}
      <div className="aurora-bg-layer">
        <Aurora
          colorStops={["#ff8000", "#ea580c", "#ff8000"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      <div className="forgot-password-container">
        {/* Left Side - Brand Section */}
        <div className="forgot-password-brand">
          <div className="brand-content">
            <div className="thai-pbs-logo">
              <img
                src="/images/logo.png"
                alt="Eqborrow Logo"
                style={{ height: "120px", width: "auto" }}
              />
            </div>
            <h1 className="brand-title">Eqborrow</h1>
            <div className="brand-badge">RECOVERY</div>
            <p className="brand-subtitle">Reset your access securely</p>
          </div>
          {/* Subtle decoration */}
          <div className="brand-decoration"></div>
        </div>

        {/* Right Side - Form Section */}
        <div className="forgot-password-form-section">
          <div className="forgot-password-header">
            <h2>ลืมรหัสผ่าน?</h2>
            <p>กรุณาระบุชื่อผู้ใช้และรหัสพนักงานเพื่อขอรีเซ็ตรหัสผ่าน</p>
          </div>

          <form onSubmit={handleSubmit} className="forgot-password-form" noValidate>
            <div className={`form-group ${errors.username ? "has-error" : ""}`}>
              <label htmlFor="username" className="input-label">
                ชื่อผู้ใช้งาน
              </label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  id="username"
                  placeholder="Username"
                  className="login-input"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: "" });
                  }}
                />
              </div>
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            <div className={`form-group ${errors.employeeId ? "has-error" : ""}`}>
              <label htmlFor="employeeId" className="input-label">
                รหัสพนักงาน
              </label>
              <div className="input-wrapper">
                <CreditCard className="input-icon" size={18} />
                <input
                  type="text"
                  id="employeeId"
                  placeholder="Employee ID"
                  className="login-input"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    if (errors.employeeId) setErrors({ ...errors, employeeId: "" });
                  }}
                />
              </div>
              {errors.employeeId && (
                <span className="error-message">{errors.employeeId}</span>
              )}
            </div>

            <button
              type="submit"
              className="forgot-password-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner"></span> กำลังตรวจสอบ...
                </span>
              ) : (
                "ส่งลิงก์รีเซ็ตรหัสผ่าน"
              )}
            </button>
          </form>

          <div className="forgot-password-footer">
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} /> กลับไปยังหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
