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
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ebrs_system",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
    roleId,
    institutionId,
    departmentId,
    empStatusId,
    profileImage,
    password,
  } = req.body;

  try {
    const [existing] = await db.query(
      "SELECT * FROM TB_T_Employee WHERE username = ? OR email = ?",
      [username, email],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
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
        roleId,
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
