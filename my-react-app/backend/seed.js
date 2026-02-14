require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ebrs_system",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const seedData = async () => {
  let connection;
  try {
    connection = await db.getConnection();
    console.log("Connected to database for seeding.");

    // Clear existing data (optional, use with caution in production)
    console.log("Clearing existing data...");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0"); // Disable FK checks temporarily
    await connection.execute("TRUNCATE TABLE TB_T_BorrowDetail");
    await connection.execute("TRUNCATE TABLE TB_T_Borrow");
    await connection.execute("TRUNCATE TABLE TB_T_Employee");
    await connection.execute("TRUNCATE TABLE TB_M_Product");
    await connection.execute("TRUNCATE TABLE TB_M_ProductCategory");
    await connection.execute("TRUNCATE TABLE TB_M_Institution");
    await connection.execute("TRUNCATE TABLE TB_M_Department");
    await connection.execute("TRUNCATE TABLE TB_M_Role");
    await connection.execute("TRUNCATE TABLE TB_M_StatusEMP");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1"); // Re-enable FK checks
    console.log("Existing data cleared.");

    // Seed TB_M_Role
    console.log("Seeding TB_M_Role...");
    await connection.execute(
      "INSERT INTO TB_M_Role (RoleName) VALUES ('Admin'), ('User'), ('Staff')",
    );

    // Seed TB_M_StatusEMP
    console.log("Seeding TB_M_StatusEMP...");
    await connection.execute(
      "INSERT INTO TB_M_StatusEMP (StatusName) VALUES ('Active'), ('Inactive'), ('Suspended')",
    );

    // Seed TB_M_Institution
    console.log("Seeding TB_M_Institution...");
    await connection.execute(
      "INSERT INTO TB_M_Institution (InstitutionName) VALUES ('สำนักงานใหญ่'), ('สาขา 1'), ('ฝ่ายผลิต')",
    );

    // Seed TB_M_Department
    console.log("Seeding TB_M_Department...");
    await connection.execute(
      "INSERT INTO TB_M_Department (DepartmentName) VALUES ('IT'), ('HR'), ('Finance'), ('Marketing'), ('Production')",
    );

    // Seed TB_T_Employee (Admin User)
    console.log("Seeding TB_T_Employee (Admin User)...");
    const hashedPassword = await bcrypt.hash("123456", 10); // Password: 123456
    await connection.execute(
      "INSERT INTO TB_T_Employee (fname, lname, EMP_NUM, username, email, phone, RoleID, InstitutionID, DepartmentID, EMPStatusID, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "System",
        "Admin",
        "99999",
        "admin",
        "admin@example.com",
        "0123456789",
        1, // Admin RoleID
        1, // สำนักงานใหญ่
        1, // IT
        1, // Active
        hashedPassword,
      ],
    );

    // Seed TB_M_ProductCategory
    console.log("Seeding TB_M_ProductCategory...");
    await connection.execute(
      "INSERT INTO TB_M_ProductCategory (CategoryName) VALUES ('คอมพิวเตอร์'), ('อุปกรณ์สำนักงาน'), ('เครื่องมือช่าง')",
    );

    // Seed TB_M_Product
    console.log("Seeding TB_M_Product...");
    await connection.execute(
      "INSERT INTO TB_M_Product (ProductName, ProductCode, Price, Quantity, Description, CategoryID) VALUES ('โน้ตบุ๊ก Dell XPS', 'NB001', 35000.00, 10, 'โน้ตบุ๊กประสิทธิภาพสูง', 1)",
    );
    await connection.execute(
      "INSERT INTO TB_M_Product (ProductName, ProductCode, Price, Quantity, Description, CategoryID) VALUES ('โปรเจคเตอร์ Epson', 'PJ002', 15000.00, 5, 'โปรเจคเตอร์สำหรับห้องประชุม', 2)",
    );

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error during database seeding:", error);
  } finally {
    if (connection) connection.release();
    process.exit(); // Exit the script after seeding
  }
};

seedData();
