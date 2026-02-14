require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors"); // Import cors
const mysql = require("mysql2/promise"); // Use the promise-based library
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

// Request Logger: ดูว่ามี Request เข้ามาถึง Backend หรือไม่
app.use((req, res, next) => {
  console.log(`[Incoming Request] ${req.method} ${req.url}`);
  next();
});

// Database Connection Pool (more robust for web servers)
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost", // ใช้ IP แทน localhost เพื่อเลี่ยงปัญหา IPv6
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ebrs_system",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Debug: Log Database Config (ซ่อนรหัสผ่าน)
console.log("--- Database Configuration ---");
console.log(`Host: ${process.env.DB_HOST || "localhost"}`);
console.log(`Port: ${process.env.DB_PORT || 3306}`);
console.log(`User: ${process.env.DB_USER || "root"}`);
console.log(`Database: ${process.env.DB_NAME || "ebrs_system"}`);
console.log("------------------------------");

db.getConnection()
  .then((connection) => {
    console.log("Connected to database: ebrs_system");
    connection.release();
  })
  .catch((err) => {
    console.error("Error connecting to database:", err.stack);
  });

app.use(
  cors({
    origin: ["http://localhost:3000"], // อนุญาตเฉพาะ http://localhost:3000 เท่านั้น
  }),
);
app.use(express.json({ limit: "10mb" })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Root Endpoint
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Health Check Endpoint
app.get("/api/health", async (req, res) => {
  try {
    const connection = await db.getConnection(); // ลองขอ Connection จาก Pool
    connection.release(); // คืน Connection ทันที
    res.json({
      status: "ok",
      message: "Backend is running and Database is connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Backend is running but Database connection failed",
      error: error.message,
    });
  }
});

// Helper function for creating master data routes
const createMasterDataRoute = (app, path, tableName) => {
  app.get(`/api/${path}`, async (req, res) => {
    try {
      const [rows] = await db.execute(`SELECT * FROM ${tableName}`);
      res.json(rows);
    } catch (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      res.status(500).json({ message: `เกิดข้อผิดพลาดในการดึงข้อมูล ${path}` });
    }
  });
};

// Master Data Endpoints for Registration Form Dropdowns
createMasterDataRoute(app, "institutions", "TB_M_Institution");
createMasterDataRoute(app, "departments", "TB_M_Department");
createMasterDataRoute(app, "roles", "TB_M_Role");
createMasterDataRoute(app, "emp-statuses", "TB_M_StatusEMP");

// CRUD Endpoints for Institution Management

// Create a new institution
app.post("/api/institutions", async (req, res) => {
  const { InstitutionName } = req.body;
  if (!InstitutionName) {
    return res.status(400).json({ message: "กรุณากรอกชื่อสำนัก" });
  }
  try {
    const [result] = await db.execute(
      "INSERT INTO TB_M_Institution (InstitutionName) VALUES (?)",
      [InstitutionName],
    );
    res.status(201).json({ InstitutionID: result.insertId, InstitutionName });
  } catch (error) {
    console.error("Error creating institution:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างข้อมูล" });
  }
});

// Update an institution
app.put("/api/institutions/:id", async (req, res) => {
  const { id } = req.params;
  const { InstitutionName } = req.body;
  if (!InstitutionName) {
    return res.status(400).json({ message: "กรุณากรอกชื่อสำนัก" });
  }
  try {
    const [result] = await db.execute(
      "UPDATE TB_M_Institution SET InstitutionName = ? WHERE InstitutionID = ?",
      [InstitutionName, id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "ไม่พบข้อมูลสำนักที่ต้องการแก้ไข" });
    }
    res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error updating institution:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
  }
});

// Delete an institution
app.delete("/api/institutions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM TB_M_Institution WHERE InstitutionID = ?", [
      id,
    ]);
    res.status(204).send(); // No Content
  } catch (error) {
    console.error("Error deleting institution:", error);
    // Handle foreign key constraint error
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message: "ไม่สามารถลบข้อมูลนี้ได้ เนื่องจากมีพนักงานใช้งานอยู่",
      });
    }
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
});

// CRUD Endpoints for Department Management

