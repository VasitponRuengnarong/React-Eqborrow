const express = require("express");
const mysql = require("mysql2/promise"); // Use the promise-based library
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
let multer;
let upload;
try {
  multer = require("multer"); // Require multer for file uploads
  upload = multer({ storage: multer.memoryStorage() }); // Configure storage
} catch (e) {
  console.warn(
    "Warning: 'multer' module not found. File upload functionality will be disabled.",
  );
  // Mock upload middleware to prevent crash
  upload = { single: () => (req, res, next) => next() };
}
let ExcelJS;
try {
  ExcelJS = require("exceljs"); // Import exceljs
} catch (e) {
  console.warn(
    "Warning: 'exceljs' module not found. Export functionality will be disabled.",
  );
}
const app = express();
const PORT = 8080;

// Database Connection Pool (more robust for web servers)
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "ebrs_system",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

db.getConnection()
  .then(async (connection) => {
    console.log("Connected to database: ebrs_system");

    // Auto-create TB_L_StockMovement table to prevent "Table doesn't exist" error
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_L_StockMovement (
        LogID INT AUTO_INCREMENT PRIMARY KEY,
        ProductID INT,
        MovementType ENUM('IN', 'OUT'),
        ChangeAmount INT,
        OldQuantity INT,
        NewQuantity INT,
        CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Auto-create TB_T_Favorite table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_T_Favorite (
        FavoriteID INT AUTO_INCREMENT PRIMARY KEY,
        EMPID INT NOT NULL,
        DVID INT NOT NULL,
        CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_fav (EMPID, DVID)
      )
    `);

    // Auto-add columns if they don't exist (Simple check)
    try {
      await connection.execute("SELECT Brand FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding Brand and DeviceType columns to TB_T_Device...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN Brand VARCHAR(100) DEFAULT NULL, ADD COLUMN DeviceType VARCHAR(100) DEFAULT NULL",
        );
      }
    }

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

// Middleware to verify JWT and attach user to request
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ message: "No token provided" });
  }

  // It's highly recommended to use environment variables for your secret
  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_default_secret",
    (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Token is not valid" });
      }
      req.user = user; // The user payload from the token { id, role }
      next();
    },
  );
};

// Middleware to authorize only 'Admin' role
const checkAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }
  next();
};

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
createMasterDataRoute(app, "categories", "TB_M_Category"); // เพิ่ม Route สำหรับดึงข้อมูลหมวดหมู่สินค้า
createMasterDataRoute(app, "device-statuses", "TB_M_StatusDevice"); // เพิ่ม Route สำหรับดึงข้อมูลสถานะอุปกรณ์

// CRUD Endpoints for Institution Management

// Create a new institution
app.post("/api/institutions", verifyToken, checkAdmin, async (req, res) => {
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
app.put("/api/institutions/:id", verifyToken, checkAdmin, async (req, res) => {
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
app.delete(
  "/api/institutions/:id",
  verifyToken,
  checkAdmin,
  async (req, res) => {
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
  },
);
// CRUD Endpoints for Department Management

// Create a new department
app.post("/api/departments", verifyToken, checkAdmin, async (req, res) => {
  const { DepartmentName } = req.body;
  if (!DepartmentName) {
    return res.status(400).json({ message: "กรุณากรอกชื่อฝ่าย" });
  }
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
// Update a department
app.put("/api/departments/:id", verifyToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { DepartmentName } = req.body;
  if (!DepartmentName) {
    return res.status(400).json({ message: "กรุณากรอกชื่อฝ่าย" });
  }
  try {
    const [result] = await db.execute(
      "UPDATE TB_M_Department SET DepartmentName = ? WHERE DepartmentID = ?",
      [DepartmentName, id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "ไม่พบข้อมูลฝ่ายที่ต้องการแก้ไข" });
    }
    res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
  }
});
// Delete a department
app.delete(
  "/api/departments/:id",
  verifyToken,
  checkAdmin,
  async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute("DELETE FROM TB_M_Department WHERE DepartmentID = ?", [
        id,
      ]);
      res.status(204).send(); // No Content
    } catch (error) {
      console.error("Error deleting department:", error);
      // Handle foreign key constraint error
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(400).json({
          message: "ไม่สามารถลบข้อมูลนี้ได้ เนื่องจากมีพนักงานใช้งานอยู่",
        });
      }
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
    }
  },
);
// CRUD Endpoints for Category Management

// Create a new category
app.post("/api/categories", verifyToken, checkAdmin, async (req, res) => {
  const { CategoryName } = req.body;
  if (!CategoryName) {
    return res.status(400).json({ message: "กรุณากรอกชื่อหมวดหมู่" });
  }
  try {
    const [result] = await db.execute(
      "INSERT INTO TB_M_Category (CategoryName) VALUES (?)",
      [CategoryName],
    );
    res.status(201).json({ CategoryID: result.insertId, CategoryName });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างข้อมูล" });
  }
});
// Update a category
app.put("/api/categories/:id", verifyToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { CategoryName } = req.body;
  if (!CategoryName) {
    return res.status(400).json({ message: "กรุณากรอกชื่อหมวดหมู่" });
  }
  try {
    const [result] = await db.execute(
      "UPDATE TB_M_Category SET CategoryName = ? WHERE CategoryID = ?",
      [CategoryName, id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "ไม่พบข้อมูลหมวดหมู่ที่ต้องการแก้ไข" });
    }
    res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
  }
});
// Delete a category
app.delete("/api/categories/:id", verifyToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM TB_M_Category WHERE CategoryID = ?", [id]);
    res.status(204).send(); // No Content
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
});

// CRUD Endpoints for Device Status Management (TB_M_StatusDevice)

// Create a new device status
app.post("/api/device-statuses", verifyToken, checkAdmin, async (req, res) => {
  const { StatusNameDV } = req.body;
  if (!StatusNameDV) {
    return res.status(400).json({ message: "กรุณากรอกชื่อสถานะ" });
  }
  try {
    const [result] = await db.execute(
      "INSERT INTO TB_M_StatusDevice (StatusNameDV) VALUES (?)",
      [StatusNameDV],
    );
    res.status(201).json({ DVStatusID: result.insertId, StatusNameDV });
  } catch (error) {
    console.error("Error creating device status:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างข้อมูล" });
  }
});

// Update a device status
app.put(
  "/api/device-statuses/:id",
  verifyToken,
  checkAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { StatusNameDV } = req.body;
    if (!StatusNameDV) {
      return res.status(400).json({ message: "กรุณากรอกชื่อสถานะ" });
    }
    try {
      const [result] = await db.execute(
        "UPDATE TB_M_StatusDevice SET StatusNameDV = ? WHERE DVStatusID = ?",
        [StatusNameDV, id],
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
      }
      res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
    } catch (error) {
      console.error("Error updating device status:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
    }
  },
);

// Delete a device status
app.delete(
  "/api/device-statuses/:id",
  verifyToken,
  checkAdmin,
  async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute("DELETE FROM TB_M_StatusDevice WHERE DVStatusID = ?", [
        id,
      ]);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting device status:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
    }
  },
);

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

    // Auto-assign role based on employee ID pattern
    // Force assign 'User' role (3) for all public registrations
    const finalRoleId = 3;

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
      finalRoleId,
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

    // Create JWT
    const userPayload = {
      id: newUser.EMPID,
      role: newUser.RoleName,
    };
    const accessToken = jwt.sign(
      userPayload,
      process.env.JWT_SECRET || "your_default_secret",
      { expiresIn: "1d" }, // Token expires in 1 day
    );

    console.log("Registered user:", { username, email });
    res.status(201).json({
      // Send token to the client
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
      accessToken,
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

    // Create and sign a JWT
    const userPayload = {
      id: employee.EMPID,
      role: employee.RoleName,
    };
    const accessToken = jwt.sign(
      userPayload,
      process.env.JWT_SECRET || "your_default_secret",
      { expiresIn: "1d" }, // Token expires in 1 day
    );

    res.json({
      message: "เข้าสู่ระบบสำเร็จ", // Send token to the client
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
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// Dashboard Stats Endpoint
app.get("/api/dashboard/stats", verifyToken, checkAdmin, async (req, res) => {
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

    // Category stats for pie chart
    const [categoryData] = await db.execute(`
      SELECT c.CategoryName as name, COUNT(d.DVID) as value 
      FROM TB_T_Device d
      LEFT JOIN TB_M_Category c ON d.CategoryID = c.CategoryID
      GROUP BY c.CategoryName
    `);

    res.json({
      totalUsers: users[0].count,
      totalBorrows: borrows[0].count,
      pendingRequest: pending[0].count,
      returnedItems: returned[0].count,
      monthlyStats: monthly,
      statusStats: statusData,
      categoryStats: categoryData,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard" });
  }
});

// --- NEW: Refactored Admin Dashboard Stats ---
app.get(
  "/api/dashboard/admin-stats",
  verifyToken,
  checkAdmin,
  async (req, res) => {
    try {
      // 1. Total Assets
      const [assets] = await db.execute(
        "SELECT COUNT(*) as count FROM TB_T_Device",
      );

      // 2. Currently Borrowed (Status 'ถูกยืม')
      const [borrowed] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM TB_T_Device d 
      JOIN TB_M_StatusDevice s ON d.DVStatusID = s.DVStatusID 
      WHERE s.StatusNameDV = 'ถูกยืม'
    `);

      // 3. Pending Approval
      const [pending] = await db.execute(
        "SELECT COUNT(*) as count FROM TB_T_Borrow WHERE Status = 'Pending'",
      );

      // 4. Overdue (Status Approved AND ReturnDate < Today)
      const [overdue] = await db.execute(
        "SELECT COUNT(*) as count FROM TB_T_Borrow WHERE Status = 'Approved' AND ReturnDate < CURDATE()",
      );

      // 5. Recent Activity (Limit 10)
      const [recent] = await db.execute(`
      SELECT b.BorrowID, b.Status, b.CreatedDate, 
             e.fname, e.lname, 
             GROUP_CONCAT(bd.ItemName SEPARATOR ', ') as EquipmentName
      FROM TB_T_Borrow b
      JOIN TB_T_Employee e ON b.EMPID = e.EMPID
      JOIN TB_T_BorrowDetail bd ON b.BorrowID = bd.BorrowID
      GROUP BY b.BorrowID
      ORDER BY b.CreatedDate DESC
      LIMIT 10
    `);

      // 6. Pie Chart Data (Available vs Borrowed)
      const [pieData] = await db.execute(`
      SELECT s.StatusNameDV as name, COUNT(*) as value
      FROM TB_T_Device d
      JOIN TB_M_StatusDevice s ON d.DVStatusID = s.DVStatusID
      WHERE s.StatusNameDV IN ('ว่าง', 'ถูกยืม')
      GROUP BY s.StatusNameDV
    `);

      res.json({
        totalAssets: assets[0].count,
        currentlyBorrowed: borrowed[0].count,
        pendingApproval: pending[0].count,
        overdue: overdue[0].count,
        recentActivity: recent,
        pieChartData: pieData,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Error fetching admin dashboard data" });
    }
  },
);

// --- NEW: Refactored User Dashboard Stats ---
app.get("/api/dashboard/user-stats", verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // 1. Items on Hand (Sum of quantities in Approved borrows)
    const [onHand] = await db.execute(
      `
      SELECT SUM(bd.Quantity) as count 
      FROM TB_T_Borrow b 
      JOIN TB_T_BorrowDetail bd ON b.BorrowID = bd.BorrowID 
      WHERE b.EMPID = ? AND b.Status = 'Approved'
    `,
      [userId],
    );

    // 2. Due Soon (Approved AND ReturnDate within 24 hours from now AND ReturnDate >= now)
    const [dueSoon] = await db.execute(
      `
      SELECT COUNT(*) as count 
      FROM TB_T_Borrow 
      WHERE EMPID = ? AND Status = 'Approved' 
      AND ReturnDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 DAY)
    `,
      [userId],
    );

    // 3. Pending Requests
    const [pending] = await db.execute(
      "SELECT COUNT(*) as count FROM TB_T_Borrow WHERE EMPID = ? AND Status = 'Pending'",
      [userId],
    );

    // 4. Current Loans List
    const [currentLoans] = await db.execute(
      `
      SELECT b.BorrowID, b.BorrowDate, b.ReturnDate, b.Status,
             bd.ItemName, bd.Quantity,
             d.stickerid as AssetCode, d.sticker as Image
      FROM TB_T_Borrow b
      JOIN TB_T_BorrowDetail bd ON b.BorrowID = bd.BorrowID
      LEFT JOIN TB_T_Device d ON bd.ItemName = d.devicename COLLATE utf8mb4_unicode_ci
      WHERE b.EMPID = ? AND b.Status = 'Approved'
      ORDER BY b.ReturnDate ASC
    `,
      [userId],
    );

    // 5. History (Returned)
    const [history] = await db.execute(
      `
      SELECT b.BorrowID, b.ReturnDate, bd.ItemName, bd.Quantity
      FROM TB_T_Borrow b
      JOIN TB_T_BorrowDetail bd ON b.BorrowID = bd.BorrowID
      WHERE b.EMPID = ? AND b.Status = 'Returned'
      ORDER BY b.ReturnDate DESC
      LIMIT 10
    `,
      [userId],
    );

    res.json({
      itemsOnHand: onHand[0].count || 0,
      dueSoon: dueSoon[0].count,
      pendingRequests: pending[0].count,
      currentLoans,
      history,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Error fetching user dashboard data" });
  }
});

// --- Notifications Endpoints ---

// Get low stock notifications (Admin only)
app.get(
  "/api/notifications/low-stock",
  verifyToken,
  checkAdmin,
  async (req, res) => {
    try {
      const threshold = 5; // Alert if available items are less than 5
      const [rows] = await db.execute(
        `
      SELECT d.devicename as ProductName, 
             SUM(CASE WHEN s.StatusNameDV = 'ว่าง' THEN 1 ELSE 0 END) as AvailableCount
      FROM TB_T_Device d
      JOIN TB_M_StatusDevice s ON d.DVStatusID = s.DVStatusID
      GROUP BY d.devicename
      HAVING AvailableCount < ?
      ORDER BY AvailableCount ASC
    `,
        [threshold],
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching low stock:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  },
);

// API สำหรับบันทึกการยืมครุภัณฑ์
app.post("/api/borrow", verifyToken, async (req, res) => {
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
    res
      .status(500)
      .json({ message: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
  } finally {
    connection.release(); // คืน Connection กลับสู่ Pool
  }
});

// --- Borrow Approval Endpoints ---

// Get pending borrows
app.get("/api/borrows/pending", verifyToken, checkAdmin, async (req, res) => {
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
app.put(
  "/api/borrows/:id/status",
  verifyToken,
  checkAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { status, items: returnedItems } = req.body; // 'Approved', 'Rejected', 'Returned' and optional items array
    const adminId = req.user.id; // ดึง ID ของ Admin ผู้ทำรายการ

    if (!["Approved", "Rejected", "Returned"].includes(status)) {
      return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // ตรวจสอบสถานะเดิมก่อน
      const [currentBorrow] = await connection.execute(
        "SELECT Status FROM TB_T_Borrow WHERE BorrowID = ?",
        [id],
      );

      if (currentBorrow.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "ไม่พบข้อมูลการยืม" });
      }

      const oldStatus = currentBorrow[0].Status;

      // อัปเดตสถานะ
      await connection.execute(
        "UPDATE TB_T_Borrow SET Status = ? WHERE BorrowID = ?",
        [status, id],
      );

      // --- บันทึก Log การทำงาน (อนุมัติ/ปฏิเสธ/คืนของ) ---
      await connection.execute(
        "INSERT INTO TB_L_ActivityLog (ActionType, BorrowID, ActorID, Details) VALUES (?, ?, ?, ?)",
        [status, id, adminId, `Admin updated status to ${status}`],
      );

      // คืนสต็อกสินค้าเมื่อสถานะเปลี่ยนเป็น Returned (และป้องกันการคืนซ้ำ)
      // This logic now supports partial returns.
      if (status === "Returned" && oldStatus !== "Returned") {
      }

      await connection.commit();
      res.json({ message: `อัปเดตสถานะเป็น ${status} เรียบร้อยแล้ว` });
    } catch (error) {
      await connection.rollback();
      console.error("Error updating borrow status:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    } finally {
      connection.release();
    }
  },
);

// Get borrow history for a specific user
app.get("/api/borrows/user/:userId", verifyToken, async (req, res) => {
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

// API ดึงรายการยืม-คืนทั้งหมด (Admin เห็นทั้งหมด, User เห็นแค่ของตัวเอง)
app.get("/api/borrows", verifyToken, async (req, res) => {
  try {
    let query = `
      SELECT b.*, e.fname, e.lname, e.EMP_NUM, d.DepartmentName, i.InstitutionName
      FROM TB_T_Borrow b
      JOIN TB_T_Employee e ON b.EMPID = e.EMPID
      LEFT JOIN TB_M_Department d ON e.DepartmentID = d.DepartmentID
      LEFT JOIN TB_M_Institution i ON e.InstitutionID = i.InstitutionID
    `;
    const params = [];

    // ถ้าไม่ใช่ Admin ให้ดึงเฉพาะของตัวเอง
    if (req.user.role !== "Admin") {
      query += ` WHERE b.EMPID = ?`;
      params.push(req.user.id);
    }

    query += ` ORDER BY b.CreatedDate DESC`;

    const [borrows] = await db.execute(query, params);

    // ดึงรายละเอียดอุปกรณ์ของแต่ละรายการ
    for (let borrow of borrows) {
      const [details] = await db.execute(
        `
        SELECT bd.*, d.stickerid as ProductCode, d.sticker as Image
        FROM TB_T_BorrowDetail bd
        LEFT JOIN TB_T_Device d ON bd.ItemName = d.devicename COLLATE utf8mb4_unicode_ci
        WHERE bd.BorrowID = ?
        `,
        [borrow.BorrowID],
      );
      borrow.items = details;
    }

    res.json(borrows);
  } catch (error) {
    console.error("Error fetching borrows:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

// API Export ประวัติการยืมเป็น Excel (เฉพาะ Admin)
app.get("/api/borrows/export", verifyToken, checkAdmin, async (req, res) => {
  if (!ExcelJS) {
    return res.status(500).json({
      message: "ระบบยังไม่ได้ติดตั้ง Library สำหรับสร้างไฟล์ Excel (exceljs)",
    });
  }

  try {
    // ดึงข้อมูลเหมือนกับ API /api/borrows แต่ดึงทั้งหมด
    const [borrows] = await db.execute(`
      SELECT b.*, e.fname, e.lname, e.EMP_NUM, d.DepartmentName, i.InstitutionName
      FROM TB_T_Borrow b
      JOIN TB_T_Employee e ON b.EMPID = e.EMPID
      LEFT JOIN TB_M_Department d ON e.DepartmentID = d.DepartmentID
      LEFT JOIN TB_M_Institution i ON e.InstitutionID = i.InstitutionID
      ORDER BY b.CreatedDate DESC
    `);

    // ดึงรายละเอียดอุปกรณ์
    for (let borrow of borrows) {
      const [details] = await db.execute(
        "SELECT * FROM TB_T_BorrowDetail WHERE BorrowID = ?",
        [borrow.BorrowID],
      );
      borrow.items = details;
    }

    // สร้าง Workbook และ Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Borrow History");

    // กำหนดหัวคอลัมน์
    worksheet.columns = [
      { header: "ID", key: "BorrowID", width: 10 },
      { header: "วันที่ทำรายการ", key: "CreatedDate", width: 20 },
      { header: "ผู้ยืม", key: "Borrower", width: 30 },
      { header: "รหัสพนักงาน", key: "EMP_NUM", width: 15 },
      { header: "แผนก/สำนัก", key: "Department", width: 30 },
      { header: "วันที่ยืม", key: "BorrowDate", width: 15 },
      { header: "วันที่คืน", key: "ReturnDate", width: 15 },
      { header: "วัตถุประสงค์", key: "Purpose", width: 30 },
      { header: "สถานะ", key: "Status", width: 15 },
      { header: "รายการอุปกรณ์", key: "Items", width: 50 },
    ];

    // เพิ่มข้อมูลลงในแถว
    borrows.forEach((b) => {
      const itemsString = b.items
        .map((i) => `${i.ItemName} (x${i.Quantity})`)
        .join(", ");
      worksheet.addRow({
        BorrowID: b.BorrowID,
        CreatedDate: new Date(b.CreatedDate).toLocaleDateString("th-TH"),
        Borrower: `${b.fname} ${b.lname}`,
        EMP_NUM: b.EMP_NUM,
        Department: `${b.DepartmentName || "-"} / ${b.InstitutionName || "-"}`,
        BorrowDate: new Date(b.BorrowDate).toLocaleDateString("th-TH"),
        ReturnDate: new Date(b.ReturnDate).toLocaleDateString("th-TH"),
        Purpose: b.Purpose,
        Status: b.Status,
        Items: itemsString,
      });
    });

    // ตั้งค่า Header สำหรับการดาวน์โหลดไฟล์
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=borrow_history.xlsx",
    );

    // เขียนไฟล์ส่งกลับไป
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการ Export ข้อมูล" });
  }
});

// API ยกเลิกคำขอ (ทำได้เฉพาะเจ้าของ หรือ Admin และต้องสถานะ Pending เท่านั้น)
app.put("/api/borrows/:id/cancel", verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const [borrow] = await db.execute(
      "SELECT * FROM TB_T_Borrow WHERE BorrowID = ?",
      [id],
    );
    if (borrow.length === 0)
      return res.status(404).json({ message: "ไม่พบรายการยืม" });

    const record = borrow[0];
    if (userRole !== "Admin" && record.EMPID !== userId)
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์ยกเลิกรายการนี้" });
    if (record.Status !== "Pending")
      return res
        .status(400)
        .json({ message: "ไม่สามารถยกเลิกรายการที่ดำเนินการไปแล้วได้" });

    await db.execute(
      "UPDATE TB_T_Borrow SET Status = 'Cancelled' WHERE BorrowID = ?",
      [id],
    );

    // --- บันทึก Log การยกเลิกโดย User ---
    await db.execute(
      "INSERT INTO TB_L_ActivityLog (ActionType, BorrowID, ActorID, Details) VALUES (?, ?, ?, ?)",
      ["Cancelled", id, userId, "User cancelled the request"],
    );
    res.json({ message: "ยกเลิกรายการสำเร็จ" });
  } catch (error) {
    console.error("Error cancelling borrow:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการยกเลิกรายการ" });
  }
});

// --- Activity Log Endpoint ---

// Log access denied attempt
app.post("/api/logs/access-denied", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { path } = req.body;
  try {
    await db.execute(
      "INSERT INTO TB_L_ActivityLog (ActionType, BorrowID, ActorID, Details) VALUES (?, NULL, ?, ?)",
      ["AccessDenied", userId, `Access denied for path: ${path || "Unknown"}`],
    );
    res.json({ message: "Access denied logged" });
  } catch (error) {
    console.error("Error logging access denied:", error);
    res.status(500).json({ message: "Error logging access denied" });
  }
});

// Get all activity logs (Admin only)
app.get("/api/logs", verifyToken, checkAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 500;
    const [logs] = await db.query(
      `
      SELECT 
        l.LogID, l.ActionType, l.BorrowID, l.Details, l.CreatedDate,
        e.fname as ActorFirstName, e.lname as ActorLastName
      FROM TB_L_ActivityLog l
      JOIN TB_T_Employee e ON l.ActorID = e.EMPID
      ORDER BY l.CreatedDate DESC
      LIMIT ?`,
      [limit],
    );
    res.json(logs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการทำงาน" });
  }
});

// --- User Management Endpoints ---

// Get all users
app.get("/api/users", verifyToken, checkAdmin, async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT e.EMPID, e.fname, e.lname, e.username, e.email, e.phone, e.EMP_NUM,
             r.RoleName, s.StatusName, d.DepartmentName, i.InstitutionName, e.DepartmentID,
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
app.put("/api/users/:id", verifyToken, checkAdmin, async (req, res) => {
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
app.delete("/api/users/:id", verifyToken, checkAdmin, async (req, res) => {
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
app.put("/api/profile/:id", verifyToken, async (req, res) => {
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
app.put("/api/profile/:id/password", verifyToken, async (req, res) => {
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
      `SELECT d.DVID as ProductID, d.devicename as ProductName, d.stickerid as ProductCode, 
              d.sticker as Image, d.Brand, d.DeviceType,
              d.CategoryID, c.CategoryName, 
              d.DVStatusID as StatusID, s.StatusNameDV
       FROM TB_T_Device d 
       LEFT JOIN TB_M_Category c ON d.CategoryID = c.CategoryID 
       LEFT JOIN TB_M_StatusDevice s ON d.DVStatusID = s.DVStatusID
       ORDER BY d.DVID DESC`,
    );
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" });
  }
});

// Create product
app.post("/api/products", verifyToken, checkAdmin, async (req, res) => {
  const {
    ProductName,
    ProductCode,
    CategoryID,
    StatusID,
    Image,
    Brand,
    DeviceType,
  } = req.body;

  if (!ProductName || !ProductCode || !CategoryID || !StatusID) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO TB_T_Device (devicename, stickerid, CategoryID, DVStatusID, sticker, Brand, DeviceType) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        ProductName,
        ProductCode,
        CategoryID,
        StatusID,
        Image || null,
        Brand || null,
        DeviceType || null,
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
app.put("/api/products/:id", verifyToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    ProductName,
    ProductCode,
    CategoryID,
    StatusID,
    Image,
    Brand,
    DeviceType,
  } = req.body;

  try {
    let query =
      "UPDATE TB_T_Device SET devicename=?, stickerid=?, CategoryID=?, DVStatusID=?, Brand=?, DeviceType=?";
    let params = [
      ProductName,
      ProductCode,
      CategoryID,
      StatusID,
      Brand || null,
      DeviceType || null,
    ];

    if (Image !== undefined) {
      query += ", sticker=?";
      params.push(Image);
    }

    query += " WHERE DVID=?";
    params.push(id);

    await db.execute(query, params);

    res.json({ message: "แก้ไขข้อมูลสินค้าสำเร็จ" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขสินค้า" });
  }
});

// Delete product
app.delete("/api/products/:id", verifyToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM TB_T_Device WHERE DVID = ?", [id]);
    res.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบสินค้า" });
  }
});

// --- Favorites Endpoints ---

// Get user favorites
app.get("/api/favorites", verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.execute(
      "SELECT DVID as ProductID FROM TB_T_Favorite WHERE EMPID = ?",
      [userId],
    );
    res.json(rows.map((row) => row.ProductID));
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Error fetching favorites" });
  }
});

// Add to favorites
app.post("/api/favorites", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;
  try {
    await db.execute(
      "INSERT IGNORE INTO TB_T_Favorite (EMPID, DVID) VALUES (?, ?)",
      [userId, productId],
    );
    res.json({ message: "Added to favorites" });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ message: "Error adding favorite" });
  }
});

// Remove from favorites
app.delete("/api/favorites/:productId", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  try {
    await db.execute("DELETE FROM TB_T_Favorite WHERE EMPID = ? AND DVID = ?", [
      userId,
      productId,
    ]);
    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ message: "Error removing favorite" });
  }
});

// API Import Products from Excel (Admin only)
app.post(
  "/api/products/import",
  verifyToken,
  checkAdmin,
  upload.single("file"),
  async (req, res) => {
    if (!multer) {
      return res
        .status(500)
        .json({ message: "Multer module is not installed." });
    }
    if (!ExcelJS) {
      return res
        .status(500)
        .json({ message: "ExcelJS module is not installed." });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Load Master Data for Mapping (Name -> ID)
      const [categories] = await connection.execute(
        "SELECT CategoryID, CategoryName FROM TB_M_Category",
      );
      const [statuses] = await connection.execute(
        "SELECT DVStatusID, StatusNameDV FROM TB_M_StatusDevice",
      );

      const categoryMap = new Map(
        categories.map((c) => [
          c.CategoryName.toLowerCase().trim(),
          c.CategoryID,
        ]),
      );
      const statusMap = new Map(
        statuses.map((s) => [
          s.StatusNameDV.toLowerCase().trim(),
          s.DVStatusID,
        ]),
      );

      // 2. Parse Excel File
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1); // Get first sheet

      let successCount = 0;
      let errors = [];

      // Iterate rows (starting from row 2 to skip header)
      // Expected Columns: ProductName | ProductCode | CategoryName | StatusName
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const productName = row.getCell(1).value
          ? row.getCell(1).value.toString().trim()
          : null;
        const productCode = row.getCell(2).value
          ? row.getCell(2).value.toString().trim()
          : null;
        const categoryName = row.getCell(3).value
          ? row.getCell(3).value.toString().trim()
          : null;
        const statusName = row.getCell(4).value
          ? row.getCell(4).value.toString().trim()
          : null;
        // Optional: Brand (Col 5), Type (Col 6)

        if (!productName || !productCode) {
          errors.push(`Row ${rowNumber}: Missing Name or Code`);
          return;
        }

        // Resolve IDs
        const categoryId = categoryName
          ? categoryMap.get(categoryName.toLowerCase())
          : null;
        const statusId = statusName
          ? statusMap.get(statusName.toLowerCase())
          : null;

        if (!categoryId) {
          errors.push(`Row ${rowNumber}: Category '${categoryName}' not found`);
          return;
        }
        if (!statusId) {
          errors.push(`Row ${rowNumber}: Status '${statusName}' not found`);
          return;
        }

        // We will execute inserts sequentially or push to a promise array.
        // For simplicity in transaction, we await here.
        // Note: In a real bulk scenario, you might want to construct a bulk INSERT query.
      });

      // Second pass for async operations (since eachRow is synchronous callback structure in some versions, but we need to await DB)
      // Better approach: iterate rows manually
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const productName = row.getCell(1).text?.trim();
        const productCode = row.getCell(2).text?.trim();
        const categoryName = row.getCell(3).text?.trim();
        const statusName = row.getCell(4).text?.trim();
        const brand = row.getCell(5).text?.trim() || null;
        const deviceType = row.getCell(6).text?.trim() || null;

        if (!productName || !productCode) continue;

        const categoryId = categoryMap.get(categoryName?.toLowerCase());
        const statusId = statusMap.get(statusName?.toLowerCase());

        if (categoryId && statusId) {
          await connection.execute(
            "INSERT INTO TB_T_Device (devicename, stickerid, CategoryID, DVStatusID, Brand, DeviceType) VALUES (?, ?, ?, ?, ?, ?)",
            [productName, productCode, categoryId, statusId, brand, deviceType],
          );
          successCount++;
        }
      }

      await connection.commit();
      res.json({ message: `Imported ${successCount} products successfully.` });
    } catch (error) {
      await connection.rollback();
      console.error("Import error:", error);
      res
        .status(500)
        .json({ message: "Error importing products: " + error.message });
    } finally {
      connection.release();
    }
  },
);

