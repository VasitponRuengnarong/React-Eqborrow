// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------
  // Handle "Add Product" Button
  // ------------------------------------------------
  const modal = document.getElementById("addProductModal");
  const addProductBtn = document.querySelector(".page-header .btn-primary");
  const closeModal = document.querySelector(".close-modal");
  const productForm = document.getElementById("addProductForm");
  const tableBody = document.querySelector("tbody");

  if (addProductBtn) {
    addProductBtn.addEventListener("click", function () {
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
  if (productForm) {
    productForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("pName").value;
      const category = document.getElementById("pCategory").value;
      const stock = document.getElementById("pStock").value;
      const id = "PROD-" + Math.floor(Math.random() * 1000); // Random ID

      const newRow = `
        <tr>
            <td>${id}</td>
            <td><img src="https://via.placeholder.com/60" alt="Product" class="product-img" /></td>
            <td>${name}</td>
            <td>${category}</td>
            <td>${stock}</td>
            <td><span class="status paid">พร้อมใช้งาน</span></td>
            <td class="action-buttons">
                <button class="btn-action btn-edit"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn-action btn-delete"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
      `;

      tableBody.insertAdjacentHTML("beforeend", newRow);
      modal.style.display = "none";
      productForm.reset();
    });
  }

  // ------------------------------------------------
  // Handle Actions (Event Delegation)
  // ------------------------------------------------
  tableBody.addEventListener("click", function (e) {
    // Delete
    if (e.target.closest(".btn-delete")) {
      const row = e.target.closest("tr");
      const productName = row.querySelector("td:nth-child(3)").innerText;
      if (confirm(`คุณต้องการลบสินค้า "${productName}" ใช่หรือไม่?`)) {
        row.remove();
      }
    }

    // Edit
    if (e.target.closest(".btn-edit")) {
      const row = e.target.closest("tr");
      const productName = row.querySelector("td:nth-child(3)").innerText;
      alert(`แก้ไขข้อมูลสินค้า: ${productName}`);
    }
  });
});
