document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("addTypeModal");
  const addBtn = document.getElementById("btnAddType");
  const closeModal = document.querySelector("#addTypeModal .close-modal");
  const form = document.getElementById("addTypeForm");
  const tableBody = document.getElementById("typeTableBody");

  // Open Modal
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      modal.style.display = "block";
    });
  }

  // Close Modal
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target == modal) {
      modal.style.display = "none";
    }
  });

  // Handle Form Submit
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("tName").value;
      const discount = document.getElementById("tDiscount").value;
      const desc = document.getElementById("tDesc").value;
      const id = "TYPE-" + Math.floor(Math.random() * 1000);

      const newRow = `
          <tr>
              <td>${id}</td>
              <td>${name}</td>
              <td>${discount}%</td>
              <td>${desc}</td>
              <td><span class="status paid">ใช้งาน</span></td>
          </tr>
        `;

      tableBody.insertAdjacentHTML("beforeend", newRow);
      modal.style.display = "none";
      form.reset();
    });
  }
});
