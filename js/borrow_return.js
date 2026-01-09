document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("addBorrowModal");
  const addBtn = document.getElementById("btnAddBorrow");
  const closeModal = document.querySelector("#addBorrowModal .close-modal");
  const form = document.getElementById("addBorrowForm");
  const tableBody = document.getElementById("borrowTableBody");

  // Open Modal
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      modal.style.display = "block";
      // Set default date to today
      const today = new Date().toISOString().split("T")[0];
      document.getElementById("bDate").value = today;
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

      const member = document.getElementById("bMember").value;
      const item = document.getElementById("bItem").value;
      const date = document.getElementById("bDate").value;
      const dueDate = document.getElementById("bDueDate").value;
      const id =
        "BR-" +
        new Date().getFullYear() +
        "-" +
        Math.floor(Math.random() * 1000);

      const newRow = `
          <tr>
              <td>${id}</td>
              <td>${member}</td>
              <td>${item}</td>
              <td>${date}</td>
              <td>${dueDate}</td>
              <td><span class="status borrowed">กำลังยืม</span></td>
              <td><button class="btn-sm btn-return">แจ้งคืน</button></td>
          </tr>
        `;

      if (tableBody) {
        tableBody.insertAdjacentHTML("beforeend", newRow);
        modal.style.display = "none";
        form.reset();
      }
    });
  }

  // Handle Return Action (Event Delegation)
  if (tableBody) {
    tableBody.addEventListener("click", function (e) {
      if (e.target && e.target.classList.contains("btn-return")) {
        const row = e.target.closest("tr");
        const statusSpan = row.querySelector(".status");
        const actionCell = e.target.parentElement;

        if (confirm("ยืนยันการคืนอุปกรณ์?")) {
          statusSpan.className = "status returned";
          statusSpan.textContent = "คืนแล้ว";
          actionCell.innerHTML = "-";
        }
      }
    });
  }

  // Search Functionality
  const searchInput = document.querySelector(".search-bar input");
  if (searchInput && tableBody) {
    searchInput.addEventListener("keyup", function () {
      const filter = searchInput.value.toLowerCase();
      const rows = tableBody.getElementsByTagName("tr");

      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName("td");
        let match = false;

        for (let j = 0; j < cells.length; j++) {
          if (cells[j].innerText.toLowerCase().includes(filter)) {
            match = true;
            break;
          }
        }

        rows[i].style.display = match ? "" : "none";
      }
    });
  }
});