app.post("/api/departments", async (req, res) => {
  const { DepartmentName } = req.body;
  if (!DepartmentName)
    return res.status(400).json({ message: "กรุณากรอกชื่อฝ่าย" });
  try {
    const [result] = await db.execute(
      "INSERT INTO TB_M_Department (DepartmentName) VALUES (?)",
      [DepartmentName],
    );
    res.status(201).json({ DepartmentID: result.insertId, DepartmentName });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างข้อมูล" });
  }
});

app.put("/api/departments/:id", async (req, res) => {
  const { id } = req.params;
  const { DepartmentName } = req.body;
  if (!DepartmentName)
    return res.status(400).json({ message: "กรุณากรอกชื่อฝ่าย" });
  try {
    await db.execute(
      "UPDATE TB_M_Department SET DepartmentName = ? WHERE DepartmentID = ?",
      [DepartmentName, id],
    );
    res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
  }
});

app.delete("/api/departments/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM TB_M_Department WHERE DepartmentID = ?", [
      id,
    ]);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting department:", error);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(400)
        .json({ message: "ไม่สามารถลบข้อมูลนี้ได้ เนื่องจากมีการใช้งานอยู่" });
    }
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
});

// CRUD Endpoints for Role Management

app.post("/api/roles", async (req, res) => {
  const { RoleName } = req.body;
  if (!RoleName)
    return res.status(400).json({ message: "กรุณากรอกชื่อตำแหน่ง" });
  try {
    const [result] = await db.execute(
      "INSERT INTO TB_M_Role (RoleName) VALUES (?)",
      [RoleName],
    );
    res.status(201).json({ RoleID: result.insertId, RoleName });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างข้อมูล" });
  }
});

app.put("/api/roles/:id", async (req, res) => {
  const { id } = req.params;
  const { RoleName } = req.body;
  if (!RoleName)
    return res.status(400).json({ message: "กรุณากรอกชื่อตำแหน่ง" });
  try {
    await db.execute("UPDATE TB_M_Role SET RoleName = ? WHERE RoleID = ?", [
      RoleName,
      id,
    ]);
    res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
  }
});

app.delete("/api/roles/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM TB_M_Role WHERE RoleID = ?", [id]);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting role:", error);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(400)
        .json({ message: "ไม่สามารถลบข้อมูลนี้ได้ เนื่องจากมีการใช้งานอยู่" });
    }
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
});

// Register Endpoint
app.post("/api/register", async (req, res) => {
  const {
    firstName,
    lastName,
    employeeId,
    username,
    email,
    phone,
    role,
    institutionId,
    departmentId,
    profileImage,
    password,
  } = req.body;

  if (
    !username ||
    !password ||
    !firstName ||
    !lastName ||
    !email ||
    !employeeId
  ) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    // 1. ตรวจสอบว่ามีผู้ใช้นี้อยู่แล้วหรือไม่
    const [existing] = await db.execute(
      "SELECT username FROM TB_T_Employee WHERE username = ? OR email = ? OR EMP_NUM = ?",
      [username, email, employeeId],
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "ชื่อผู้ใช้, อีเมล หรือรหัสพนักงานนี้ถูกใช้งานแล้ว" });
    }

    // 2. แปลง Role จาก Frontend (string) เป็น RoleID (int) ใน Database
    // Frontend ส่ง: 'user', 'manager', 'admin'
    // Database มี: 'User', 'Staff', 'Admin'
    let dbRoleName = "User";
    if (role === "admin") dbRoleName = "Admin";
    else if (role === "manager") dbRoleName = "Staff"; // Map manager ไปเป็น Staff

    const [roles] = await db.execute(
      "SELECT RoleID FROM TB_M_Role WHERE RoleName = ?",
      [dbRoleName],
    );
    const roleId = roles.length > 0 ? roles[0].RoleID : 2; // ถ้าหาไม่เจอให้เป็น User (ID 2)

    // 3. เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. บันทึกข้อมูลลงฐานข้อมูล
    // หมายเหตุ: กำหนดค่าเริ่มต้น InstitutionID=1, DepartmentID=1, EMPStatusID=1 (Active) ไปก่อน
    await db.execute(
      "INSERT INTO TB_T_Employee (fname, lname, EMP_NUM, username, email, phone, RoleID, InstitutionID, DepartmentID, EMPStatusID, image, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
      [
        firstName,
        lastName,
        employeeId,
        username,
        email,
        phone,
        roleId,
        institutionId || 1,
        departmentId || 1,
        profileImage,
        hashedPassword,
      ],
    );

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (error) {
    console.error("Register Error:", error);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์: " + error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  try {
    // Check for employee in TB_T_Employee table
    const [employees] = await db.execute(
      `SELECT e.*, r.RoleName 
       FROM TB_T_Employee e 
       LEFT JOIN TB_M_Role r ON e.RoleID = r.RoleID 
       WHERE e.username = ?`,
      [username],
    );

    if (employees.length === 0) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const employee = employees[0];
    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // Exclude password from the returned employee object
    const {
      password: _,
      reset_token,
      reset_token_expires,
      ...employeeWithoutSensitiveData
    } = employee;

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        // Renamed to 'user' for frontend compatibility, but it's an employee
        id: employee.EMPID,
        username: employee.username,
        email: employee.email,
        firstName: employee.fname,
        lastName: employee.lname,
        employeeId: employee.EMP_NUM,
        phone: employee.phone,
        role: employee.RoleName,
        roleId: employee.RoleID,
        institutionId: employee.InstitutionID,
        departmentId: employee.DepartmentID,
        empStatusId: employee.EMPStatusID,
        profileImage: employee.image,
      },
    });
  } catch (error) {
    console.error("Login Error Detail:", error); // Log error เต็มๆ
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์: " + error.message }); // ส่ง error message กลับไปที่หน้าเว็บด้วย (เฉพาะช่วง Dev)
  }
});

