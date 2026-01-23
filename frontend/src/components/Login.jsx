import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock } from "lucide-react";
import "./Login.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [ripple, setRipple] = useState(null);
  const [errors, setErrors] = useState({});

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
      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      setLoading(false);
      setErrors((prev) => ({ ...prev, submit: error.message }));
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Brand */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="thai-pbs-logo">
              <img
                src="/logo.png"
                alt="Thai PBS Logo"
                style={{ height: "150px" }}
              />
            </div>
            <h1 className="brand-title">Eqborrow</h1>
            <p className="brand-subtitle">E-PAYMENT SYSTEM </p>
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
            {errors.submit && (
              <div className="error-banner">{errors.submit}</div>
            )}
            {/* Username Field */}
            <div className={`form-group ${errors.username ? "has-error" : ""}`}>
              <User className="input-icon" size={20} />
              <input
                type="text"
                id="username"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label htmlFor="username">ชื่อผู้ใช้</label>
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            {/* Password Field */}
            <div className={`form-group ${errors.password ? "has-error" : ""}`}>
              <div className="password-input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="password">รหัสผ่าน</label>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
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
