const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Database Connection Pool
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "eqborrow_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper: Format Date to Thai Format (e.g., 25 ต.ค. 2566)
const formatThaiDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Helper: Map Status to Thai Text
const getStatusText = (status) => {
  const statusMap = {
    borrowed: "กำลังยืม",
    returned: "คืนแล้ว",
    overdue: "เกินกำหนด",
    lost: "สูญหาย",
  };
  return statusMap[status] || status;
};

// API: Get Borrowed Items List
app.get("/api/borrowed-items", (req, res) => {
  const searchQuery = req.query.q;
  let sql = `
        SELECT 
            bt.transaction_code AS id,
            m.full_name AS member,
            p.name AS item,
            bt.borrow_date,
            bt.due_date,
            bt.status,
            bt.note
        FROM borrow_transactions bt
        JOIN members m ON bt.member_id = m.id
        JOIN products p ON bt.product_id = p.id
    `;

  const params = [];
  if (searchQuery) {
    sql += ` WHERE bt.transaction_code LIKE ? OR m.full_name LIKE ? OR p.name LIKE ?`;
    const term = `%${searchQuery}%`;
    params.push(term, term, term);
  }

  sql += ` ORDER BY bt.borrow_date DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching borrowed items:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Transform data to match frontend structure
    const formattedData = results.map((row) => ({
      id: row.id,
      member: row.member,
      item: row.item,
      borrowDate: formatThaiDate(row.borrow_date),
      dueDate: formatThaiDate(row.due_date),
      status: row.status,
      statusText: getStatusText(row.status),
      note: row.note || "-",
    }));

    res.json(formattedData);
  });
});

// API: Create Borrow Transaction
app.post("/api/borrow-transactions", (req, res) => {
  const { member_name, product_name, borrow_date, due_date } = req.body;

  if (!member_name || !product_name || !borrow_date || !due_date) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  // Generate Transaction Code (e.g., BR-20231027-1234)
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const transaction_code = `BR-${datePart}-${randomPart}`;

  // SQL to insert transaction
  // We use subqueries to find the member_id and product_id based on names
  const sql = `
        INSERT INTO borrow_transactions 
        (transaction_code, member_id, product_id, borrow_date, due_date, status)
        VALUES (
            ?, 
            (SELECT id FROM members WHERE full_name = ? LIMIT 1), 
            (SELECT id FROM products WHERE name = ? LIMIT 1), 
            ?, 
            ?, 
            'borrowed'
        )
    `;

  db.query(
    sql,
    [transaction_code, member_name, product_name, borrow_date, due_date],
    (err, result) => {
      if (err) {
        console.error("Error creating transaction:", err);
        if (err.code === "ER_BAD_NULL_ERROR") {
          return res
            .status(400)
            .json({ error: "ไม่พบข้อมูลสมาชิกหรือสินค้าในระบบ" });
        }
        return res
          .status(500)
          .json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
      }
      res.json({ message: "บันทึกรายการยืมสำเร็จ", id: transaction_code });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
