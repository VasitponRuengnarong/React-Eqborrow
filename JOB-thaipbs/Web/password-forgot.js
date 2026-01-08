const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const isPassword = password.type === "password";
  password.type = isPassword ? "text" : "password";
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});

const emailInput = document.getElementById("email");
const emailError = document.getElementById("emailError");

emailInput.addEventListener("input", function () {
  if (emailInput.classList.contains("error")) {
    emailInput.classList.remove("error");
    emailError.style.display = "none";
  }
});

const passwordResetForm = document.getElementById("passwordResetForm");

passwordResetForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const emailVal = emailInput.value;
  const passwordVal = password.value;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(emailVal)) {
    emailInput.classList.add("error");
    emailError.style.display = "block";
    emailInput.focus();
    return;
  }

  if (!passwordVal) {
    alert("กรุณาระบุรหัสผ่าน");
    return;
  }

  alert("ข้อมูลถูกต้อง กำลังเข้าสู่ระบบ...");
  alert("ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว");
  window.location.href = "login.html";
});
