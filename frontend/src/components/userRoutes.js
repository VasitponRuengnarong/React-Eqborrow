const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../config/db"); // ตรวจสอบ path นี้ให้ตรงกับไฟล์เชื่อมต่อ DB ของคุณ

// PUT /api/users/:id/change-password
router.put("/:id/change-password", async (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  // Validation เบื้องต้น
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "กรุณาระบุรหัสผ่านปัจจุบันและรหัสผ่านใหม่" });
  }

  try {
    // 1. ดึงข้อมูล User จากฐานข้อมูล (ปรับ SQL ตามโครงสร้างตารางของคุณ)
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    }

    // 2. ตรวจสอบว่ารหัสผ่านปัจจุบันถูกต้องหรือไม่
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }

    // 3. เข้ารหัสรหัสผ่านใหม่ (Hash)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. อัปเดตรหัสผ่านลงฐานข้อมูล
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
  }
});

module.exports = router;
