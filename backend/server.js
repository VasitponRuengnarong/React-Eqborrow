const express = require("express");
const mysql = require("mysql2/promise"); // Use the promise-based library
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

// Database Connection Pool (more robust for web servers)
const db = mysql.createPool({
  host: process.env.DB_HOST || "host.docker.internal",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ebrs_system",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection()
  .then((connection) => {
    console.log("Connected to database: ebrs_system");
    connection.release();
  })
  .catch((err) => {
    console.error("Error connecting to database:", err.stack);
  });

// Middleware to parse JSON bodies
app.use(express.json({ limit: "10mb" })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running and accessible" });
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

// Nodemailer Configuration
// IMPORTANT: Move these credentials to environment variables (.env file) for security
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email provider
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-email-password",
  },
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "กรุณากรอกอีเมล" });
  }

  try {
    // Check if employee exists by email in TB_T_Employee table
    const [employees] = await db.execute(
      "SELECT * FROM TB_T_Employee WHERE email = ?",
      [email],
    );
    if (employees.length === 0) {
      return res.status(404).json({ message: "ไม่พบอีเมลนี้ในระบบ" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    await db.execute(
      "UPDATE TB_T_Employee SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
      [token, expires, email],
    );

    const mailOptions = {
      from: "Eqborrow System <no-reply@eqborrow.com>",
      to: email,
      subject: "รีเซ็ตรหัสผ่าน Eqborrow",
      text: `คุณได้รับอีเมลนี้เนื่องจากมีการร้องขอรีเซ็ตรหัสผ่าน\n\nกรุณาคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:\n\nhttp://localhost:3000/reset-password/${token}\n\nหากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
  }

  try {
    const [users] = await db.execute(
      "SELECT * FROM TB_T_Employee WHERE reset_token = ? AND reset_token_expires > NOW()",
      [token],
    );

    if (users.length === 0) {
      return res
        .status(400)
        .json({ message: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ" });
    }

    const user = users[0];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.execute(
      "UPDATE TB_T_Employee SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE EMPID = ?",
      [hashedPassword, user.EMPID],
    );

    res.json({ message: "รีเซ็ตรหัสผ่านสำเร็จ คุณสามารถเข้าสู่ระบบได้ทันที" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

app.post("/api/register", async (req, res) => {
  const {
    firstName,
    lastName,
    employeeId, // This will map to EMP_NUM
    username,
    email,
    phone,
    roleId, // FK to TB_M_Role
    institutionId, // FK to TB_M_Institution
    departmentId, // FK to TB_M_Department
    empStatusId, // FK to TB_M_StatusEMP
    profileImage, // This will map to 'image'
    password,
  } = req.body;

  // Basic validation
  if (
    !username ||
    !email ||
    !password ||
    !firstName ||
    !lastName ||
    !employeeId ||
    !roleId || // Assuming RoleID is required for registration
    !institutionId || // Assuming InstitutionID is required
    !departmentId // Assuming DepartmentID is required
  ) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    // Check if username, email, or employeeId already exists in TB_T_Employee
    const [existingEmployees] = await db.execute(
      "SELECT * FROM TB_T_Employee WHERE username = ? OR email = ? OR EMP_NUM = ?",
      [username, email, employeeId],
    );

    if (existingEmployees.length > 0) {
      // Check which field caused the conflict
      if (existingEmployees.some((emp) => emp.username === username)) {
        return res.status(409).json({ message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" });
      }
      if (existingEmployees.some((emp) => emp.email === email)) {
        return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
      }
      if (existingEmployees.some((emp) => emp.EMP_NUM === employeeId)) {
        return res.status(409).json({ message: "รหัสพนักงานนี้ถูกใช้งานแล้ว" });
      }
      return res.status(409).json({
        message: "ข้อมูลบางส่วน (ชื่อผู้ใช้, อีเมล, รหัสพนักงาน) ถูกใช้งานแล้ว",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default EMPStatusID if not provided (e.g., 1 for 'Active')
    const finalEmpStatusId = empStatusId || 1;

    // Insert new employee into TB_T_Employee
    const insertQuery =
      "INSERT INTO TB_T_Employee (fname, lname, EMP_NUM, username, email, phone, RoleID, InstitutionID, DepartmentID, EMPStatusID, image, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const [result] = await db.execute(insertQuery, [
      firstName,
      lastName,
      employeeId,
      username,
      email,
      phone,
      roleId,
      institutionId,
      departmentId,
      finalEmpStatusId,
      profileImage, // 'image' column
      hashedPassword,
    ]);

    // Fetch the newly created user to return it (for auto-login)
    const [newUsers] = await db.execute(
      `SELECT e.*, r.RoleName 
       FROM TB_T_Employee e 
       LEFT JOIN TB_M_Role r ON e.RoleID = r.RoleID 
       WHERE e.EMPID = ?`,
      [result.insertId],
    );
    const newUser = newUsers[0];

    console.log("Registered user:", { username, email });
    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      user: {
        id: newUser.EMPID,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.fname,
        lastName: newUser.lname,
        employeeId: newUser.EMP_NUM,
        phone: newUser.phone,
        role: newUser.RoleName,
        roleId: newUser.RoleID,
        institutionId: newUser.InstitutionID,
        departmentId: newUser.DepartmentID,
        empStatusId: newUser.EMPStatusID,
        profileImage: newUser.image,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" });
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
    console.error("Login error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
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

    res.json({
      totalUsers: users[0].count,
      totalBorrows: borrows[0].count,
      pendingRequest: pending[0].count,
      returnedItems: returned[0].count,
      monthlyStats: monthly,
      statusStats: statusData,
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
        "INSERT INTO TB_T_BorrowDetail (BorrowID, ItemName, Quantity, Remark) VALUES (?, ?, ?, ?)",
        [borrowId, item.name, item.quantity, item.remark || ""],
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
  const { status } = req.body; // 'Approved' or 'Rejected'

  if (!["Approved", "Rejected", "Returned"].includes(status)) {
    return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
  }

  try {
    await db.execute("UPDATE TB_T_Borrow SET Status = ? WHERE BorrowID = ?", [
      status,
      id,
    ]);
    res.json({ message: `อัปเดตสถานะเป็น ${status} เรียบร้อยแล้ว` });
  } catch (error) {
    console.error("Error updating borrow status:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
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

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const [products] = await db.execute(
      "SELECT * FROM TB_M_Product ORDER BY CreatedDate DESC",
    );
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" });
  }
});

// Create product
app.post("/api/products", async (req, res) => {
  const { ProductName, ProductCode, Price, Quantity, Description, Image } =
    req.body;
  if (!ProductName || !ProductCode) {
    return res.status(400).json({ message: "กรุณากรอกชื่อและรหัสสินค้า" });
  }
  try {
    const [result] = await db.execute(
      "INSERT INTO TB_M_Product (ProductName, ProductCode, Price, Quantity, Description, Image) VALUES (?, ?, ?, ?, ?, ?)",
      [
        ProductName,
        ProductCode,
        Price || 0,
        Quantity || 0,
        Description || "",
        Image || "",
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
  const { ProductName, ProductCode, Price, Quantity, Description, Image } =
    req.body;

  try {
    await db.execute(
      "UPDATE TB_M_Product SET ProductName=?, ProductCode=?, Price=?, Quantity=?, Description=?, Image=? WHERE ProductID=?",
      [ProductName, ProductCode, Price, Quantity, Description, Image, id],
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