// Dashboard Stats Endpoint
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT COUNT(*) as count FROM TB_T_Employee",
    );
    const [borrows] = await db.execute(
      "SELECT COUNT(*) as count FROM TB_T_Borrow",
    );
    const [pending] = await db.execute(
      "SELECT COUNT(*) as count FROM TB_T_Borrow WHERE Status = 'Pending'",
    );
    const [returned] = await db.execute(
      "SELECT COUNT(*) as count FROM TB_T_Borrow WHERE Status = 'Returned'",
    );
    const [overdue] = await db.execute(
      "SELECT COUNT(*) as count FROM TB_T_Borrow WHERE Status = 'Approved' AND ReturnDate < CURDATE()",
    );

    // Monthly stats for graph (Last 6 months)
    const [monthly] = await db.execute(`
      SELECT DATE_FORMAT(BorrowDate, '%Y-%m') as name, COUNT(*) as count 
      FROM TB_T_Borrow 
      WHERE BorrowDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY name 
      ORDER BY name ASC
    `);

    // Status stats for pie chart
    const [statusData] = await db.execute(`
      SELECT Status as name, COUNT(*) as value 
      FROM TB_T_Borrow 
      GROUP BY Status
    `);

    // Overdue list for dashboard widget (Top 5)
    const [overdueRows] = await db.execute(`
      SELECT b.*, e.fname, e.lname, e.EMP_NUM, d.DepartmentName
      FROM TB_T_Borrow b
      JOIN TB_T_Employee e ON b.EMPID = e.EMPID
      LEFT JOIN TB_M_Department d ON e.DepartmentID = d.DepartmentID
      WHERE b.Status = 'Approved' AND b.ReturnDate < CURDATE()
      ORDER BY b.ReturnDate ASC
      LIMIT 5
    `);

    for (let borrow of overdueRows) {
      const [details] = await db.execute(
        "SELECT * FROM TB_T_BorrowDetail WHERE BorrowID = ?",
        [borrow.BorrowID],
      );
      borrow.items = details;
    }

    res.json({
      totalUsers: users[0].count,
      totalBorrows: borrows[0].count,
      pendingRequest: pending[0].count,
      returnedItems: returned[0].count,
      overdueCount: overdue[0].count,
      monthlyStats: monthly,
      statusStats: statusData,
      overdueList: overdueRows,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard" });
  }
});

