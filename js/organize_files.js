const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const cssDir = path.join(rootDir, "css");
const jsDir = path.join(rootDir, "js");

// Files to exclude from moving (e.g., backend server, config files)
const excludedFiles = [
  "server.js",
  "organize_files.js",
  "package.json",
  "package-lock.json",
  ".env",
];

// 1. Create directories if they don't exist
if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir);
if (!fs.existsSync(jsDir)) fs.mkdirSync(jsDir);

// 2. Move files
fs.readdir(rootDir, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
    return;
  }

  files.forEach((file) => {
    const oldPath = path.join(rootDir, file);
    const ext = path.extname(file).toLowerCase();

    // Skip directories and excluded files
    if (fs.statSync(oldPath).isDirectory() || excludedFiles.includes(file))
      return;

    if (ext === ".css") {
      const newPath = path.join(cssDir, file);
      fs.rename(oldPath, newPath, (err) => {
        if (err) console.error(`Error moving ${file}:`, err);
        else console.log(`Moved ${file} to css/`);
      });
    } else if (ext === ".js") {
      const newPath = path.join(jsDir, file);
      fs.rename(oldPath, newPath, (err) => {
        if (err) console.error(`Error moving ${file}:`, err);
        else console.log(`Moved ${file} to js/`);
      });
    }
  });
});
