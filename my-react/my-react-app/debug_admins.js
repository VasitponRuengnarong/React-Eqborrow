const mysql = require('mysql2/promise');

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "ebrs_system",
  port: 3307,
};

async function debugAdmins() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Connected to DB");

    const [roles] = await connection.execute("SELECT * FROM TB_M_Role");
    console.log("Roles:", roles);

    const [admins] = await connection.execute(
      "SELECT e.EMPID, e.fname, r.RoleName FROM TB_T_Employee e JOIN TB_M_Role r ON e.RoleID = r.RoleID WHERE r.RoleName = 'Admin'"
    );
    console.log("Admins found:", admins);

    const [allEmployees] = await connection.execute("SELECT EMPID, fname, RoleID FROM TB_T_Employee");
    console.log("All Employees:", allEmployees);

    await connection.end();
  } catch (e) {
    console.error(e);
  }
}

debugAdmins();
