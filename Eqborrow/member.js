// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------
  // Handle "Add Member" Button
  // ------------------------------------------------
  const modal = document.getElementById("addMemberModal");
  const addMemberBtn = document.getElementById("btnAddMember");
  const closeModal = document.querySelector("#addMemberModal .close-modal");
  const memberForm = document.getElementById("addMemberForm");
  const tableBody = document.getElementById("memberTableBody");

  if (addMemberBtn) {
    addMemberBtn.addEventListener("click", function () {
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
  if (memberForm) {
    memberForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("mName").value;
      const type = document.getElementById("mType").value;
      const phone = document.getElementById("mPhone").value;
      const id = "MEM-" + Math.floor(Math.random() * 1000); // Random ID

      const newRow = `
        <tr>
            <td>${id}</td>
            <td>${name}</td>
            <td>${type}</td>
            <td>${phone}</td>
            <td class="admin-only"><span class="status paid">ปกติ</span></td>
        </tr>
      `;

      tableBody.insertAdjacentHTML("beforeend", newRow);
      modal.style.display = "none";
      memberForm.reset();
    });
  }

  // ------------------------------------------------
  // Handle Actions (Event Delegation)
  // ------------------------------------------------
  tableBody.addEventListener("click", function (e) {
    // Delete
    if (e.target.closest(".btn-delete")) {
      const row = e.target.closest("tr");
      const memberName = row.querySelector("td:nth-child(2)").innerText;
      if (confirm(`คุณต้องการลบสมาชิก "${memberName}" ใช่หรือไม่?`)) {
        row.remove();
      }
    }

    // Edit
    if (e.target.closest(".btn-edit")) {
      const row = e.target.closest("tr");
      const memberName = row.querySelector("td:nth-child(2)").innerText;
      alert(`แก้ไขข้อมูลสมาชิก: ${memberName}`);
    }
  });
});
