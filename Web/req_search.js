const emailInput = document.getElementById("email");
const emailError = document.getElementById("emailError");
const idInput = document.getElementById("idNumber");
const searchForm = document.getElementById("reqSearchForm");

// 1. Email Validation
emailInput.addEventListener("input", function () {
  if (emailInput.classList.contains("error")) {
    emailInput.classList.remove("error");
    emailError.style.display = "none";
  }
});

// 2. ID Number Validation (Numeric Only)
idInput.addEventListener("input", function () {
  this.value = this.value.replace(/[^0-9]/g, "");
});

// 3. Form Submission
searchForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const emailVal = emailInput.value;
  const idVal = idInput.value;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let isValid = true;

  // Check Email
  if (!emailPattern.test(emailVal)) {
    emailInput.classList.add("error");
    emailError.style.display = "block";
    isValid = false;
  }

  // Check ID Number
  if (!idVal) {
    alert("กรุณาระบุเลขที่บัตร");
    isValid = false;
  }

  if (isValid) {
    alert("กำลังค้นหาข้อมูล...");
  }
});
