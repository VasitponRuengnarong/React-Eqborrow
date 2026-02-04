import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import "./ForgotPassword.css";
import Aurora from "./Aurora";
import { apiFetch } from "./api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // เรียก API สำหรับส่งอีเมลรีเซ็ตรหัสผ่าน
      const response = await apiFetch("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
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
        throw new Error(data.message || "ไม่พบอีเมลนี้ในระบบ");
      }

      Swal.fire({
        icon: "success",
        title: "ส่งลิงก์เรียบร้อย",
        text: "กรุณาตรวจสอบอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน",
        confirmButtonColor: "#ff8000",
      }).then(() => {
        navigate("/login");
      });
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
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
        className="forgot-password-container"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* Left Side - Brand */}
        <div className="forgot-password-brand">
          <div className="brand-content">
            <div className="thai-pbs-logo">
              <img
                src="/images/logo.png"
                alt="Eqborrow Logo" // More specific alt text
                style={{ height: "120px", width: "auto" }}
              />
            </div>
            <h1 className="brand-title">Eqborrow</h1>
            <p className="brand-subtitle">Password Recovery</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="forgot-password-form-section">
          <div className="forgot-password-header">
            <h2>ลืมรหัสผ่าน?</h2>
            <p>กรอกอีเมลที่ใช้สมัครสมาชิกเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="forgot-password-form"
            noValidate
          >
            <div className={`form-group ${errors.email ? "has-error" : ""}`}>
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                id="email"
                placeholder=" "
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
              />
              <label htmlFor="email" className="input-label">
                อีเมล
              </label>
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <button
              type="submit"
              className="forgot-password-btn"
              disabled={loading}
            >
              {loading ? <div className="spinner"></div> : "ส่งลิงก์รีเซ็ต"}
            </button>
          </form>

          <div className="forgot-password-footer">
            <p>
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={16} /> กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
