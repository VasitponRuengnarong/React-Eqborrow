// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------
  // Handle "Add Department" Button
  // ------------------------------------------------
  const modal = document.getElementById("addDepartmentModal");
  const addDepartmentBtn = document.getElementById("btnAddDepartment");
  const closeModal = document.querySelector("#addDepartmentModal .close-modal");
  const departmentForm = document.getElementById("addDepartmentForm");
  const tableBody = document.getElementById("departmentTableBody");

  if (addDepartmentBtn) {
    addDepartmentBtn.addEventListener("click", function () {
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
  if (departmentForm) {
    departmentForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("dName").value;
      const head = document.getElementById("dHead").value;
      const phone = document.getElementById("dPhone").value;
      const status = document.getElementById("dStatus").value;
      const id = "DEP-" + Math.floor(Math.random() * 1000); // Random ID

      const statusBadge =
        status === "active"
          ? '<span class="status paid">ใช้งาน</span>'
          : '<span class="status pending">ไม่ใช้งาน</span>';

      const newRow = `
        <tr>
            <td>${id}</td>
            <td>${name}</td>
            <td>${head}</td>
            <td>${phone}</td>
            <td class="admin-only">${statusBadge}</td>
        </tr>
      `;

      tableBody.insertAdjacentHTML("beforeend", newRow);
      modal.style.display = "none";
      departmentForm.reset();
    });
  }
  tableBody.addEventListener("click", function (e) {
    if (e.target.closest(".btn-delete")) {
      if (confirm("คุณต้องการลบแผนกนี้ใช่หรือไม่?"))
        e.target.closest("tr").remove();
    }
    if (e.target.closest(".btn-edit")) {
      alert("แก้ไขข้อมูลแผนก");
    }
  });
});
