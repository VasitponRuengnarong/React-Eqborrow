document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.getElementById("pageSettingsBody");

  // Mock Data (Simulating Database Response)
  // In a real app, you would fetch this from your API
  const pageSettings = [
    { id: 1, name: "หน้าหลัก", file: "dashboard.html", enabled: true },
    { id: 2, name: "รายการชำระเงิน", file: "payment.html", enabled: true },
    { id: 3, name: "หมวดหมู่สินค้า", file: "category.html", enabled: true },
    { id: 4, name: "สินค้า", file: "product.html", enabled: true },
    { id: 5, name: "เเผนก", file: "department.html", enabled: true },
    { id: 6, name: "ประเภทสมาชิก", file: "member_type.html", enabled: true },
    { id: 7, name: "สมาชิก", file: "member.html", enabled: true },
    { id: 8, name: "ผู้ใช้งาน", file: "profile.html", enabled: true },
    { id: 9, name: "ยืม-คืน", file: "borrow_return.html", enabled: true },
    { id: 10, name: "รายการคงเหลือ", file: "remaining.html", enabled: true },
  ];

  // Function to render table
  function renderTable(data) {
    tableBody.innerHTML = "";
    data.forEach((page) => {
      const tr = document.createElement("tr");
      // Use 'paid' class for green (active), 'pending' for orange (inactive)
      const statusClass = page.enabled ? "paid" : "pending";
      const statusText = page.enabled ? "ใช้งาน" : "ปิดใช้งาน";
      const isChecked = page.enabled ? "checked" : "";

      tr.innerHTML = `
        <td>${page.name}</td>
        <td>${page.file}</td>
        <td><span class="status ${statusClass}" id="status-${page.id}">${statusText}</span></td>
        <td>
            <label class="toggle-switch">
                <input type="checkbox" ${isChecked} onchange="togglePageStatus(${page.id}, this.checked)">
                <span class="slider"></span>
            </label>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Initial Render
  renderTable(pageSettings);

  // Expose toggle function to window so onclick works
  window.togglePageStatus = function (id, isChecked) {
    // Update UI Status Text immediately
    const statusSpan = document.getElementById(`status-${id}`);
    if (isChecked) {
      statusSpan.className = "status paid";
      statusSpan.innerText = "ใช้งาน";
    } else {
      statusSpan.className = "status pending";
      statusSpan.innerText = "ปิดใช้งาน";
    }

    // TODO: Send AJAX request to backend to update database
    console.log(`Page ID ${id} status changed to: ${isChecked}`);
    /*
    fetch('/api/update_page_status', {
        method: 'POST',
        body: JSON.stringify({ id: id, enabled: isChecked }),
        headers: { 'Content-Type': 'application/json' }
    });
    */
  };
});
