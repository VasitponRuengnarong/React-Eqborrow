const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const isPassword = password.type === "password";
  password.type = isPassword ? "text" : "password";
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});

const usernameInput = document.getElementById("username");
const usernameError = document.getElementById("usernameError");

usernameInput.addEventListener("input", function () {
  this.value = this.value.replace(/[^0-9]/g, ""); // ให้เหลือแค่ 0-9

  if (usernameInput.classList.contains("error")) {
    usernameInput.classList.remove("error");
    usernameError.style.display = "none";
  }
});

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const usernameVal = usernameInput.value;
  const passwordVal = password.value;

  if (usernameVal.length !== 10 && usernameVal.length !== 13) {
    usernameInput.classList.add("error");
    usernameError.style.display = "block";
    usernameInput.focus();
    return;
  }

  if (!passwordVal) {
    alert("กรุณาระบุรหัสผ่าน");
    return;
  }

  alert("ข้อมูลถูกต้อง กำลังเข้าสู่ระบบ...");
  window.location.href = "dashboard.html";
});
