// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------
  // Handle "Add Payment" Button
  // ------------------------------------------------
  const modal = document.getElementById("addPaymentModal");
  const addPaymentBtn = document.getElementById("btnAddPayment");
  const closeModal = document.querySelector("#addPaymentModal .close-modal");
  const paymentForm = document.getElementById("addPaymentForm");
  const tableBody = document.getElementById("paymentTableBody");

  if (addPaymentBtn) {
    addPaymentBtn.addEventListener("click", function () {
      modal.style.display = "block";
    });
  }

  if (closeModal) {
    closeModal.addEventListener("click", function () {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", function (e) {
    if (e.target == modal) {
      modal.style.display = "none";
    }
  });

  // ------------------------------------------------
  // Handle Form Submit (Add Row)
  // ------------------------------------------------
  if (paymentForm) {
    paymentForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const member = document.getElementById("payMember").value;
      const item = document.getElementById("payItem").value;
      const method = document.getElementById("payMethod").value;
      const amount = document.getElementById("payAmount").value;
      const status = document.getElementById("payStatus").value;
      const id = "INV-" + Math.floor(Math.random() * 1000); // Random ID
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

      tableBody.insertAdjacentHTML("beforeend", newRow);
      modal.style.display = "none";
      paymentForm.reset();
    });
  }

  // ------------------------------------------------
  // Handle Actions (Event Delegation)
  // ------------------------------------------------
  tableBody.addEventListener("click", function (e) {
    // Delete
    if (e.target.closest(".btn-delete")) {
      const row = e.target.closest("tr");
      if (confirm(`คุณต้องการลบรายการนี้ใช่หรือไม่?`)) {
        row.remove();
      }
    }

    // Edit
    if (e.target.closest(".btn-edit")) {
      alert(`แก้ไขข้อมูลรายการชำระเงิน`);
    }
  });
});
