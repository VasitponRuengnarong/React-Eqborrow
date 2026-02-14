import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";
import { API_BASE_URL } from "../config";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    employeeId: "",
    username: "",
    email: "",
    phone: "",
    role: "user", // Default role
    institutionId: "",
    departmentId: "",
    password: "",
    confirmPassword: "",
  });

  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ดึงข้อมูล Master Data สำหรับ Dropdown
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [instRes, deptRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/institutions`),
          fetch(`${API_BASE_URL}/api/departments`),
        ]);

        if (instRes.ok) setInstitutions(await instRes.json());
        if (deptRes.ok) setDepartments(await deptRes.json());
      } catch (err) {
        console.error("Error fetching master data:", err);
      }
    };

    fetchMasterData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!formData.institutionId || !formData.departmentId) {
      setError("กรุณาเลือกสำนักและฝ่าย");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
        navigate("/login");
      } else {
        setError(data.message || "การสมัครสมาชิกไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Register Error:", err);
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container" style={{ maxWidth: "600px" }}>
        <div className="login-form-section" style={{ width: "100%" }}>
          <div className="login-header">
            <h2>สมัครสมาชิก</h2>
            <p>กรอกข้อมูลเพื่อลงทะเบียนเข้าใช้งานระบบ</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-banner">{error}</div>}

            <div style={{ display: "flex", gap: "10px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>ชื่อจริง</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>นามสกุล</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>รหัสพนักงาน</label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>ชื่อผู้ใช้ (Username)</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>อีเมล</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>เบอร์โทรศัพท์</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {/* Dropdown เลือกสำนัก */}
            <div className="form-group">
              <label>สำนัก</label>
              <select
                name="institutionId"
                value={formData.institutionId}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              >
                <option value="">-- เลือกสำนัก --</option>
                {institutions.map((item) => (
                  <option key={item.InstitutionID} value={item.InstitutionID}>
                    {item.InstitutionName}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown เลือกฝ่าย */}
            <div className="form-group">
              <label>ฝ่าย</label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              >
                <option value="">-- เลือกฝ่าย --</option>
                {departments.map((item) => (
                  <option key={item.DepartmentID} value={item.DepartmentID}>
                    {item.DepartmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>รหัสผ่าน</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
