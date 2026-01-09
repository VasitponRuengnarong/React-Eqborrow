document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.getElementById("borrowedListBody");
  const filterBtns = document.querySelectorAll(".btn-filter");
  const searchInput = document.getElementById("searchInput");
  const exportBtn = document.getElementById("exportExcelBtn");

  // Mock Data
  const borrowedData = [
    {
      id: "BR-2023-001",
      member: "สมชาย ใจดี",
      item: "กล้อง Sony A7S III",
      borrowDate: "25 ต.ค. 2566",
      dueDate: "27 ต.ค. 2566",
      status: "returned",
      statusText: "คืนแล้ว",
      note: "-",
    },
    {
      id: "BR-2023-002",
      member: "สมศักดิ์ รักงาน",
      item: "ไมโครโฟน Rode",
      borrowDate: "28 ต.ค. 2566",
      dueDate: "30 ต.ค. 2566",
      status: "borrowed",
      statusText: "กำลังยืม",
      note: "-",
    },
    {
      id: "BR-2023-003",
      member: "วิชัย ใจกล้า",
      item: "ขาตั้งกล้อง Manfrotto",
      borrowDate: "20 ต.ค. 2566",
      dueDate: "22 ต.ค. 2566",
      status: "overdue",
      statusText: "เกินกำหนด",
      note: "ติดต่อไม่ได้",
    },
    {
      id: "BR-2023-004",
      member: "มานี มีตา",
      item: "ไฟ LED Studio",
      borrowDate: "01 พ.ย. 2566",
      dueDate: "03 พ.ย. 2566",
      status: "borrowed",
      statusText: "กำลังยืม",
      note: "-",
    },
    {
      id: "BR-2023-005",
      member: "ปิติ พอใจ",
      item: "เลนส์ Sony 24-70mm",
      borrowDate: "15 ต.ค. 2566",
      dueDate: "17 ต.ค. 2566",
      status: "returned",
      statusText: "คืนแล้ว",
      note: "สภาพปกติ",
    },
  ];

  // Function to render table
  function renderTable(data) {
    tableBody.innerHTML = "";
    data.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${row.member}</td>
        <td>${row.item}</td>
        <td>${row.borrowDate}</td>
        <td>${row.dueDate}</td>
        <td><span class="status ${row.status}">${row.statusText}</span></td>
        <td>${row.note}</td>
      `;
      tableBody.appendChild(tr);
    });

    if (data.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;">ไม่พบข้อมูล</td></tr>';
    }
  }

  // Initial Render
  renderTable(borrowedData);

  // Filter Logic
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all
      filterBtns.forEach((b) => b.classList.remove("active"));
      // Add active to clicked
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");
      let filteredData = borrowedData;

      if (filterValue !== "all") {
        filteredData = borrowedData.filter(
          (item) => item.status === filterValue
        );
      }

      // Apply search filter if exists
      const searchTerm = searchInput.value.toLowerCase();
      if (searchTerm) {
        filteredData = filteredData.filter(
          (item) =>
            item.member.toLowerCase().includes(searchTerm) ||
            item.item.toLowerCase().includes(searchTerm) ||
            item.id.toLowerCase().includes(searchTerm)
        );
      }

      renderTable(filteredData);
    });
  });

  // Search Logic
  searchInput.addEventListener("keyup", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilterBtn = document.querySelector(".btn-filter.active");
    const filterValue = activeFilterBtn.getAttribute("data-filter");

    let filteredData = borrowedData;

    // Apply category filter first
    if (filterValue !== "all") {
      filteredData = filteredData.filter((item) => item.status === filterValue);
    }

    // Apply search
    filteredData = filteredData.filter(
      (item) =>
        item.member.toLowerCase().includes(searchTerm) ||
        item.item.toLowerCase().includes(searchTerm) ||
        item.id.toLowerCase().includes(searchTerm)
    );

    renderTable(filteredData);
  });

  // Export to Excel Logic
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const table = document.querySelector("table");
      const wb = XLSX.utils.table_to_book(table, { sheet: "BorrowedItems" });
      XLSX.writeFile(wb, "BorrowedItems_Report.xlsx");
    });
  }
});
