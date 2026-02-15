const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "ebrs_system",
  port: process.env.DB_PORT || 3306,
};

async function createTable() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log("Checking/Creating TB_T_Notification table...");
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TB_T_Notification (
        NotificationID INT AUTO_INCREMENT PRIMARY KEY,
        UserID INT NOT NULL,
        Title VARCHAR(255) NOT NULL,
        Message TEXT NOT NULL,
        Type ENUM('Success', 'Warning', 'Info', 'Error') DEFAULT 'Info',
        ActionUrl VARCHAR(255),
        IsRead BOOLEAN DEFAULT FALSE,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserID) REFERENCES TB_T_Employee(EMPID) ON DELETE CASCADE
      )
    `);
    
    console.log("Table TB_T_Notification ready.");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    await connection.end();
  }
}

createTable();
