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
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB for security
  });
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

// Security Middleware: Add basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff"); // Prevent MIME type sniffing
  res.setHeader("X-Frame-Options", "DENY"); // Prevent clickjacking
  next();
});

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

    // --- 1. Master Tables ---
    // Auto-create TB_M_Role
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_M_Role (
        RoleID INT AUTO_INCREMENT PRIMARY KEY,
        RoleName VARCHAR(50) NOT NULL
      )
    `);
    // Seed Roles
    await connection.execute(
      `INSERT IGNORE INTO TB_M_Role (RoleID, RoleName) VALUES (1, 'Admin'), (2, 'Staff'), (3, 'User'), (4, 'Manager')`,
    );

    // Auto-create TB_M_Institution
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_M_Institution (
        InstitutionID INT AUTO_INCREMENT PRIMARY KEY,
        InstitutionName VARCHAR(255) NOT NULL
      )
    `);

    // Auto-create TB_M_Department
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_M_Department (
        DepartmentID INT AUTO_INCREMENT PRIMARY KEY,
        DepartmentName VARCHAR(255) NOT NULL,
        InstitutionID INT,
        FOREIGN KEY (InstitutionID) REFERENCES TB_M_Institution(InstitutionID) ON DELETE SET NULL
      )
    `);

    // Auto-create TB_M_StatusEMP
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_M_StatusEMP (
        EMPStatusID INT AUTO_INCREMENT PRIMARY KEY,
        StatusName VARCHAR(50) NOT NULL
      )
    `);

    // Check specifically for StatusName column in TB_M_StatusEMP
    try {
      await connection.execute("SELECT StatusName FROM TB_M_StatusEMP LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding StatusName column to TB_M_StatusEMP...");
        await connection.execute(
          "ALTER TABLE TB_M_StatusEMP ADD COLUMN StatusName VARCHAR(50) NOT NULL DEFAULT 'Active'",
        );
      }
    }

    // Seed StatusEMP
    await connection.execute(
      `INSERT IGNORE INTO TB_M_StatusEMP (EMPStatusID, StatusName) VALUES (1, 'Active'), (2, 'Inactive')`,
    );

    // Auto-create TB_M_Category table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_M_Category (
        CategoryID INT AUTO_INCREMENT PRIMARY KEY,
        CategoryName VARCHAR(255) NOT NULL
      )
    `);

    // --- NEW: TB_M_Brand ---
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_M_Brand (
        BrandID INT AUTO_INCREMENT PRIMARY KEY,
        BrandName VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // --- NEW: TB_M_Type ---
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_M_Type (
        TypeID INT AUTO_INCREMENT PRIMARY KEY,
        TypeName VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // --- NEW: TB_M_Model ---
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_M_Model (
        ModelID INT AUTO_INCREMENT PRIMARY KEY,
        ModelName VARCHAR(100) NOT NULL,
        BrandID INT,
        FOREIGN KEY (BrandID) REFERENCES TB_M_Brand(BrandID) ON DELETE SET NULL
      )
    `);

    // --- NEW: TB_M_Product (Master) ---
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_M_Product (
        ProductID INT AUTO_INCREMENT PRIMARY KEY,
        ProductName VARCHAR(255) NOT NULL,
        ModelID INT,
        CategoryID INT,
        TypeID INT,
        Description TEXT,
        FOREIGN KEY (ModelID) REFERENCES TB_M_Model(ModelID) ON DELETE SET NULL,
        FOREIGN KEY (CategoryID) REFERENCES TB_M_Category(CategoryID) ON DELETE SET NULL,
        FOREIGN KEY (TypeID) REFERENCES TB_M_Type(TypeID) ON DELETE SET NULL
      )
    `);

    // Auto-create TB_M_StatusDevice table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_M_StatusDevice (
        DVStatusID INT AUTO_INCREMENT PRIMARY KEY,
        StatusNameDV VARCHAR(255) NOT NULL
      )
    `);
    // Seed StatusDevice
    await connection.execute(
      `INSERT IGNORE INTO TB_M_StatusDevice (DVStatusID, StatusNameDV) VALUES (1, 'ว่าง'), (2, 'ถูกยืม'), (3, 'ส่งซ่อม'), (4, 'ชำรุด'), (5, 'สูญหาย')`,
    );

    // --- 2. Transaction Tables ---
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

    // Auto-create TB_T_Employee
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_T_Employee (
        EMPID INT AUTO_INCREMENT PRIMARY KEY,
        fname VARCHAR(100),
        lname VARCHAR(100),
        EMP_NUM VARCHAR(50) UNIQUE,
        username VARCHAR(50) UNIQUE,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255),
        image LONGTEXT,
        RoleID INT,
        InstitutionID INT,
        DepartmentID INT,
        EMPStatusID INT,
        reset_token VARCHAR(255),
        reset_token_expires DATETIME,
        CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (RoleID) REFERENCES TB_M_Role(RoleID),
        FOREIGN KEY (InstitutionID) REFERENCES TB_M_Institution(InstitutionID) ON DELETE SET NULL,
        FOREIGN KEY (DepartmentID) REFERENCES TB_M_Department(DepartmentID) ON DELETE SET NULL,
        FOREIGN KEY (EMPStatusID) REFERENCES TB_M_StatusEMP(EMPStatusID)
      )
    `);

    // Auto-create TB_T_Borrow
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_T_Borrow (
        BorrowID INT AUTO_INCREMENT PRIMARY KEY,
        EMPID INT,
        BorrowDate DATE,
        ReturnDate DATE,
        Purpose TEXT,
        Status ENUM('Pending', 'Approved', 'Rejected', 'Returned', 'Cancelled') DEFAULT 'Pending',
        CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (EMPID) REFERENCES TB_T_Employee(EMPID)
      )
    `);

    // Auto-create TB_T_BorrowDetail
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_T_BorrowDetail (
        DetailID INT AUTO_INCREMENT PRIMARY KEY,
        BorrowID INT,
        ItemName VARCHAR(255),
        Quantity INT,
        Remark TEXT,
        FOREIGN KEY (BorrowID) REFERENCES TB_T_Borrow(BorrowID) ON DELETE CASCADE
      )
    `);

    // Auto-create TB_T_Device table (Replaces TB_M_Product)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_T_Device (
        DVID INT AUTO_INCREMENT PRIMARY KEY,
        DeviceName VARCHAR(255) NOT NULL,
        DeviceCode VARCHAR(100),
        SerialNumber VARCHAR(100),
        Price DECIMAL(10, 2),
        Quantity INT DEFAULT 0,
        Description TEXT,
        Image LONGTEXT,
        CategoryID INT,
        StatusID INT,
        BrandID INT,
        TypeID INT,
        Brand VARCHAR(100),
        DeviceType VARCHAR(100),
        CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (BrandID) REFERENCES TB_M_Brand(BrandID) ON DELETE SET NULL,
        FOREIGN KEY (TypeID) REFERENCES TB_M_Type(TypeID) ON DELETE SET NULL
      )
    `);

    // Auto-create TB_L_ActivityLog
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_L_ActivityLog (
        LogID INT AUTO_INCREMENT PRIMARY KEY,
        ActionType VARCHAR(50),
        BorrowID INT,
        ActorID INT,
        Details TEXT,
        CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Auto-add columns if they don't exist (Simple check)
    try {
      await connection.execute("SELECT Brand FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding columns to TB_T_Device...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN CategoryID INT",
        );
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN StatusID INT",
        );
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN Brand VARCHAR(100)",
        );
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN DeviceType VARCHAR(100)",
        );
      }
    }

    // Check specifically for DeviceCode column
    try {
      await connection.execute("SELECT DeviceCode FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding DeviceCode column to TB_T_Device...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN DeviceCode VARCHAR(100)",
        );
      }
    }

    // Check specifically for SerialNumber column
    try {
      await connection.execute("SELECT SerialNumber FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding SerialNumber column to TB_T_Device...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN SerialNumber VARCHAR(100)",
        );
      }
    }

    // Check specifically for Image column
    try {
      await connection.execute("SELECT Image FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding Image column to TB_T_Device...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN Image LONGTEXT",
        );
      }
    }

    // Check specifically for StatusID column
    try {
      await connection.execute("SELECT StatusID FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding StatusID column to TB_T_Device...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN StatusID INT",
        );
      }
    }

    // Check specifically for CategoryID column
    try {
      await connection.execute("SELECT CategoryID FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding CategoryID column to TB_T_Device...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN CategoryID INT",
        );
      }
    }

    // Check specifically for Price column
    try {
      await connection.execute("SELECT Price FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding Price column to TB_T_Device...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN Price DECIMAL(10, 2)",
        );
      }
    }

    // Check specifically for Quantity column
    try {
      await connection.execute("SELECT Quantity FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding Quantity column to TB_T_Device...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN Quantity INT DEFAULT 0",
        );
      }
    }

    // Check specifically for Description column
    try {
      await connection.execute("SELECT Description FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding Description column to TB_T_Device...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN Description TEXT",
        );
      }
    }

    // Check specifically for ModelID column in TB_M_Product
    try {
      await connection.execute("SELECT ModelID FROM TB_M_Product LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding ModelID column to TB_M_Product...");
        await connection.execute(
          "ALTER TABLE TB_M_Product ADD COLUMN ModelID INT",
        );
      }
    }

    // Check specifically for CategoryID column in TB_M_Product
    try {
      await connection.execute("SELECT CategoryID FROM TB_M_Product LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding CategoryID column to TB_M_Product...");
        await connection.execute(
          "ALTER TABLE TB_M_Product ADD COLUMN CategoryID INT",
        );
      }
    }

    // Check specifically for TypeID column in TB_M_Product
    try {
      await connection.execute("SELECT TypeID FROM TB_M_Product LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Adding TypeID column to TB_M_Product...");
        await connection.execute(
          "ALTER TABLE TB_M_Product ADD COLUMN TypeID INT",
        );
      }
    }

    const equipmentData = [
      {
        name: 'MacBook Pro 14" M3',
        category: 'Laptop',
        brand: 'Apple',
        type: 'แล็ปท็อป',
        desc: 'Apple M3 chip, 16GB RAM, 512GB SSD'
      },
      {
        name: 'Dell XPS 15',
        category: 'Laptop',
        brand: 'Dell',
        type: 'แล็ปท็อป',
        desc: 'Intel Core i9, 32GB RAM, 1TB SSD, RTX 4060'
      },
      {
        name: 'Sony A7 IV',
        category: 'Camera',
        brand: 'Sony',
        type: 'กล้อง Mirrorless',
        desc: '33MP Full-Frame Exmor R CMOS Sensor'
      },
      {
        name: 'Canon EOS R6',
        category: 'Camera',
        brand: 'Canon',
        type: 'กล้อง Mirrorless',
        desc: '20MP Full-Frame CMOS Sensor, 4K60p Video'
      },
      {
        name: 'Shure SM7B',
        category: 'Microphone',
        brand: 'Shure',
        type: 'ไมโครโฟน Condenser',
        desc: 'Vocal Microphone with Bass Roll-off and Mid-range Emphasis'
      }
    ];

    console.log("Seeding equipment data...");
    for (const item of equipmentData) {
      // 1. Category
      await connection.execute(
        "INSERT IGNORE INTO TB_M_Category (CategoryName) VALUES (?)",
        [item.category],
      );

      // 2. Brand
      await connection.execute(
        "INSERT IGNORE INTO TB_M_Brand (BrandName) VALUES (?)",
        [item.brand],
      );

      // 3. Type
      await connection.execute(
        "INSERT IGNORE INTO TB_M_Type (TypeName) VALUES (?)",
        [item.type],
      );

      // Get IDs
      const [catRes] = await connection.execute(
        "SELECT CategoryID FROM TB_M_Category WHERE CategoryName = ?",
        [item.category],
      );
      const [brandRes] = await connection.execute(
        "SELECT BrandID FROM TB_M_Brand WHERE BrandName = ?",
        [item.brand],
      );
      const [typeRes] = await connection.execute(
        "SELECT TypeID FROM TB_M_Type WHERE TypeName = ?",
        [item.type],
      );

      const catID = catRes[0].CategoryID;
      const brandID = brandRes[0].BrandID;
      const typeID = typeRes[0].TypeID;

      // 4. Device (Inventory) - TB_T_Device
      const [devExist] = await connection.execute(
        "SELECT DVID FROM TB_T_Device WHERE DeviceName = ?",
        [item.name],
      );
      if (devExist.length === 0) {
        const mockPrice = Math.floor(Math.random() * 50000) + 5000;
        const mockQty = Math.floor(Math.random() * 10) + 1;
        const deviceCode = `EQ-${catID}-${brandID}-${Math.floor(Math.random() * 1000)}`;
        const serialNum = `SN-${Math.floor(Math.random() * 1000000)}`;

        await connection.execute(
          `
            INSERT INTO TB_T_Device 
            (DeviceName, DeviceCode, SerialNumber, CategoryID, StatusID, BrandID, TypeID, Brand, DeviceType, Price, Quantity, Description) 
            VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.name,
            deviceCode,
            serialNum,
            catID,
            brandID,
            typeID,
            item.brand,
            item.type,
            mockPrice,
            mockQty,
            item.desc,
          ],
        );
      }
    }

    // --- Data Migration: Brand/DeviceType Text -> ID ---
    try {
      // Check if BrandID exists
      await connection.execute("SELECT BrandID FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Migrating Brand text to BrandID...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN BrandID INT",
        );
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD CONSTRAINT FK_Device_Brand FOREIGN KEY (BrandID) REFERENCES TB_M_Brand(BrandID) ON DELETE SET NULL",
        );

        // Populate Master
        await connection.execute(
          "INSERT IGNORE INTO TB_M_Brand (BrandName) SELECT DISTINCT Brand FROM TB_T_Device WHERE Brand IS NOT NULL AND Brand != ''",
        );
        // Update IDs
        await connection.execute(
          "UPDATE TB_T_Device d JOIN TB_M_Brand b ON d.Brand = b.BrandName SET d.BrandID = b.BrandID",
        );
      }
    }

    try {
      // Check if TypeID exists
      await connection.execute("SELECT TypeID FROM TB_T_Device LIMIT 1");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Migrating DeviceType text to TypeID...");
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD COLUMN TypeID INT",
        );
        await connection.execute(
          "ALTER TABLE TB_T_Device ADD CONSTRAINT FK_Device_Type FOREIGN KEY (TypeID) REFERENCES TB_M_Type(TypeID) ON DELETE SET NULL",
        );

        // Populate Master
        await connection.execute(
          "INSERT IGNORE INTO TB_M_Type (TypeName) SELECT DISTINCT DeviceType FROM TB_T_Device WHERE DeviceType IS NOT NULL AND DeviceType != ''",
        );
        // Update IDs
        await connection.execute(
          "UPDATE TB_T_Device d JOIN TB_M_Type t ON d.DeviceType = t.TypeName SET d.TypeID = t.TypeID",
        );
      }
    }

    // --- Data Migration: stickerid -> DeviceCode, serialnumber -> SerialNumber ---
    try {
      // Try to select stickerid to see if it exists
      await connection.execute("SELECT stickerid FROM TB_T_Device LIMIT 1");
      console.log("Migrating stickerid to DeviceCode...");
      await connection.execute(
        "UPDATE TB_T_Device SET DeviceCode = stickerid WHERE (DeviceCode IS NULL OR DeviceCode = '') AND stickerid IS NOT NULL",
      );
    } catch (e) {
      // Ignore if stickerid column does not exist
    }

    try {
      // Try to select serialnumber (lowercase) to see if it exists
      await connection.execute("SELECT serialnumber FROM TB_T_Device LIMIT 1");
      console.log("Migrating serialnumber to SerialNumber...");
      await connection.execute(
        "UPDATE TB_T_Device SET SerialNumber = serialnumber WHERE (SerialNumber IS NULL OR SerialNumber = '') AND serialnumber IS NOT NULL",
      );
    } catch (e) {
      // Ignore if serialnumber column does not exist
    }

    // --- Mock Data: Generate SerialNumber if missing ---
    console.log("Generating mock SerialNumbers for missing entries...");
    await connection.execute(`
      UPDATE TB_T_Device 
      SET SerialNumber = CONCAT('SN-', LPAD(DVID, 5, '0')) 
      WHERE SerialNumber IS NULL OR SerialNumber = ''
    `);

    connection.release();
  })
  .catch((err) => {
    console.error("Error connecting to database:", err.stack);
  });

// Middleware to parse JSON bodies
app.use(express.json({ limit: "10mb" })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware: ตรวจสอบการเชื่อมต่อ Database ทุก Request
app.use(async (req, res, next) => {
  try {
    // ลอง Query ง่ายๆ เพื่อเช็คว่า Database ยังตอบสนองอยู่หรือไม่
    await db.execute("SELECT 1");
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(503).json({ message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (Database Connection Failed)", error: error.message });
  }
});

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running and accessible" });
});

// Debug Endpoint to verify table schema
app.get("/api/debug/schema/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const [columns] = await db.execute(`DESCRIBE ${tableName}`);
    res.json(columns);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching schema", error: error.message });
  }
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
  const { username, employeeId } = req.body;

  if (!username || !employeeId) {
    return res.status(400).json({ message: "กรุณาระบุชื่อผู้ใช้และรหัสพนักงาน" });
  }

  try {
    // Check if employee exists by username and EMP_NUM in TB_T_Employee table
    const [employees] = await db.execute(
      "SELECT * FROM TB_T_Employee WHERE username = ? AND EMP_NUM = ?",
      [username, employeeId],
    );
    if (employees.length === 0) {
      return res.status(404).json({ message: "ข้อมูลผู้ใช้งานไม่ถูกต้อง" });
    }

    const user = employees[0];

    // Generate token for direct identification in the next step
    const token = crypto.randomBytes(20).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    await db.execute(
      "UPDATE TB_T_Employee SET reset_token = ?, reset_token_expires = ? WHERE EMPID = ?",
      [token, expires, user.EMPID],
    );

    // Return the token directly to the frontend for immediate redirection
    res.json({ 
      message: "ตรวจสอบข้อมูลสำเร็จ", 
      resetToken: token 
    });
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
    const finalRoleId = 3; // Corrected from 2 (Staff) to 3 (User) to match comments and security best practices

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
      `SELECT e.*, r.RoleName, d.DepartmentName, i.InstitutionName 
       FROM TB_T_Employee e 
       LEFT JOIN TB_M_Role r ON e.RoleID = r.RoleID 
       LEFT JOIN TB_M_Department d ON e.DepartmentID = d.DepartmentID
       LEFT JOIN TB_M_Institution i ON e.InstitutionID = i.InstitutionID
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
        InstitutionName: newUser.InstitutionName,
        departmentId: newUser.DepartmentID,
        DepartmentName: newUser.DepartmentName,
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
      `SELECT e.*, r.RoleName, d.DepartmentName, i.InstitutionName 
       FROM TB_T_Employee e 
       LEFT JOIN TB_M_Role r ON e.RoleID = r.RoleID 
       LEFT JOIN TB_M_Department d ON e.DepartmentID = d.DepartmentID
       LEFT JOIN TB_M_Institution i ON e.InstitutionID = i.InstitutionID
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
        InstitutionName: employee.InstitutionName,
        departmentId: employee.DepartmentID,
        DepartmentName: employee.DepartmentName,
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
      JOIN TB_M_StatusDevice s ON d.StatusID = s.DVStatusID 
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
      JOIN TB_M_StatusDevice s ON d.StatusID = s.DVStatusID 
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
             d.DeviceCode as AssetCode, d.Image
      FROM TB_T_Borrow b
      JOIN TB_T_BorrowDetail bd ON b.BorrowID = bd.BorrowID
      LEFT JOIN TB_T_Device d ON bd.ItemName = d.DeviceName COLLATE utf8mb4_unicode_ci
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
      SELECT d.DeviceName, 
             SUM(CASE WHEN s.StatusNameDV = 'ว่าง' THEN 1 ELSE 0 END) as AvailableCount
      FROM TB_T_Device d
      JOIN TB_M_StatusDevice s ON d.StatusID = s.DVStatusID
      GROUP BY d.DeviceName
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
      // เช็คจำนวนคงเหลือล่าสุด
      const [devices] = await connection.execute(
        "SELECT DeviceName, Quantity FROM TB_T_Device WHERE DeviceName = ? OR DeviceCode = ? OR SerialNumber = ?",
        [item.name, item.name, item.name],
      );

      if (devices.length === 0) {
        await connection.rollback();
        return res
          .status(400)
          .json({ message: `ไม่พบอุปกรณ์ในระบบ: ${item.name}` });
      }

      const device = devices[0];
      const availableQuantity = device.Quantity;

      if (item.quantity > availableQuantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `จำนวนอุปกรณ์ "${device.DeviceName}" ที่ต้องการยืม(${item.quantity})​ เกินจำนวนคงเหลือ(${availableQuantity})`,
        });
      }

      // If the items are already borrowed reject the request
      if (availableQuantity === 0) {
        await connection.rollback();
        return res
          .status(400)
          .json({ message: `อุปกรณ์ "${device.DeviceName}" ถูกยืมหมดเเล้ว` });
      }
      await connection.execute(
        "INSERT INTO TB_T_BorrowDetail (BorrowID, ItemName, Quantity, Remark) VALUES (?, ?, ?, ?)",
        [borrowId, device.DeviceName, item.quantity, item.remark || ""],
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

      // --- จัดการสต็อกสินค้า (Quantity Logic) ---

      // 1. กรณีอนุมัติ (Approved): ตัดสต็อก
      if (status === "Approved" && oldStatus !== "Approved") {
        const [details] = await connection.execute(
          "SELECT * FROM TB_T_BorrowDetail WHERE BorrowID = ?",
          [id],
        );

        for (const item of details) {
          // เช็คจำนวนคงเหลือล่าสุด
          const [device] = await connection.execute(
            "SELECT Quantity FROM TB_T_Device WHERE DeviceName = ? FOR UPDATE",
            [item.ItemName],
          );

          if (device.length === 0) {
            throw new Error(`ไม่พบอุปกรณ์ในระบบ: ${item.ItemName}`);
          }

          if (device[0].Quantity < item.Quantity) {
            throw new Error(
              `สินค้าไม่พอสำหรับ: ${item.ItemName} (เหลือ: ${device[0].Quantity}, ต้องการ: ${item.Quantity})`,
            );
          }

          // ตัดสต็อก
          await connection.execute(
            "UPDATE TB_T_Device SET Quantity = Quantity - ? WHERE DeviceName = ?",
            [item.Quantity, item.ItemName],
          );

          // อัปเดตสถานะเป็น 'ถูกยืม' (2) ถ้าสินค้าหมด (Quantity = 0)
          await connection.execute(
            "UPDATE TB_T_Device SET StatusID = 2 WHERE DeviceName = ? AND Quantity = 0",
            [item.ItemName],
          );
        }
      }

      // 2. กรณีคืนของ (Returned) หรือ ยกเลิก/ปฏิเสธ หลังจากที่อนุมัติไปแล้ว: คืนสต็อก
      if (
        oldStatus === "Approved" &&
        (status === "Returned" || status === "Rejected" || status === "Cancelled")
      ) {
        const [details] = await connection.execute(
          "SELECT * FROM TB_T_BorrowDetail WHERE BorrowID = ?",
          [id],
        );

        for (const item of details) {
          await connection.execute(
            "UPDATE TB_T_Device SET Quantity = Quantity + ? WHERE DeviceName = ?",
            [item.Quantity, item.ItemName],
          );

          // อัปเดตสถานะกลับเป็น 'ว่าง' (1) ถ้ามีสินค้าคืนมา (Quantity > 0) และสถานะเดิมคือ 'ถูกยืม'
          await connection.execute(
            "UPDATE TB_T_Device SET StatusID = 1 WHERE DeviceName = ? AND Quantity > 0 AND StatusID = 2",
            [item.ItemName],
          );
        }
      }
      // ----------------------------------------

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
        SELECT bd.*, d.DeviceCode, d.Image
        FROM TB_T_BorrowDetail bd
        LEFT JOIN TB_T_Device d ON bd.ItemName = d.DeviceName COLLATE utf8mb4_unicode_ci
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
      [roleId ?? null, statusId ?? null, id],
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
      `SELECT e.*, r.RoleName, d.DepartmentName, i.InstitutionName 
       FROM TB_T_Employee e 
       LEFT JOIN TB_M_Role r ON e.RoleID = r.RoleID 
       LEFT JOIN TB_M_Department d ON e.DepartmentID = d.DepartmentID
       LEFT JOIN TB_M_Institution i ON e.InstitutionID = i.InstitutionID
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
        InstitutionName: updatedUser.InstitutionName,
        departmentId: updatedUser.DepartmentID,
        DepartmentName: updatedUser.DepartmentName,
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
      `SELECT d.DVID, d.DeviceName, d.DeviceCode, d.SerialNumber,
              d.Image, d.Brand, d.DeviceType, d.Price, d.Quantity, d.Description,
              d.CategoryID, c.CategoryName,
              d.StatusID, s.StatusNameDV,
              d.BrandID, b.BrandName,
              d.TypeID, t.TypeName
       FROM TB_T_Device d 
       LEFT JOIN TB_M_Category c ON d.CategoryID = c.CategoryID 
       LEFT JOIN TB_M_StatusDevice s ON d.StatusID = s.DVStatusID
       LEFT JOIN TB_M_Brand b ON d.BrandID = b.BrandID
       LEFT JOIN TB_M_Type t ON d.TypeID = t.TypeID
       ORDER BY d.DVID DESC`,
    );
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" });
  }
});

