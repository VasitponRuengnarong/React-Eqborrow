// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------
  // Handle "Add Category" Button
  // ------------------------------------------------
  const modal = document.getElementById("addCategoryModal");
  const addCategoryBtn = document.querySelector(".page-header .btn-primary");
  const closeModal = document.querySelector(".close-modal");
  const categoryForm = document.getElementById("addCategoryForm");
  const tableBody = document.querySelector("tbody");

  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", function () {
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
  if (categoryForm) {
    categoryForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("cName").value;
      const desc = document.getElementById("cDesc").value;
      const status = document.getElementById("cStatus").value;
      const id = "CAT-" + Math.floor(Math.random() * 1000); // Random ID

      const statusBadge =
        status === "active"
          ? '<span class="status paid">ใช้งาน</span>'
          : '<span class="status pending">ไม่ใช้งาน</span>';

      const newRow = `
        <tr>
            <td>${id}</td>
            <td>${name}</td>
            <td>${desc}</td>
            <td>${statusBadge}</td>
            <td class="action-buttons">
                <button class="btn-action btn-edit"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn-action btn-delete"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
      `;

      tableBody.insertAdjacentHTML("beforeend", newRow);
      modal.style.display = "none";
      categoryForm.reset();
    });
  }

  // ------------------------------------------------
  // Handle Actions (Event Delegation)
  // ------------------------------------------------
  tableBody.addEventListener("click", function (e) {
    // Delete
    if (e.target.closest(".btn-delete")) {
      const row = e.target.closest("tr");
      const categoryName = row.querySelector("td:nth-child(2)").innerText;
      if (confirm(`คุณต้องการลบหมวดหมู่ "${categoryName}" ใช่หรือไม่?`)) {
        row.remove();
      }
    }

    // Edit
    if (e.target.closest(".btn-edit")) {
      const row = e.target.closest("tr");
      const categoryName = row.querySelector("td:nth-child(2)").innerText;
      alert(`แก้ไขข้อมูลหมวดหมู่: ${categoryName}`);
    }
  });
});
