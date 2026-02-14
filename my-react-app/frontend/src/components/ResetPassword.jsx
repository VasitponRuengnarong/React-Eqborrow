import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import "./ForgotPassword.css"; // ใช้ CSS เดียวกัน

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate("/login");
      } else {
        setError(data.message || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="fp-container">
        <div className="fp-header">
          <h2>ตั้งรหัสผ่านใหม่</h2>
          <p>กรุณากรอกรหัสผ่านใหม่ของคุณ</p>
        </div>
        <form onSubmit={handleSubmit} className="fp-form">
          {error && <div className="error-banner">{error}</div>}
          <div className="form-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="รหัสผ่านใหม่"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="ยืนยันรหัสผ่านใหม่"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="fp-btn" disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
