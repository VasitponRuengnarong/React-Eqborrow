const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const inputs = document.querySelectorAll(".profile-form input:not([disabled])");

editBtn.addEventListener("click", () => {
  inputs.forEach((input) => {
    input.removeAttribute("readonly");
  });
  editBtn.style.display = "none";
  saveBtn.style.display = "flex";
  cancelBtn.style.display = "flex";
  inputs[1].focus(); // Focus on first editable field (skip ID card)
});

cancelBtn.addEventListener("click", () => {
  inputs.forEach((input) => {
    input.setAttribute("readonly", true);
  });
  editBtn.style.display = "flex";
  saveBtn.style.display = "none";
  cancelBtn.style.display = "none";
  // Optional: Reset form to original values here
});

document.getElementById("profileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  // Simulate saving data
  alert("บันทึกข้อมูลเรียบร้อยแล้ว");
  inputs.forEach((input) => {
    input.setAttribute("readonly", true);
  });
  editBtn.style.display = "flex";
  saveBtn.style.display = "none";
  cancelBtn.style.display = "none";
});