// API สำหรับบันทึกการยืมครุภัณฑ์
app.post("/api/borrow", async (req, res) => {
  const { userId, borrowDate, returnDate, purpose, items } = req.body;

  if (!userId || !borrowDate || !returnDate || !items || items.length === 0) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  const connection = await db.getConnection();
  try {
    // เริ่ม Transaction (เพื่อให้ข้อมูล Header และ Detail บันทึกพร้อมกันเท่านั้น)
    await connection.beginTransaction();

    // 1. บันทึกข้อมูลหลักลง TB_T_Borrow
    const [borrowResult] = await connection.execute(
      "INSERT INTO TB_T_Borrow (EMPID, BorrowDate, ReturnDate, Purpose) VALUES (?, ?, ?, ?)",
      [userId, borrowDate, returnDate, purpose],
    );
    const borrowId = borrowResult.insertId;

    // 2. บันทึกรายการอุปกรณ์ลง TB_T_BorrowDetail
    for (const item of items) {
      await connection.execute(
        "INSERT INTO TB_T_BorrowDetail (BorrowID, ProductID, ItemName, Quantity, Remark) VALUES (?, ?, ?, ?, ?)",
        [
          borrowId,
          item.productId || null,
          item.name,
          item.quantity,
          item.remark || "",
        ],
      );
    }

    await connection.commit(); // ยืนยันการบันทึก
    res.status(201).json({ message: "บันทึกข้อมูลการยืมสำเร็จ", borrowId });
  } catch (error) {
    await connection.rollback(); // ยกเลิกถ้ามี error
    console.error("Error saving borrow record:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
  } finally {
    connection.release(); // คืน Connection กลับสู่ Pool
  }
});

// --- Borrow Approval Endpoints ---

// Get pending borrows
app.get("/api/borrows/pending", async (req, res) => {
  try {
    const [borrows] = await db.execute(`
      SELECT b.*, e.fname, e.lname, e.EMP_NUM, d.DepartmentName, i.InstitutionName
      FROM TB_T_Borrow b
      JOIN TB_T_Employee e ON b.EMPID = e.EMPID
      LEFT JOIN TB_M_Department d ON e.DepartmentID = d.DepartmentID
      LEFT JOIN TB_M_Institution i ON e.InstitutionID = i.InstitutionID
      WHERE b.Status = 'Pending'
      ORDER BY b.CreatedDate ASC
    `);

    // Fetch details for each borrow
    for (let borrow of borrows) {
      const [details] = await db.execute(
        "SELECT * FROM TB_T_BorrowDetail WHERE BorrowID = ?",
        [borrow.BorrowID],
      );
      borrow.items = details;
    }

    res.json(borrows);
  } catch (error) {
    console.error("Error fetching pending borrows:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

// Update borrow status (Approve/Reject)
app.put("/api/borrows/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved', 'Rejected', or 'Returned'

  if (!["Approved", "Rejected", "Returned"].includes(status)) {
    return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // ดึงสถานะปัจจุบันเพื่อตรวจสอบเงื่อนไขการตัด/คืนสต็อก
    const [currentRows] = await connection.execute(
      "SELECT Status FROM TB_T_Borrow WHERE BorrowID = ?",
      [id],
    );

    if (currentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "ไม่พบข้อมูลการยืม" });
    }

    const currentStatus = currentRows[0].Status;

    // 1. อัปเดตสถานะในตาราง TB_T_Borrow
    if (status === "Returned") {
      await connection.execute(
        "UPDATE TB_T_Borrow SET Status = ?, ActualReturnDate = NOW() WHERE BorrowID = ?",
        [status, id],
      );
    } else {
      await connection.execute(
        "UPDATE TB_T_Borrow SET Status = ? WHERE BorrowID = ?",
        [status, id],
      );
    }

    // 2. จัดการสต็อกสินค้า (Stock Management)
    // กรณีอนุมัติ (Approved): ตัดสต็อก (เฉพาะเมื่อเปลี่ยนจาก Pending -> Approved)
    if (status === "Approved" && currentStatus === "Pending") {
      const [items] = await connection.execute(
        "SELECT ProductID, Quantity FROM TB_T_BorrowDetail WHERE BorrowID = ?",
        [id],
      );

      for (const item of items) {
        if (item.ProductID) {
          // ตรวจสอบจำนวนสินค้าคงเหลือและ Lock แถวไว้เพื่อป้องกัน Race Condition
          const [products] = await connection.execute(
            "SELECT Quantity, ProductName FROM TB_M_Product WHERE ProductID = ? FOR UPDATE",
            [item.ProductID],
          );

          if (products.length > 0) {
            if (products[0].Quantity < item.Quantity) {
              throw new Error(
                `สินค้า "${products[0].ProductName}" ในสต็อกไม่เพียงพอ (คงเหลือ ${products[0].Quantity})`,
              );
            }

            await connection.execute(
              "UPDATE TB_M_Product SET Quantity = Quantity - ? WHERE ProductID = ?",
              [item.Quantity, item.ProductID],
            );
          }
        }
      }
    }
    // กรณีคืนอุปกรณ์ (Returned): เพิ่มสต็อกกลับ (เฉพาะเมื่อเปลี่ยนจาก Approved -> Returned)
    else if (status === "Returned" && currentStatus === "Approved") {
      const [items] = await connection.execute(
        "SELECT ProductID, Quantity FROM TB_T_BorrowDetail WHERE BorrowID = ?",
        [id],
      );

      for (const item of items) {
        if (item.ProductID) {
          await connection.execute(
            "UPDATE TB_M_Product SET Quantity = Quantity + ? WHERE ProductID = ?",
            [item.Quantity, item.ProductID],
          );
        }
      }
    }

    await connection.commit();
    res.json({ message: `อัปเดตสถานะเป็น ${status} เรียบร้อยแล้ว` });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating borrow status:", error);
    res
      .status(500)
      .json({ message: error.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
  } finally {
    connection.release();
  }
});

// Get borrow history for a specific user
app.get("/api/borrows/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [borrows] = await db.execute(
      `
      SELECT * FROM TB_T_Borrow
      WHERE EMPID = ?
      ORDER BY CreatedDate DESC
    `,
      [userId],
    );

    for (let borrow of borrows) {
      const [details] = await db.execute(
        "SELECT * FROM TB_T_BorrowDetail WHERE BorrowID = ?",
        [borrow.BorrowID],
      );
      borrow.items = details;
    }

    res.json(borrows);
  } catch (error) {
    console.error("Error fetching user history:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ" });
  }
});

