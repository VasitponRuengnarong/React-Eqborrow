const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Configuration from environment variables or defaults (matching server.js)
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "root";
const DB_NAME = process.env.DB_NAME || "ebrs_system";
const DB_PORT = process.env.DB_PORT || 3306;

// Backup directory
const backupDir = path.join(__dirname, "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Generate filename with timestamp
const date = new Date();
const timestamp = date.toISOString().replace(/[:.]/g, "-");
const filename = `${DB_NAME}_backup_${timestamp}.sql`;
const filePath = path.join(backupDir, filename);

console.log(`Starting backup for database: ${DB_NAME}...`);

// Construct mysqldump command
// Note: -p must be followed immediately by the password (no space)
const command = `mysqldump -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p"${DB_PASSWORD}" ${DB_NAME} > "${filePath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error creating backup: ${error.message}`);
    console.error(
      "Ensure 'mysqldump' is installed and available in your system PATH.",
    );
    return;
  }

  // Check if file exists and has content
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.size > 0) {
      console.log(`Backup created successfully!`);
      console.log(`File: ${filePath}`);
      console.log(`Size: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.warn("Warning: Backup file is empty.");
    }
  } else {
    console.error("Error: Backup file was not created.");
  }
});