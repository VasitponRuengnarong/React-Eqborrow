document.addEventListener("DOMContentLoaded", () => {
  renderLayout();
  initDashboard();
});

// Function to render Sidebar and Header dynamically
function renderLayout() {
  // Check if sidebar already exists (to prevent duplication if HTML is not updated)
  if (document.querySelector(".sidebar")) return;

  const container = document.querySelector(".dashboard-container");
  const mainContent = document.querySelector(".main-content");
  if (!container || !mainContent) return;

  // --- Render Sidebar ---
  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";

  const currentPage =
    window.location.pathname.split("/").pop() || "dashboard.html";

  const navItems = [
    { href: "dashboard.html", icon: "fa-solid fa-house", text: "หน้าหลัก" },
    {
      href: "payment.html",
      icon: "fa-solid fa-file-invoice-dollar",
      text: "รายการชำระเงิน",
    },
    {
      href: "category.html",
      icon: "fa-solid fa-layer-group",
      text: "หมวดหมู่สินค้า",
    },
    { href: "product.html", icon: "fa-solid fa-boxes-stacked", text: "สินค้า" },
    {
      href: "department.html",
      icon: "fa-solid fa-building-user",
      text: "เเผนก",
    },
    {
      href: "member_type.html",
      icon: "fa-solid fa-person",
      text: "ประเภทสมาชิก",
    },
    { href: "member.html", icon: "fa-solid fa-address-card", text: "สมาชิก" },
    { href: "profile.html", icon: "fa-solid fa-user", text: "ผู้ใช้งาน" },
    {
      href: "borrow_return.html",
      icon: "fa-solid fa-right-left",
      text: "ยืม-คืน",
    },
    {
      href: "remaining.html",
      icon: "fa-regular fa-note-sticky",
      text: "รายการคงเหลือ",
    },
    {
      href: "borrowed_list.html",
      icon: "fa-solid fa-flag",
      text: "รายการยืมคืน",
    },
    {
      href: "admin_control.html",
      icon: "fa-solid fa-screwdriver-wrench",
      text: "จัดการระบบ",
    },
  ];

  const navLinks = navItems
    .map((item) => {
      const activeClass = item.href === currentPage ? 'class="active"' : "";
      return `<li ${activeClass}><a href="${item.href}"><i class="${item.icon}"></i> ${item.text}</a></li>`;
    })
    .join("");

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <img src="images/logob.png" alt="Eqborrow Logo" />
      <div class="logo-text">
        <div class="brand">Eqborrow</div>
        <div class="system">E-PAYMENT</div>
      </div>
    </div>
    <ul class="nav-links">${navLinks}</ul>
    <div class="logout-section">
      <a href="#" id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i> ออกจากระบบ</a>
    </div>
  `;

  container.insertBefore(sidebar, mainContent);

  // --- Render Header ---
  if (!mainContent.querySelector("header")) {
    const header = document.createElement("header");
    header.innerHTML = `
      <div class="menu-toggle" id="menuToggle">
        <i class="fa-solid fa-bars"></i>
      </div>
      <div class="header-time" id="headerTime"></div>
      <div class="user-profile">
        <img src="https://ui-avatars.com/api/?name=User+Name&background=ff6b35&color=fff" alt="User" />
        <span>ทดสอบ</span>
      </div>
    `;
    mainContent.insertBefore(header, mainContent.firstChild);
  }
}

function initDashboard() {
  const logoutBtn = document.getElementById("logoutBtn");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");

  // Logout Functionality
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
        window.location.href = "login.html";
      }
    });
  }

  // Mobile Menu Toggle
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
          sidebar.classList.remove("active");
        }
      }
    });
  }

  // Dark Mode Logic (Run after layout is rendered)
  const body = document.body;
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    body.classList.add("dark-mode");
    const logoImg = document.querySelector(".sidebar-header img");
    if (logoImg) logoImg.src = "images/logob.png";
  }

  // Initialize Clock
  updateDateTime();

  // Sync with the minute and update every 60 seconds
  const now = new Date();
  const timeToNextMinute =
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  setTimeout(() => {
    updateDateTime();
    setInterval(updateDateTime, 60000);
  }, timeToNextMinute);
}

// ------------------------------------------------
// Real-time Clock & Theme Logic
// ------------------------------------------------

const body = document.body;

function toggleTheme() {
  body.classList.toggle("dark-mode");
  const isDark = body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  const toggleBtn = document.getElementById("themeToggle");
  if (toggleBtn) {
    toggleBtn.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
    toggleBtn.style.color = isDark ? "#ffeb3b" : "#666";
  }

  const logoImg = document.querySelector(".sidebar-header img");
  if (logoImg) {
    logoImg.style.opacity = "0";
    setTimeout(() => {
      logoImg.src = isDark ? "images/logob.png" : "images/logo.png";
      logoImg.style.opacity = "1";
    }, 300);
  }
}

function updateDateTime() {
  const now = new Date();
  const dateOptions = { day: "numeric", month: "short", year: "2-digit" };
  const timeOptions = { hour: "2-digit", minute: "2-digit" };

  const dateStr = now.toLocaleDateString("th-TH", dateOptions);
  const timeStr = now.toLocaleTimeString("th-TH", timeOptions);

  const timeElement = document.getElementById("headerTime");
  if (timeElement) {
    let timeDisplay = document.getElementById("timeDisplay");

    // Create structure if it doesn't exist
    if (!timeDisplay) {
      timeElement.innerHTML = "";

      // Time Container
      timeDisplay = document.createElement("div");
      timeDisplay.id = "timeDisplay";
      timeDisplay.style.display = "flex";
      timeDisplay.style.alignItems = "center";
      timeDisplay.style.gap = "8px";
      timeElement.appendChild(timeDisplay);

      // Separator
      const sep = document.createElement("div");
      sep.style.width = "1px";
      sep.style.height = "14px";
      sep.style.backgroundColor = "#ddd";
      sep.style.margin = "0 10px";
      timeElement.appendChild(sep);

      // Toggle Button
      const btn = document.createElement("button");
      btn.id = "themeToggle";
      btn.style.background = "none";
      btn.style.border = "none";
      btn.style.cursor = "pointer";
      btn.style.fontSize = "1rem";
      btn.style.padding = "0";
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.onclick = toggleTheme;

      const isDark = document.body.classList.contains("dark-mode");
      btn.innerHTML = isDark
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
      btn.style.color = isDark ? "#ffeb3b" : "#666";

      timeElement.appendChild(btn);
    }

    // Update time text only
    timeDisplay.innerHTML = `<i class="fa-regular fa-clock" style="color: #999;"></i> ${dateStr} <span style="color: #ddd; margin: 0 5px;">|</span> ${timeStr}`;
  }
}
