// Complete Functionality
const completeBtns = document.querySelectorAll(".btn-complete");

completeBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const row = e.target.closest("tr");
    const paymentId = row.querySelector(".payment-id").textContent;
    const paymentStatus = row.querySelector(".payment-status");

    if (
      confirm(`คุณต้องการเปลี่ยนสถานะรายการชำระเงิน #${paymentId} ใช่หรือไม่?`)
    ) {
      paymentStatus.textContent = "Completed";
    }
  });
});
