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

  if (!usernameVal) {
    usernameInput.classList.add("error");
    usernameError.innerText = "กรุณาระบุชื่อผู้ใช้งาน";
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
