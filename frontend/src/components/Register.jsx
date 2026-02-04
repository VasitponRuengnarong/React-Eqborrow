import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  FileText,
  Building,
  Users,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Camera,
  ChevronDown,
  Check,
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
    profileImage: "", // Base64 string
    password: "",
    confirmPassword: "",
  });

  const [masterData, setMasterData] = useState({
    institutions: [],
    departments: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'institution' | 'department' | null
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const fetchMasterData = async () => {
      setDataLoading(true);
      try {
        const [instRes, deptRes] = await Promise.all([
          fetch("/api/institutions"),
          fetch("/api/departments"),
        ]);

        // Check all responses
        if (!instRes.ok || !deptRes.ok) {
          throw new Error("Failed to fetch master data");
        }

        const institutions = await instRes.json();
        const departments = await deptRes.json();

        setMasterData({ institutions, departments });
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest(".input-wrapper")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

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

  // Helper to get name for display
  const getInstitutionName = (id) => {
    const inst = masterData.institutions.find(
      (i) => i.InstitutionID === Number(id),
    );
    return inst ? inst.InstitutionName : "";
  };

  const getDepartmentName = (id) => {
    const dept = masterData.departments.find(
      (d) => d.DepartmentID === Number(id),
    );
    return dept ? dept.DepartmentName : "";
  };

  const handleSelect = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "institutionId") {
        newData.departmentId = ""; // Reset department when institution changes
      }
      if (field === "departmentId") {
        const selectedDept = masterData.departments.find(
          (d) => d.DepartmentID === Number(value),
        );
        if (selectedDept) {
          newData.institutionId = selectedDept.InstitutionID;
        }
      }
      return newData;
    });
    setActiveDropdown(null);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "กรุณากรอกชื่อ";
      if (!formData.lastName.trim()) newErrors.lastName = "กรุณากรอกนามสกุล";
      if (!formData.employeeId.trim())
        newErrors.employeeId = "กรุณากรอกรหัสพนักงาน";
      if (!formData.phone.trim()) {
        newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
      } else if (!/^\d{9,10}$/.test(formData.phone.replace(/-/g, ""))) {
        newErrors.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง";
      }
    }

    if (step === 2) {
      if (!formData.institutionId) newErrors.institutionId = "กรุณาเลือกสำนัก";
      if (!formData.departmentId) newErrors.departmentId = "กรุณาเลือกฝ่าย";
    }

    if (step === 3) {
      if (!formData.username.trim()) newErrors.username = "กรุณากรอกชื่อผู้ใช้";
      if (!formData.email.trim()) {
        newErrors.email = "กรุณากรอกอีเมล";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
      }
    }

    if (step === 4) {
      if (!formData.password) newErrors.password = "กรุณากรอกรหัสผ่าน";
      else if (formData.password.length < 6)
        newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

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

  // Filter departments based on selected institution
  const filteredDepartments = formData.institutionId
    ? masterData.departments.filter(
        (dept) => dept.InstitutionID === Number(formData.institutionId),
      )
    : masterData.departments;

  const steps = [
    { id: 1, title: "ข้อมูลส่วนตัว" },
    { id: 2, title: "สังกัด" },
    { id: 3, title: "บัญชีผู้ใช้" },
    { id: 4, title: "รหัสผ่านความปลอดภัย" },
  ];

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

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
                src="/images/logo.png"
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

          {/* Stepper UI */}
          <div className="stepper-wrapper">
            <div className="stepper-track">
              <div
                className="stepper-progress"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`step-item ${currentStep === step.id ? "active" : ""} ${currentStep > step.id ? "completed" : ""}`}
              >
                <div className="step-counter">
                  {currentStep > step.id ? <Check size={16} /> : step.id}
                </div>
                <div className="step-name">{step.title}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="register-form" noValidate>
            {/* Step 1: Personal Info & Profile Image */}
            {currentStep === 1 && (
              <div className="form-step-content">
                <div className="form-section profile-section">
                  <div className="profile-image-container">
                    <div className="profile-avatar-wrapper">
                      {formData.profileImage ? (
                        <img
                          src={formData.profileImage}
                          alt="Profile"
                          className="profile-avatar-img"
                        />
                      ) : (
                        <div className="profile-avatar-placeholder">
                          <User size={40} />
                        </div>
                      )}
                      <label htmlFor="profileImage" className="camera-btn">
                        <Camera size={16} />
                      </label>
                    </div>
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden-input"
                    />
                  </div>
                  <p className="section-hint">อัปโหลดรูปโปรไฟล์</p>
                </div>

                <div className="form-section">
                  <h3 className="section-title">ข้อมูลส่วนตัว</h3>
                  <div className="form-row">
                    <div
                      className={`form-group form-column ${errors.firstName ? "has-error" : ""}`}
                    >
                      <label htmlFor="firstName" className="input-label">
                        ชื่อจริง
                      </label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={20} />
                        <input
                          type="text"
                          id="firstName"
                          placeholder="กรอกชื่อจริง"
                          value={formData.firstName}
                          onChange={handleChange}
                        />
                      </div>
                      {errors.firstName && (
                        <span className="error-message">
                          {errors.firstName}
                        </span>
                      )}
                    </div>
                    <div
                      className={`form-group form-column ${errors.lastName ? "has-error" : ""}`}
                    >
                      <label htmlFor="lastName" className="input-label">
                        นามสกุล
                      </label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={20} />
                        <input
                          type="text"
                          id="lastName"
                          placeholder="กรอกนามสกุล"
                          value={formData.lastName}
                          onChange={handleChange}
                        />
                      </div>
                      {errors.lastName && (
                        <span className="error-message">{errors.lastName}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div
                      className={`form-group form-column ${errors.employeeId ? "has-error" : ""}`}
                    >
                      <label htmlFor="employeeId" className="input-label">
                        รหัสพนักงาน
                      </label>
                      <div className="input-wrapper">
                        <FileText className="input-icon" size={20} />
                        <input
                          type="text"
                          id="employeeId"
                          placeholder="กรอกรหัสพนักงาน"
                          value={formData.employeeId}
                          onChange={handleChange}
                        />
                      </div>
                      {errors.employeeId && (
                        <span className="error-message">
                          {errors.employeeId}
                        </span>
                      )}
                    </div>
                    <div
                      className={`form-group form-column ${errors.phone ? "has-error" : ""}`}
                    >
                      <label htmlFor="phone" className="input-label">
                        เบอร์โทรศัพท์
                      </label>
                      <div className="input-wrapper">
                        <Phone className="input-icon" size={20} />
                        <input
                          type="tel"
                          id="phone"
                          placeholder="กรอกเบอร์โทรศัพท์"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      {errors.phone && (
                        <span className="error-message">{errors.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Organization */}
            {currentStep === 2 && (
              <div className="form-section">
                <h3 className="section-title">สังกัด</h3>
                <div className="form-row">
                  <div
                    className={`form-group form-column ${errors.institutionId ? "has-error" : ""}`}
                  >
                    <label htmlFor="institutionId" className="input-label">
                      สำนัก
                    </label>
                    <div className="input-wrapper">
                      <Building className="input-icon" size={20} />
                      <div
                        className={`form-select custom-select-trigger ${activeDropdown === "institution" ? "active" : ""}`}
                        onClick={() =>
                          !dataLoading &&
                          setActiveDropdown(
                            activeDropdown === "institution"
                              ? null
                              : "institution",
                          )
                        }
                      >
                        <span
                          className={
                            !formData.institutionId ? "placeholder-text" : ""
                          }
                        >
                          {getInstitutionName(formData.institutionId) ||
                            "-- เลือกสำนัก --"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`dropdown-arrow ${activeDropdown === "institution" ? "rotate" : ""}`}
                        />
                      </div>

                      {activeDropdown === "institution" && (
                        <div className="chip-popup">
                          {masterData.institutions.map((inst) => (
                            <div
                              key={inst.InstitutionID}
                              className={`chip-option ${Number(formData.institutionId) === inst.InstitutionID ? "active" : ""}`}
                              onClick={() =>
                                handleSelect(
                                  "institutionId",
                                  inst.InstitutionID,
                                )
                              }
                            >
                              {inst.InstitutionName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.institutionId && (
                      <span className="error-message">
                        {errors.institutionId}
                      </span>
                    )}
                  </div>
                  <div
                    className={`form-group form-column ${errors.departmentId ? "has-error" : ""}`}
                  >
                    <label htmlFor="departmentId" className="input-label">
                      ฝ่าย
                    </label>
                    <div className="input-wrapper">
                      <Users className="input-icon" size={20} />
                      <div
                        className={`form-select custom-select-trigger ${activeDropdown === "department" ? "active" : ""}`}
                        onClick={() =>
                          !dataLoading &&
                          setActiveDropdown(
                            activeDropdown === "department"
                              ? null
                              : "department",
                          )
                        }
                      >
                        <span
                          className={
                            !formData.departmentId ? "placeholder-text" : ""
                          }
                        >
                          {getDepartmentName(formData.departmentId) ||
                            "-- เลือกฝ่าย --"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`dropdown-arrow ${activeDropdown === "department" ? "rotate" : ""}`}
                        />
                      </div>

                      {activeDropdown === "department" && (
                        <div className="chip-popup">
                          {filteredDepartments.length > 0 ? (
                            filteredDepartments.map((dept) => (
                              <div
                                key={dept.DepartmentID}
                                className={`chip-option ${Number(formData.departmentId) === dept.DepartmentID ? "active" : ""}`}
                                onClick={() =>
                                  handleSelect(
                                    "departmentId",
                                    dept.DepartmentID,
                                  )
                                }
                              >
                                {dept.DepartmentName}
                              </div>
                            ))
                          ) : (
                            <div className="no-options">
                              ไม่มีฝ่ายในสังกัดนี้
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.departmentId && (
                      <span className="error-message">
                        {errors.departmentId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Account */}
            {currentStep === 3 && (
              <div className="form-section">
                <h3 className="section-title">บัญชีผู้ใช้</h3>
                <div className="form-row">
                  <div
                    className={`form-group form-column ${errors.username ? "has-error" : ""}`}
                  >
                    <label htmlFor="username" className="input-label">
                      ชื่อผู้ใช้
                    </label>
                    <div className="input-wrapper">
                      <User className="input-icon" size={20} />
                      <input
                        type="text"
                        id="username"
                        placeholder="กรอกชื่อผู้ใช้"
                        value={formData.username}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.username && (
                      <span className="error-message">{errors.username}</span>
                    )}
                  </div>
                  <div
                    className={`form-group form-column ${errors.email ? "has-error" : ""}`}
                  >
                    <label htmlFor="email" className="input-label">
                      อีเมล
                    </label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={20} />
                      <input
                        type="email"
                        id="email"
                        placeholder="กรอกอีเมล"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.email && (
                      <span className="error-message">{errors.email}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Security */}
            {currentStep === 4 && (
              <div className="form-section">
                <h3 className="section-title">ความปลอดภัย</h3>
                <div className="form-row">
                  <div
                    className={`form-group form-column ${errors.password ? "has-error" : ""}`}
                  >
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
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="error-message">{errors.password}</span>
                    )}
                  </div>

                  <div
                    className={`form-group form-column ${errors.confirmPassword ? "has-error" : ""}`}
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
                      <span className="error-message">
                        {errors.confirmPassword}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn-back"
                  onClick={handleBack}
                  disabled={loading}
                >
                  ย้อนกลับ
                </button>
              )}
              {currentStep < 4 ? (
                <button type="button" className="btn-next" onClick={handleNext}>
                  ถัดไป
                </button>
              ) : (
                <button
                  type="submit"
                  className="register-btn"
                  disabled={loading}
                >
                  {loading ? <div className="spinner"></div> : "สมัครสมาชิก"}
                </button>
              )}
            </div>
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