// --- Master Product Management Endpoints (TB_M_Product) ---
// Optional: For managing the master product list if needed separately from devices

// Get all master products
app.get("/api/master-products", async (req, res) => {
  try {
    const [products] = await db.execute(
      "SELECT * FROM TB_M_Product ORDER BY CreatedDate DESC",
    );
    res.json(products);
  } catch (error) {
    console.error("Error fetching master products:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าหลัก" });
  }
});

// Create master product
app.post("/api/master-products", verifyToken, checkAdmin, async (req, res) => {
  const { ProductName, ProductCode, Price, Quantity, Description, Image } =
    req.body;

  if (!ProductName) {
    return res.status(400).json({ message: "กรุณากรอกชื่อสินค้า" });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO TB_M_Product (ProductName, ProductCode, Price, Quantity, Description, Image) VALUES (?, ?, ?, ?, ?, ?)",
      [ProductName, ProductCode, Price, Quantity, Description, Image],
    );
    res
      .status(201)
      .json({ message: "เพิ่มสินค้าหลักสำเร็จ", productId: result.insertId });
  } catch (error) {
    console.error("Error creating master product:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มสินค้าหลัก" });
  }
});

// Delete master product
app.delete(
  "/api/master-products/:id",
  verifyToken,
  checkAdmin,
  async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute("DELETE FROM TB_M_Product WHERE ProductID = ?", [id]);
      res.json({ message: "ลบสินค้าหลักสำเร็จ" });
    } catch (error) {
      console.error("Error deleting master product:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบสินค้าหลัก" });
    }
  },
);

// Get stock movement logs (Requires TB_L_StockMovement table and Trigger)
app.get("/api/stock-movements", verifyToken, checkAdmin, async (req, res) => {
  try {
    const [logs] = await db.execute(`
      SELECT l.*, p.ProductName, p.ProductCode 
      FROM TB_L_StockMovement l
      LEFT JOIN TB_M_Product p ON l.ProductID = p.ProductID
      ORDER BY l.CreatedDate DESC
    `);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติสต็อก" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
