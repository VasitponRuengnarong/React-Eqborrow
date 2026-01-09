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

// ------------------------------------------------
// Single Page Navigation Logic
// ------------------------------------------------
const navItems = document.querySelectorAll(".nav-item");
const viewSections = document.querySelectorAll(".view-section");
const navLinks = document.querySelectorAll(".nav-links li");

navItems.forEach((item) => {
  item.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("data-target");

    // Hide all sections
    viewSections.forEach((section) => {
      section.style.display = "none";
    });

    // Show target section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.style.display = "block";
    }

    // Update active state in sidebar
    navLinks.forEach((li) => li.classList.remove("active"));
    this.parentElement.classList.add("active");
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const paymentModal = document.getElementById("addPaymentModal");
  const addPaymentBtn = document.getElementById("btnAddPayment");
  const closePaymentModal = document.querySelector(
    "#addPaymentModal .close-modal"
  );
  const paymentForm = document.getElementById("addPaymentForm");
  const paymentTableBody = document.getElementById("paymentTableBody");

  if (addPaymentBtn && paymentModal) {
    addPaymentBtn.addEventListener("click", function () {
      paymentModal.style.display = "block";
    });
  }

  if (closePaymentModal && paymentModal) {
    closePaymentModal.addEventListener("click", function () {
      paymentModal.style.display = "none";
    });
  }

  window.addEventListener("click", function (e) {
    if (e.target == paymentModal) {
      paymentModal.style.display = "none";
    }
  });

  if (paymentForm && paymentTableBody) {
    paymentForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const member = document.getElementById("payMember").value;
      const item = document.getElementById("payItem").value;
      const method = document.getElementById("payMethod").value;
      const amount = document.getElementById("payAmount").value;
      const status = document.getElementById("payStatus").value;
      const id = "INV-" + Math.floor(Math.random() * 1000);
      const date = new Date().toLocaleDateString("th-TH");

      const statusBadge =
        status === "paid"
          ? '<span class="status paid">ชำระแล้ว</span>'
          : '<span class="status pending">รอชำระ</span>';

      const newRow = `
        <tr>
            <td>${id}</td>
            <td>${member}</td>
            <td>${item}</td>
            <td>${date}</td>
            <td>${method}</td>
            <td>${parseFloat(amount).toFixed(2)}</td>
            <td>${statusBadge}</td>
        </tr>
      `;

      paymentTableBody.insertAdjacentHTML("beforeend", newRow);
      paymentModal.style.display = "none";
      paymentForm.reset();
    });

    paymentTableBody.addEventListener("click", function (e) {
      if (e.target.closest(".btn-delete")) {
        const row = e.target.closest("tr");
        if (confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
          row.remove();
        }
      }
      if (e.target.closest(".btn-edit")) {
        alert("แก้ไขข้อมูลรายการชำระเงิน");
      }
    });
  }
});
