const mysql = require('mysql2/promise');

const dbConfig = {
  host: "localhost", // Running from host to docker
  user: "root",
  password: "root",
  database: "ebrs_system",
  port: 3307, // Mapped port in docker-compose.dev.yml
};

async function seedEveryUser() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("🌱 Connected to database on port 3307");

    // Get all users
    const [users] = await connection.execute("SELECT EMPID, fname FROM TB_T_Employee");
    
    if (users.length === 0) {
      console.log("❌ No users found to seed.");
      await connection.end();
      return;
    }

    console.log(`Found ${users.length} users. Sending test notifications to all...`);

    for (const user of users) {
      await connection.execute(`
        INSERT INTO TB_T_Notification (EMPID, Title, Message, Type, ActionUrl, IsRead)
        VALUES (?, 'ระบบทดสอบ', 'สวัสดีคุณ ${user.fname} นี่คือการแจ้งเตือนทดสอบระบบใหม่ครับ', 'Success', '/dashboard', 0)
      `, [user.EMPID]);
    }

    console.log("✅ Successfully seeded test notifications for ALL users!");
    await connection.end();
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error("❌ Connection Refused! Is Docker running? Check port 3307 mapping.");
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

seedEveryUser();