// Search products
app.get("/api/products/search", async (req, res) => {
  const { q } = req.query;
  try {
    let sql = `SELECT d.DVID, d.DeviceName, d.DeviceCode, d.SerialNumber,
              d.Image, d.Brand, d.DeviceType, d.Price, d.Quantity, d.Description,
              d.CategoryID, c.CategoryName,
              d.StatusID, s.StatusNameDV,
              d.BrandID, b.BrandName,
              d.TypeID, t.TypeName,
              d.CreatedDate
       FROM TB_T_Device d 
       LEFT JOIN TB_M_Category c ON d.CategoryID = c.CategoryID 
       LEFT JOIN TB_M_StatusDevice s ON d.StatusID = s.DVStatusID
       LEFT JOIN TB_M_Brand b ON d.BrandID = b.BrandID
       LEFT JOIN TB_M_Type t ON d.TypeID = t.TypeID`;

    const params = [];
    if (q) {
      sql += ` WHERE d.DeviceName LIKE ? OR b.BrandName LIKE ? OR t.TypeName LIKE ? OR d.DeviceCode LIKE ?`;
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY d.DVID DESC`;

    const [products] = await db.execute(sql, params);
    res.json(products);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการค้นหาสินค้า" });
  }
});

// Check device status by Serial Number
app.get("/api/devices/status/:serialNumber", async (req, res) => {
  const { serialNumber } = req.params;
  try {
    const [devices] = await db.execute(
      `SELECT d.DVID, d.DeviceName, d.DeviceCode, d.SerialNumber, s.StatusNameDV as Status, d.StatusID
       FROM TB_T_Device d
       LEFT JOIN TB_M_StatusDevice s ON d.StatusID = s.DVStatusID
       WHERE d.SerialNumber = ?`,
      [serialNumber],
    );

    if (devices.length === 0) {
      return res.status(404).json({ message: "ไม่พบอุปกรณ์ที่มี Serial Number นี้" });
    }

    res.json(devices[0]);
  } catch (error) {
    console.error("Error checking device status:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบสถานะอุปกรณ์" });
  }
});

// Create product
app.post("/api/products", verifyToken, checkAdmin, async (req, res) => {
  const {
    DeviceName,
    DeviceCode,
    SerialNumber,
    CategoryID,
    StatusID,
    Image,
    Brand,
    DeviceType,
    Price,
    Quantity,
    Description,
  } = req.body;

  if (!DeviceName || !DeviceCode || !CategoryID || !StatusID) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO TB_T_Device (DeviceName, DeviceCode, SerialNumber, CategoryID, StatusID, Image, Brand, DeviceType, Price, Quantity, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        DeviceName,
        DeviceCode,
        SerialNumber || null,
        CategoryID,
        StatusID,
        Image || null,
        Brand || null,
        DeviceType || null,
        Price || 0,
        Quantity || 0,
        Description || "",
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
    DeviceName,
    DeviceCode,
    SerialNumber,
    CategoryID,
    StatusID,
    Image,
    Brand,
    DeviceType,
    Price,
    Quantity,
    Description,
  } = req.body;

  try {
    let query =
      "UPDATE TB_T_Device SET DeviceName=?, DeviceCode=?, SerialNumber=?, CategoryID=?, StatusID=?, Brand=?, DeviceType=?, Price=?, Quantity=?, Description=?";
    let params = [
      DeviceName,
      DeviceCode,
      SerialNumber || null,
      CategoryID,
      StatusID,
      Brand || null,
      DeviceType || null,
      Price || 0,
      Quantity || 0,
      Description || "",
    ];

    if (Image !== undefined) {
      query += ", Image=?";
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
      // Expected Columns: DeviceName | DeviceCode | CategoryName | StatusName
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const deviceName = row.getCell(1).value
          ? row.getCell(1).value.toString().trim()
          : null;
        const deviceCode = row.getCell(2).value
          ? row.getCell(2).value.toString().trim()
          : null;
        const categoryName = row.getCell(3).value
          ? row.getCell(3).value.toString().trim()
          : null;
        const statusName = row.getCell(4).value
          ? row.getCell(4).value.toString().trim()
          : null;
        // Optional: Brand (Col 5), Type (Col 6)

        if (!deviceName || !deviceCode) {
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
        const deviceName = row.getCell(1).text?.trim();
        const deviceCode = row.getCell(2).text?.trim();
        const serialNumber = row.getCell(7).text?.trim() || null; // Assume SerialNumber is in Column 7
        const categoryName = row.getCell(3).text?.trim();
        const statusName = row.getCell(4).text?.trim();
        const brand = row.getCell(5).text?.trim() || null;
        const deviceType = row.getCell(6).text?.trim() || null;

        if (!deviceName || !deviceCode) continue;

        const categoryId = categoryMap.get(categoryName?.toLowerCase());
        const statusId = statusMap.get(statusName?.toLowerCase());

        if (categoryId && statusId) {
          await connection.execute(
            "INSERT INTO TB_T_Device (DeviceName, DeviceCode, SerialNumber, CategoryID, StatusID, Brand, DeviceType) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              deviceName,
              deviceCode,
              serialNumber,
              categoryId,
              statusId,
              brand,
              deviceType,
            ],
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

// --- Master Product Management Endpoints (TB_T_Device) ---
// Optional: For managing the master product list if needed separately from devices

// Get all master products
app.get("/api/master-products", async (req, res) => {
  try {
    const [products] = await db.execute(
      "SELECT * FROM TB_T_Device ORDER BY CreatedDate DESC",
    );
    res.json(products);
  } catch (error) {
    console.error("Error fetching master products:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าหลัก" });
  }
});

// Create master product
app.post("/api/master-products", verifyToken, checkAdmin, async (req, res) => {
  const { DeviceName, DeviceCode, Price, Quantity, Description, Image } =
    req.body;

  if (!DeviceName) {
    return res.status(400).json({ message: "กรุณากรอกชื่อสินค้า" });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO TB_T_Device (DeviceName, DeviceCode, Price, Quantity, Description, Image) VALUES (?, ?, ?, ?, ?, ?)",
      [DeviceName, DeviceCode, Price, Quantity, Description, Image],
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
      await db.execute("DELETE FROM TB_T_Device WHERE DVID = ?", [id]);
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
      SELECT l.*, p.DeviceName, p.DeviceCode 
      FROM TB_L_StockMovement l
      LEFT JOIN TB_T_Device p ON l.ProductID = p.DVID
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

// Notifications Endpoint
app.get("/api/nav-notifications", verifyToken, async (req, res) => {
  try {
    // Only return these specific notifications for Admin role
    if (req.user.role !== "Admin") {
      return res.json([]);
    }

    const [lowStock] = await db.execute(
      "SELECT DeviceName, Quantity FROM TB_T_Device WHERE Quantity < 5 ORDER BY Quantity ASC LIMIT 5"
    );

    const [pendingRequests] = await db.execute(
      `SELECT b.BorrowID, b.BorrowDate, u.fname, u.lname 
       FROM TB_T_Borrow b 
       JOIN TB_T_Employee u ON b.EMPID = u.EMPID 
       WHERE b.Status = 'Pending' 
       ORDER BY b.CreatedDate DESC LIMIT 5`
    );

    // Recent returns (last 7 days?) or just last 5
    const [recentReturns] = await db.execute(
      `SELECT b.BorrowID, b.ReturnDate, u.fname, u.lname, d.ItemName 
       FROM TB_T_BorrowDetail d
       JOIN TB_T_Borrow b ON d.BorrowID = b.BorrowID
       JOIN TB_T_Employee u ON b.EMPID = u.EMPID 
       WHERE b.Status = 'Returned' 
       ORDER BY b.ReturnDate DESC LIMIT 5`
    );

    const notifications = [];

    // Format Low Stock
    lowStock.forEach(item => {
      notifications.push({
        id: `stock-${item.DeviceName}`,
        type: 'alert',
        message: `สินค้าใกล้หมด: ${item.DeviceName} (เหลือ ${item.Quantity})`,
        time: 'ขณะนี้',
        priority: 3
      });
    });

    // Format Pending Requests
    pendingRequests.forEach(req => {
      notifications.push({
        id: `borrow-${req.BorrowID}`,
        type: 'info',
        message: `คำขอยืมใหม่จาก ${req.fname} ${req.lname}`,
        time: new Date(req.BorrowDate).toLocaleDateString('th-TH'),
        priority: 2
      });
    });
    
    // Format Returns
    recentReturns.forEach(ret => {
        notifications.push({
            id: `return-${ret.BorrowID}-${ret.ItemName}`, // Unique ID
            type: 'success',
            message: `${ret.fname} คืนอุปกรณ์: ${ret.ItemName}`,
            time: new Date(ret.ReturnDate).toLocaleDateString('th-TH'),
            priority: 1
        });
    });

    // Sort by priority (high to low)
    notifications.sort((a, b) => b.priority - a.priority);

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Global Error Handler (Catch-all for unhandled errors)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    message: "เกิดข้อผิดพลาดที่ไม่คาดคิด (Internal Server Error)",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("\nClosing database connection pool...");
  await db.end();
  process.exit(0);
});
