// Password Change Form Logic
const passwordForm = document.getElementById("passwordForm");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

if (passwordForm) {
  passwordForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (newPassword.value !== confirmPassword.value) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน กรุณาลองใหม่อีกครั้ง");
      return;
    }

    if (newPassword.value.length < 8) {
      alert("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }

    // Simulate API call
    alert("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
    passwordForm.reset();
  });
}

document
  .getElementById("languageSelect")
  .addEventListener("change", function () {
    alert("เปลี่ยนภาษาเป็น: " + this.options[this.selectedIndex].text);
  });
