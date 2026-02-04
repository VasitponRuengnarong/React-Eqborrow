import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock } from "lucide-react";
import "./Login.css";
import Aurora from "./Aurora";
import Swal from "sweetalert2";
import { Eye, EyeOff } from "lucide-react";
const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [ripple, setRipple] = useState(null);
  const [errors, setErrors] = useState({});

  // ตรวจสอบว่ามี Token อยู่แล้วหรือไม่ (ถ้ามีให้ไปหน้า Dashboard เลย)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const triggerRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    setRipple({
      x: e.clientX - rect.left - radius,
      y: e.clientY - rect.top - radius,
      size: diameter,
    });

    setTimeout(() => setRipple(null), 600);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = "กรุณากรอกชื่อผู้ใช้";
    } else if (username.length < 4) {
      newErrors.username = "ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร";
    }

    if (!password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    } else if (password.length < 6) {
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (Server Error)");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "เข้าสู่ระบบไม่สำเร็จ");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.token || data.accessToken) {
        localStorage.setItem("accessToken", data.token || data.accessToken);
      }
      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      setLoading(false);
      Swal.fire("เกิดข้อผิดพลาด!", error.message, "error");
    }
  };

  return (
    <div className="login-page" style={{ position: "relative" }}>
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
                src="/images/logo.png"
                alt="Eqborrow Logo" // More specific alt text
                style={{ height: "200px", width: "auto" }} // Consistent height, auto width
              />
            </div>
            <h1 className="brand-title">Eqborrow</h1>
            <p className="brand-subtitle">Equipment Borrowing System</p>{" "}
            {/* Changed subtitle */}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
          {/* Title */}
          <div className="login-header">
            <h2>เข้าสู่ระบบ</h2>
            <p>ยินดีต้อนรับกลับเข้าสู่ระบบ Eqborrow</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Username Field */}
            <div className={`form-group ${errors.username ? "has-error" : ""}`}>
              <label htmlFor="username" className="input-label">
                ชื่อผู้ใช้
              </label>
              <div className="input-wrapper">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  id="username"
                  placeholder="กรอกชื่อผู้ใช้"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            {/* Password Field */}
            <div className={`form-group ${errors.password ? "has-error" : ""}`}>
              <label htmlFor="password" className="input-label">
                รหัสผ่าน
              </label>
              <div className="password-input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            {/* Remember Me */}
            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>จดจำข้อมูล</span>
              </label>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => navigate("/forgot-password")}
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
              onClick={triggerRipple}
            >
              {loading ? <div className="spinner"></div> : "เข้าสู่ระบบ"}
              {ripple && (
                <span
                  className="ripple"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: ripple.size,
                    height: ripple.size,
                  }}
                />
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="login-footer">
            <p>
              ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
