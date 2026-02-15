const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "ebrs_system",
  port: process.env.DB_PORT || 3306,
};

async function check() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute("SELECT * FROM TB_T_Notification");
    console.log("Total notifications:", rows.length);
    if (rows.length > 0) {
      console.log("Sample notification:", JSON.stringify(rows[0], null, 2));
    } else {
        console.log("NO NOTIFICATIONS FOUND IN DB.");
    }
    
    const [users] = await connection.execute("SELECT EMPID, fname, RoleID FROM TB_T_Employee LIMIT 10");
    console.log("Users in DB:", users);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await connection.end();
  }
}

check();
