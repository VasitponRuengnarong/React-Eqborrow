import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  FileText,
  Building,
  Users,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import Swal from "sweetalert2";
import "./Register.css";
import Aurora from "./Aurora";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    employeeId: "",
    username: "",
    email: "",
    phone: "",
    institutionId: "",
    departmentId: "",
    empStatusId: "",
    profileImage: "", // Base64 string
    password: "",
    confirmPassword: "",
  });

  const [masterData, setMasterData] = useState({
    institutions: [],
    departments: [],
    empStatuses: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchMasterData = async () => {
      setDataLoading(true);
      try {
        const [instRes, deptRes, statusRes] = await Promise.all([
          fetch("/api/institutions"),
          fetch("/api/departments"),
          fetch("/api/emp-statuses"),
        ]);

        // Check all responses
        if (!instRes.ok || !deptRes.ok || !statusRes.ok) {
          throw new Error("Failed to fetch master data");
        }

        const institutions = await instRes.json();
        const departments = await deptRes.json();
        const empStatuses = await statusRes.json();

        setMasterData({ institutions, departments, empStatuses });
      } catch (error) {
        console.error("Error fetching master data:", error);
        setErrors((prev) => ({
          ...prev,
          submit: "ไม่สามารถโหลดข้อมูลพื้นฐานได้",
        }));
      } finally {
        setDataLoading(false);
      }
    };

    fetchMasterData();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "กรุณากรอกชื่อ";
    if (!formData.lastName.trim()) newErrors.lastName = "กรุณากรอกนามสกุล";
    if (!formData.employeeId.trim())
      newErrors.employeeId = "กรุณากรอกรหัสพนักงาน";
    if (!formData.username.trim()) newErrors.username = "กรุณากรอกชื่อผู้ใช้";
    if (!formData.institutionId) newErrors.institutionId = "กรุณาเลือกสำนัก";
    if (!formData.departmentId) newErrors.departmentId = "กรุณาเลือกฝ่าย";
    // empStatusId can be optional if backend defaults it, but let's require it for completeness
    if (!formData.empStatusId) newErrors.empStatusId = "กรุณาเลือกสถานะ";

    if (!formData.email.trim()) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    } else if (!/^\d{9,10}$/.test(formData.phone.replace(/-/g, ""))) {
      newErrors.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง";
    }

    if (!formData.password) newErrors.password = "กรุณากรอกรหัสผ่าน";
    else if (formData.password.length < 6)
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          // Ensure IDs are sent as numbers
          institutionId: Number(formData.institutionId),
          departmentId: Number(formData.departmentId),
          empStatusId: Number(formData.empStatusId),
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (Server Error)");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      Swal.fire("สำเร็จ!", "สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ", "success");
      navigate("/login");
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด!", error.message, "error"); // Consistent error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="register-page"
      style={{ position: "relative" }} // ลบ overflow: hidden เพื่อให้ Scroll ได้
    >
      <div
        style={{
          position: "fixed", // เปลี่ยนเป็น fixed เพื่อให้พื้นหลังอยู่กับที่ตอน Scroll
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
        className="register-container"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="register-brand">
          <div className="brand-content">
            <div className="thai-pbs-logo">
              <img
                src="/images/logo.png" // Use absolute path for assets in public folder
                alt="Eqborrow Logo" // More specific alt text
                style={{ height: "120px", width: "auto" }} // Consistent height, auto width
              />
            </div>
            <h1 className="brand-title">Eqborrow</h1>
            <p className="brand-subtitle">Create New Account</p>
          </div>
        </div>

        <div className="register-form-section">
          <div className="register-header">
            <h2>สมัครสมาชิก</h2>
            <p>กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form" noValidate>
            {/* Row 1: Name & Surname */}
            <div className="form-row">
              <div
                className={`form-group form-column ${errors.firstName ? "has-error" : ""}`}
              >
                <label htmlFor="firstName" className="input-label">
                  ชื่อจริง
                </label>
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  id="firstName"
                  placeholder="กรอกชื่อจริง"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <span className="error-message">{errors.firstName}</span>
                )}
              </div>
              <div
                className={`form-group form-column ${errors.lastName ? "has-error" : ""}`}
              >
                <label htmlFor="lastName" className="input-label">
                  นามสกุล
                </label>
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  id="lastName"
                  placeholder="กรอกนามสกุล"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && (
                  <span className="error-message">{errors.lastName}</span>
                )}
              </div>
            </div>

            {/* Row 2: Employee ID & Username */}
            <div className="form-row">
              <div
                className={`form-group form-column ${errors.employeeId ? "has-error" : ""}`}
              >
                <label htmlFor="employeeId" className="input-label">
                  รหัสพนักงาน
                </label>
                <FileText className="input-icon" size={20} />
                <input
                  type="text"
                  id="employeeId"
                  placeholder="กรอกรหัสพนักงาน"
                  value={formData.employeeId}
                  onChange={handleChange}
                />
                {errors.employeeId && (
                  <span className="error-message">{errors.employeeId}</span>
                )}
              </div>
              <div
                className={`form-group form-column ${errors.username ? "has-error" : ""}`}
              >
                <label htmlFor="username" className="input-label">
                  ชื่อผู้ใช้
                </label>
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  id="username"
                  placeholder="กรอกชื่อผู้ใช้"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <span className="error-message">{errors.username}</span>
                )}
              </div>
            </div>

            {/* Row 3: Institution & Department */}
            <div className="form-row">
              <div
                className={`form-group form-column ${errors.institutionId ? "has-error" : ""}`}
              >
                <label htmlFor="institutionId" className="input-label">
                  สำนัก
                </label>
                <Building className="input-icon" size={20} />
                <select
                  id="institutionId"
                  value={formData.institutionId}
                  onChange={handleChange}
                  className="form-select"
                  disabled={dataLoading}
                >
                  <option value="">-- เลือกสำนัก --</option>
                  {masterData.institutions.map((inst) => (
                    <option key={inst.InstitutionID} value={inst.InstitutionID}>
                      {inst.InstitutionName}
                    </option>
                  ))}
                </select>
                {errors.institutionId && (
                  <span className="error-message">{errors.institutionId}</span>
                )}
              </div>
              <div
                className={`form-group form-column ${errors.departmentId ? "has-error" : ""}`}
              >
                <label htmlFor="departmentId" className="input-label">
                  ฝ่าย
                </label>
                <Users className="input-icon" size={20} />
                <select
                  id="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="form-select"
                  disabled={dataLoading}
                >
                  <option value="">-- เลือกฝ่าย --</option>
                  {masterData.departments.map((dept) => (
                    <option key={dept.DepartmentID} value={dept.DepartmentID}>
                      {dept.DepartmentName}
                    </option>
                  ))}
                </select>
                {errors.departmentId && (
                  <span className="error-message">{errors.departmentId}</span>
                )}
              </div>
            </div>

            {/* Row 5: Phone & Email */}
            <div className="form-row">
              <div
                className={`form-group form-column ${errors.phone ? "has-error" : ""}`}
              >
                <label htmlFor="phone" className="input-label">
                  เบอร์โทรศัพท์
                </label>
                <Phone className="input-icon" size={20} />
                <input
                  type="tel"
                  id="phone"
                  placeholder="กรอกเบอร์โทรศัพท์"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && (
                  <span className="error-message">{errors.phone}</span>
                )}
              </div>
              <div
                className={`form-group form-column ${errors.email ? "has-error" : ""}`}
              >
                <label htmlFor="email" className="input-label">
                  อีเมล
                </label>
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  id="email"
                  placeholder="กรอกอีเมล"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>
            </div>

            {/* Profile Image */}
            <div className="form-group file-input-group">
              <label htmlFor="profileImage" className="file-label">
                <ImageIcon size={20} />
                <span>
                  {formData.profileImage
                    ? "เปลี่ยนรูปโปรไฟล์"
                    : "อัปโหลดรูปโปรไฟล์"}
                </span>
              </label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-input"
              />
              {formData.profileImage && (
                <div className="image-preview">
                  <img src={formData.profileImage} alt="Profile Preview" />
                </div>
              )}
            </div>

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
                  value={formData.password}
                  onChange={handleChange}
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

            <div
              className={`form-group ${errors.confirmPassword ? "has-error" : ""}`}
            >
              <label htmlFor="confirmPassword" className="input-label">
                ยืนยันรหัสผ่าน
              </label>
              <div className="password-input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="ยืนยันรหัสผ่าน"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : "สมัครสมาชิก"}
            </button>
          </form>
          <div className="register-footer">
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
