const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Database Connection
const db = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "ebrs_system",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

const connectWithRetry = () => {
  db.getConnection()
    .then((connection) => {
      console.log("Connected to the database successfully.");
      connection.release();
    })
    .catch((err) => {
      console.error("Error connecting to database:", err.message);
      console.log("Retrying in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Routes
app.get("/", (req, res) => {
  res.send("Backend API is running correctly!");
});

app.get("/api/institutions", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM TB_M_Institution");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/departments", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM TB_M_Department");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/roles", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM TB_M_Role");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/emp-statuses", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM TB_M_StatusEMP");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT e.*, r.RoleName, s.StatusName, i.InstitutionName, d.DepartmentName
      FROM TB_T_Employee e
      LEFT JOIN TB_M_Role r ON e.RoleID = r.RoleID
      LEFT JOIN TB_M_StatusEMP s ON e.EMPStatusID = s.EMPStatusID
      LEFT JOIN TB_M_Institution i ON e.InstitutionID = i.InstitutionID
      LEFT JOIN TB_M_Department d ON e.DepartmentID = d.DepartmentID
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { roleId, statusId } = req.body;
  try {
    await db.query(
      "UPDATE TB_T_Employee SET RoleID = ?, EMPStatusID = ? WHERE EMPID = ?",
      [roleId, statusId, id],
    );
    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM TB_T_Employee WHERE EMPID = ?", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Master Data CRUD ---

// Institutions
app.post("/api/institutions", async (req, res) => {
  const { InstitutionName } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO TB_M_Institution (InstitutionName) VALUES (?)",
      [InstitutionName],
    );
    res.status(201).json({ InstitutionID: result.insertId, InstitutionName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/institutions/:id", async (req, res) => {
  const { id } = req.params;
  const { InstitutionName } = req.body;
  try {
    await db.query(
      "UPDATE TB_M_Institution SET InstitutionName = ? WHERE InstitutionID = ?",
      [InstitutionName, id],
    );
    res.json({ message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/institutions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM TB_M_Institution WHERE InstitutionID = ?", [
      id,
    ]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        error:
          "ไม่สามารถลบได้ เนื่องจากมีข้อมูล (เช่น พนักงาน) อ้างอิงถึงหน่วยงานนี้อยู่",
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// Departments
app.post("/api/departments", async (req, res) => {
  const { DepartmentName, InstitutionID } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO TB_M_Department (DepartmentName, InstitutionID) VALUES (?, ?)",
      [DepartmentName, InstitutionID],
    );
    res
      .status(201)
      .json({ DepartmentID: result.insertId, DepartmentName, InstitutionID });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ error: "ไม่พบข้อมูลหน่วยงานหลัก (Institution) ที่ระบุ" });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/departments/:id", async (req, res) => {
  const { id } = req.params;
  const { DepartmentName, InstitutionID } = req.body;
  try {
    await db.query(
      "UPDATE TB_M_Department SET DepartmentName = ?, InstitutionID = ? WHERE DepartmentID = ?",
      [DepartmentName, InstitutionID, id],
    );
    res.json({ message: "Updated successfully" });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ error: "ไม่พบข้อมูลหน่วยงานหลัก (Institution) ที่ระบุ" });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/departments/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM TB_M_Department WHERE DepartmentID = ?", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Roles
app.post("/api/roles", async (req, res) => {
  const { RoleName } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO TB_M_Role (RoleName) VALUES (?)",
      [RoleName],
    );
    res.status(201).json({ RoleID: result.insertId, RoleName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/roles/:id", async (req, res) => {
  const { id } = req.params;
  const { RoleName } = req.body;
  try {
    await db.query("UPDATE TB_M_Role SET RoleName = ? WHERE RoleID = ?", [
      RoleName,
      id,
    ]);
    res.json({ message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/roles/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM TB_M_Role WHERE RoleID = ?", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Employee Statuses
app.post("/api/emp-statuses", async (req, res) => {
  const { StatusName } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO TB_M_StatusEMP (StatusName) VALUES (?)",
      [StatusName],
    );
    res.status(201).json({ EMPStatusID: result.insertId, StatusName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/emp-statuses/:id", async (req, res) => {
  const { id } = req.params;
  const { StatusName } = req.body;
  try {
    await db.query(
      "UPDATE TB_M_StatusEMP SET StatusName = ? WHERE EMPStatusID = ?",
      [StatusName, id],
    );
    res.json({ message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/emp-statuses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM TB_M_StatusEMP WHERE EMPStatusID = ?", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/register", async (req, res) => {
  const {
    firstName,
    lastName,
    employeeId,
    username,
    email,
    phone,
    institutionId,
    departmentId,
    empStatusId,
    profileImage,
    password,
  } = req.body;

  try {
    const [existing] = await db.query(
      "SELECT * FROM TB_T_Employee WHERE username = ? OR email = ? OR EMP_NUM = ?",
      [username, email, employeeId],
    );
    if (existing.length > 0) {
      if (existing.some((emp) => emp.username === username)) {
        return res.status(409).json({ message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" });
      }
      if (existing.some((emp) => emp.email === email)) {
        return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
      }
      if (existing.some((emp) => emp.EMP_NUM === employeeId)) {
        return res.status(409).json({ message: "รหัสพนักงานนี้ถูกใช้งานแล้ว" });
      }
      return res.status(409).json({
        message: "ข้อมูลบางส่วน (ชื่อผู้ใช้, อีเมล, รหัสพนักงาน) ถูกใช้งานแล้ว",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      "INSERT INTO TB_T_Employee (fname, lname, EMP_NUM, username, email, phone, RoleID, InstitutionID, DepartmentID, EMPStatusID, image, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        firstName,
        lastName,
        employeeId,
        username,
        email,
        phone,
        2, // Force RoleID to 2 (User)
        institutionId,
        departmentId,
        empStatusId,
        profileImage,
        hashedPassword,
      ],
    );

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  try {
    const [users] = await db.query(
      `SELECT e.*, r.RoleName 
       FROM TB_T_Employee e 
       LEFT JOIN TB_M_Role r ON e.RoleID = r.RoleID 
       WHERE e.username = ?`,
      [username],
    );

    if (users.length === 0) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.EMPID,
        username: user.username,
        email: user.email,
        firstName: user.fname,
        lastName: user.lname,
        role: user.RoleName,
        roleId: user.RoleID,
        image: user.image,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
