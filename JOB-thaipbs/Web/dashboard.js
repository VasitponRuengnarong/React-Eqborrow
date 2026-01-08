const logoutBtn = document.getElementById("logoutBtn");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");

// Logout Functionality
logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
    window.location.href = "login.html";
  }
});

// Mobile Menu Toggle
menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

// Close sidebar when clicking outside on mobile
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 768) {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove("active");
    }
  }
});