// --- User Management Endpoints ---

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT e.EMPID, e.fname, e.lname, e.username, e.email, e.phone, e.EMP_NUM,
             r.RoleName, s.StatusName, d.DepartmentName, i.InstitutionName,
             e.RoleID, e.EMPStatusID
      FROM TB_T_Employee e
      LEFT JOIN TB_M_Role r ON e.RoleID = r.RoleID
      LEFT JOIN TB_M_StatusEMP s ON e.EMPStatusID = s.EMPStatusID
      LEFT JOIN TB_M_Department d ON e.DepartmentID = d.DepartmentID
      LEFT JOIN TB_M_Institution i ON e.InstitutionID = i.InstitutionID
      ORDER BY e.EMPID DESC
    `);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก" });
  }
});

// Update user role/status
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { roleId, statusId } = req.body;
  try {
    await db.execute(
      "UPDATE TB_T_Employee SET RoleID = ?, EMPStatusID = ? WHERE EMPID = ?",
      [roleId, statusId, id],
    );
    res.json({ message: "อัปเดตข้อมูลสมาชิกสำเร็จ" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
  }
});

// Delete user
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM TB_T_Employee WHERE EMPID = ?", [id]);
    res.json({ message: "ลบสมาชิกสำเร็จ" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบสมาชิก" });
  }
});

// --- Profile Management Endpoints ---

// Update user profile
app.put("/api/profile/:id", async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, profileImage } = req.body;

  try {
    // Check if email already exists for another user
    const [existing] = await db.execute(
      "SELECT * FROM TB_T_Employee WHERE email = ? AND EMPID != ?",
      [email, id],
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    let query =
      "UPDATE TB_T_Employee SET fname=?, lname=?, email=?, phone=? WHERE EMPID=?";
    let params = [firstName, lastName, email, phone, id];

    if (profileImage) {
      query =
        "UPDATE TB_T_Employee SET fname=?, lname=?, email=?, phone=?, image=? WHERE EMPID=?";
      params = [firstName, lastName, email, phone, profileImage, id];
    }

    await db.execute(query, params);

    // Fetch updated user to return
    const [updatedUsers] = await db.execute(
      `SELECT e.*, r.RoleName 
       FROM TB_T_Employee e 
       LEFT JOIN TB_M_Role r ON e.RoleID = r.RoleID 
       WHERE e.EMPID = ?`,
      [id],
    );
    const updatedUser = updatedUsers[0];

    res.json({
      message: "อัปเดตข้อมูลส่วนตัวสำเร็จ",
      user: {
        id: updatedUser.EMPID,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.fname,
        lastName: updatedUser.lname,
        employeeId: updatedUser.EMP_NUM,
        phone: updatedUser.phone,
        role: updatedUser.RoleName,
        roleId: updatedUser.RoleID,
        institutionId: updatedUser.InstitutionID,
        departmentId: updatedUser.DepartmentID,
        empStatusId: updatedUser.EMPStatusID,
        profileImage: updatedUser.image,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
  }
});

// Change password
app.put("/api/profile/:id/password", async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    const [users] = await db.execute(
      "SELECT * FROM TB_T_Employee WHERE EMPID = ?",
      [id],
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.execute("UPDATE TB_T_Employee SET password = ? WHERE EMPID = ?", [
      hashedPassword,
      id,
    ]);

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" });
  }
});

// --- Product Management Endpoints ---

// CRUD Endpoints for Product Category Management
app.get("/api/product-categories", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM TB_M_ProductCategory");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" });
  }
});

app.post("/api/product-categories", async (req, res) => {
  const { CategoryName } = req.body;
  if (!CategoryName)
    return res.status(400).json({ message: "กรุณากรอกชื่อหมวดหมู่" });
  try {
    // ตรวจสอบว่ามีหมวดหมู่นี้อยู่แล้วหรือไม่
    const [existing] = await db.execute(
      "SELECT * FROM TB_M_ProductCategory WHERE CategoryName = ?",
      [CategoryName],
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "มีหมวดหมู่นี้อยู่ในระบบแล้ว" });
    }

    const [result] = await db.execute(
      "INSERT INTO TB_M_ProductCategory (CategoryName) VALUES (?)",
      [CategoryName],
    );
    res.status(201).json({ CategoryID: result.insertId, CategoryName });
  } catch (error) {
    console.error("Error creating product category:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างข้อมูล" });
  }
});

app.put("/api/product-categories/:id", async (req, res) => {
  const { id } = req.params;
  const { CategoryName } = req.body;
  if (!CategoryName)
    return res.status(400).json({ message: "กรุณากรอกชื่อหมวดหมู่" });
  try {
    await db.execute(
      "UPDATE TB_M_ProductCategory SET CategoryName = ? WHERE CategoryID = ?",
      [CategoryName, id],
    );
    res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error updating product category:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
  }
});

app.delete("/api/product-categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM TB_M_ProductCategory WHERE CategoryID = ?", [
      id,
    ]);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product category:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const [products] = await db.execute(
      "SELECT p.*, c.CategoryName FROM TB_M_Product p LEFT JOIN TB_M_ProductCategory c ON p.CategoryID = c.CategoryID ORDER BY p.CreatedDate DESC",
    );
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" });
  }
});

// Create product
app.post("/api/products", async (req, res) => {
  const {
    ProductName,
    ProductCode,
    Price,
    Quantity,
    Description,
    Image,
    CategoryID,
  } = req.body;
  if (!ProductName || !ProductCode) {
    return res.status(400).json({ message: "กรุณากรอกชื่อและรหัสสินค้า" });
  }
  try {
    const [result] = await db.execute(
      "INSERT INTO TB_M_Product (ProductName, ProductCode, Price, Quantity, Description, Image, CategoryID) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        ProductName,
        ProductCode,
        Price || 0,
        Quantity || 0,
        Description || "",
        Image || "",
        CategoryID || null,
      ],
    );
    res
      .status(201)
      .json({ message: "เพิ่มสินค้าสำเร็จ", productId: result.insertId });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มสินค้า" });
  }
});

// Update product
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const {
    ProductName,
    ProductCode,
    Price,
    Quantity,
    Description,
    Image,
    CategoryID,
  } = req.body;

  try {
    await db.execute(
      "UPDATE TB_M_Product SET ProductName=?, ProductCode=?, Price=?, Quantity=?, Description=?, Image=?, CategoryID=? WHERE ProductID=?",
      [
        ProductName,
        ProductCode,
        Price,
        Quantity,
        Description,
        Image,
        CategoryID,
        id,
      ],
    );
    res.json({ message: "แก้ไขข้อมูลสินค้าสำเร็จ" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขสินค้า" });
  }
});

// Delete product
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM TB_M_Product WHERE ProductID = ?", [id]);
    res.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบสินค้า" });
  }
});

// 404 Handler: ดักจับกรณีหา Route ไม่เจอ
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Route not found" });
});

// Only start the server if this file is run directly (not required as a module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
