const request = require("supertest");
const bcrypt = require("bcryptjs");

// --- Mock Setup ---
// ต้อง Mock mysql2/promise ก่อนที่จะ require server.js
const mockExecute = jest.fn();
const mockPool = {
  getConnection: jest.fn().mockResolvedValue({
    release: jest.fn(),
  }),
  execute: mockExecute,
  on: jest.fn(), // รองรับ event listener ของ pool
};

jest.mock("mysql2/promise", () => ({
  createPool: jest.fn(() => mockPool),
}));

// Mock bcryptjs เพื่อควบคุมผลลัพธ์การตรวจสอบรหัสผ่าน
jest.mock("bcryptjs");

// Import app หลังจาก Mock เสร็จแล้ว
const app = require("./server");

describe("POST /api/login", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // ล้างค่า Mock ก่อนเริ่มแต่ละ Test case
  });

  it("should return 400 if username or password is missing", async () => {
    const res = await request(app).post("/api/login").send({ username: "" }); // ส่งข้อมูลไม่ครบ

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
  });

  it("should return 401 if user not found", async () => {
    // จำลองว่า Database ไม่พบข้อมูล (คืนค่า array ว่าง)
    mockExecute.mockResolvedValue([[]]);

    const res = await request(app)
      .post("/api/login")
      .send({ username: "nonexistent", password: "password" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  });

  it("should return 401 if password does not match", async () => {
    // จำลองว่า Database พบ User
    const mockUser = { username: "user", password: "hashedpassword" };
    mockExecute.mockResolvedValue([[mockUser]]);

    // จำลองว่า bcrypt ตรวจสอบแล้วรหัสผ่านไม่ตรงกัน
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post("/api/login")
      .send({ username: "user", password: "wrongpassword" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  });

  it("should return 200 and user data if login successful", async () => {
    // ข้อมูลจำลองของ User ที่ Login สำเร็จ
    const mockUser = {
      EMPID: 1,
      username: "admin",
      password: "hashedpassword",
      fname: "System",
      lname: "Admin",
      EMP_NUM: "99999",
      email: "admin@example.com",
      phone: "0123456789",
      RoleID: 1,
      RoleName: "Admin",
      InstitutionID: 1,
      DepartmentID: 1,
      EMPStatusID: 1,
      image: "base64image",
      reset_token: "secret_token", // ข้อมูลนี้ควรถูกลบออกใน response
    };

    // จำลอง Database และ bcrypt
    mockExecute.mockResolvedValue([[mockUser]]);
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/login")
      .send({ username: "admin", password: "correctpassword" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("เข้าสู่ระบบสำเร็จ");

    // ตรวจสอบข้อมูล User ที่ส่งกลับมา
    expect(res.body.user.username).toBe("admin");
    expect(res.body.user.email).toBe("admin@example.com");
    expect(res.body.user.password).toBeUndefined(); // รหัสผ่านต้องไม่ถูกส่งกลับมา
    expect(res.body.user.reset_token).toBeUndefined(); // Token ลับต้องไม่ถูกส่งกลับมา
  });

  it("should return 500 if database error occurs", async () => {
    // ซ่อน console.error ชั่วคราวเพื่อให้ Test Output สะอาด
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      // จำลองว่า Database Error
      mockExecute.mockRejectedValue(new Error("DB Connection Failed"));

      const res = await request(app)
        .post("/api/login")
        .send({ username: "admin", password: "password" });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain("เกิดข้อผิดพลาดที่เซิร์ฟเวอร์");
    } finally {
      // คืนค่า console.error กลับสู่ปกติเสมอ (แม้ Test จะ Fail)
      consoleSpy.mockRestore();
    }
  });
});
