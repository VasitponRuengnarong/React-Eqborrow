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
} from "lucide-react";
import "./Register.css";

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
    roleId: "",
    empStatusId: "",
    profileImage: "", // Base64 string
    password: "",
    confirmPassword: "",
  });

  const [masterData, setMasterData] = useState({
    institutions: [],
    departments: [],
    roles: [],
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
        const [instRes, deptRes, roleRes, statusRes] = await Promise.all([
          fetch("/api/institutions"),
          fetch("/api/departments"),
          fetch("/api/roles"),
          fetch("/api/emp-statuses"),
        ]);

        // Check all responses
        if (!instRes.ok || !deptRes.ok || !roleRes.ok || !statusRes.ok) {
          throw new Error("Failed to fetch master data");
        }

        const institutions = await instRes.json();
        const departments = await deptRes.json();
        const roles = await roleRes.json();
        const empStatuses = await statusRes.json();

        setMasterData({ institutions, departments, roles, empStatuses });
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
    if (!formData.roleId) newErrors.roleId = "กรุณาเลือกตำแหน่ง";
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
          roleId: Number(formData.roleId),
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

      navigate("/login");
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-brand">
          <div className="brand-content">
            <div className="thai-pbs-logo">
              <img
                src="/logo.png"
                alt="Thai PBS Logo"
                style={{ height: "120px" }}
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
            {errors.submit && (
              <div className="error-banner">{errors.submit}</div>
            )}

            {/* Row 1: Name & Surname */}
            <div className="form-row">
              <div
                className={`form-group form-column ${errors.firstName ? "has-error" : ""}`}
              >
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  id="firstName"
                  placeholder=" "
                  value={formData.firstName}
                  onChange={handleChange}
                />
                <label htmlFor="firstName">ชื่อ</label>
                {errors.firstName && (
                  <span className="error-message">{errors.firstName}</span>
                )}
              </div>
              <div
                className={`form-group form-column ${errors.lastName ? "has-error" : ""}`}
              >
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  id="lastName"
                  placeholder=" "
                  value={formData.lastName}
                  onChange={handleChange}
                />
                <label htmlFor="lastName">นามสกุล</label>
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
                <FileText className="input-icon" size={20} />
                <input
                  type="text"
                  id="employeeId"
                  placeholder=" "
                  value={formData.employeeId}
                  onChange={handleChange}
                />
                <label htmlFor="employeeId">รหัสพนักงาน</label>
                {errors.employeeId && (
                  <span className="error-message">{errors.employeeId}</span>
                )}
              </div>
              <div
                className={`form-group form-column ${errors.username ? "has-error" : ""}`}
              >
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  id="username"
                  placeholder=" "
                  value={formData.username}
                  onChange={handleChange}
                />
                <label htmlFor="username">ชื่อผู้ใช้</label>
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
                <label htmlFor="institutionId" className="select-label">
                  สำนัก
                </label>
                {errors.institutionId && (
                  <span className="error-message">{errors.institutionId}</span>
                )}
              </div>
              <div
                className={`form-group form-column ${errors.departmentId ? "has-error" : ""}`}
              >
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
                <label htmlFor="departmentId" className="select-label">
                  ฝ่าย
                </label>
                {errors.departmentId && (
                  <span className="error-message">{errors.departmentId}</span>
                )}
              </div>
            </div>

            {/* Row 4: Role & Employee Status */}
            <div className="form-row">
              <div
                className={`form-group form-column ${errors.roleId ? "has-error" : ""}`}
              >
                <Briefcase className="input-icon" size={20} />
                <select
                  id="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  className="form-select"
                  disabled={dataLoading}
                >
                  <option value="">-- เลือกตำแหน่ง --</option>
                  {masterData.roles.map((role) => (
                    <option key={role.RoleID} value={role.RoleID}>
                      {role.RoleName}
                    </option>
                  ))}
                </select>
                <label htmlFor="roleId" className="select-label">
                  ตำแหน่ง (Role)
                </label>
                {errors.roleId && (
                  <span className="error-message">{errors.roleId}</span>
                )}
              </div>
              <div
                className={`form-group form-column ${errors.empStatusId ? "has-error" : ""}`}
              >
                <Briefcase className="input-icon" size={20} />
                <select
                  id="empStatusId"
                  value={formData.empStatusId}
                  onChange={handleChange}
                  className="form-select"
                  disabled={dataLoading}
                >
                  <option value="">-- เลือกสถานะ --</option>
                  {masterData.empStatuses.map((status) => (
                    <option key={status.EMPStatusID} value={status.EMPStatusID}>
                      {status.StatusName}
                    </option>
                  ))}
                </select>
                <label htmlFor="empStatusId" className="select-label">
                  สถานะพนักงาน
                </label>
                {errors.empStatusId && (
                  <span className="error-message">{errors.empStatusId}</span>
                )}
              </div>
            </div>

            {/* Row 5: Phone & Email */}
            <div className="form-row">
              <div
                className={`form-group form-column ${errors.phone ? "has-error" : ""}`}
              >
                <Phone className="input-icon" size={20} />
                <input
                  type="tel"
                  id="phone"
                  placeholder=" "
                  value={formData.phone}
                  onChange={handleChange}
                />
                <label htmlFor="phone">เบอร์โทรศัพท์</label>
                {errors.phone && (
                  <span className="error-message">{errors.phone}</span>
                )}
              </div>
              <div
                className={`form-group form-column ${errors.email ? "has-error" : ""}`}
              >
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  id="email"
                  placeholder=" "
                  value={formData.email}
                  onChange={handleChange}
                />
                <label htmlFor="email">อีเมล</label>
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
              <div className="password-input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder=" "
                  value={formData.password}
                  onChange={handleChange}
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

            <div
              className={`form-group ${errors.confirmPassword ? "has-error" : ""}`}
            >
              <div className="password-input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder=" "
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
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
