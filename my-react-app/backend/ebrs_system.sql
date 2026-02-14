-- SQL script to create the 'users' table for the ebrs_system database
-- 1. ตารางสำนัก
CREATE TABLE TB_M_Institution (
    InstitutionID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสสำนัก
    InstitutionName VARCHAR(255) -- ชื่อสำนัก
);

-- 2. ตารางฝ่าย
CREATE TABLE TB_M_Department (
    DepartmentID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสฝ่าย
    DepartmentName VARCHAR(255) -- ชื่อฝ่าย
);

-- 3. ตารางบทบาทผู้ใช้งาน
CREATE TABLE TB_M_Role (
    RoleID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสบทบาทผู้ใช้งาน
    RoleName VARCHAR(255) -- ชื่อบทบาทผู้ใช้งาน
);

-- 4. ตารางสถานะการใช้งานของพนักงาน
CREATE TABLE TB_M_StatusEMP (
    EMPStatusID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสสถานะการใช้งานของพนักงาน
    StatusNameEMP VARCHAR(50) -- ชื่อสถานะการใช้งาน
);

-- 5. ตารางหมวดหมู่ของอุปกรณ์
CREATE TABLE TB_M_Category (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสหมวดหมู่ของอุปกรณ์
    CategoryName VARCHAR(255) -- ชื่อหมวดหมู่ของอุปกรณ์
);

-- 6. ตารางยี่ห้อของอุปกรณ์
CREATE TABLE TB_M_Brand (
    BrandID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสยี่ห้อของอุปกรณ์
    BrandName VARCHAR(255) -- ชื่อยี่ห้อของอุปกรณ์
);

-- 7. ตารางประเภทของอุปกรณ์
CREATE TABLE TB_M_Type (
    TypeID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสประเภทของอุปกรณ์
    TypeName VARCHAR(255) -- ชื่อประเภทของอุปกรณ์
);

-- 8. ตารางรุ่นของอุปกรณ์
CREATE TABLE TB_M_Model (
    ModelID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสรุ่นของอุปกรณ์
    ModelName VARCHAR(255) -- ชื่อรุ่นของอุปกรณ์
);

-- 9. ตารางสถานะของอุปกรณ์
CREATE TABLE TB_M_StatusDevice (
    DVStatusID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสสถานะของอุปกรณ์
    StatusNameDV VARCHAR(255) -- ชื่อสถานะของอุปกรณ์
);

-- 10. ตารางสถานะการคืน (Due Status)
CREATE TABLE TB_M_Duestatus (
    Due_statusID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสสถานะการคืน
    Due_statusName VARCHAR(255) -- ชื่อสถานะของการคืนอุปกรณ์
);

-- 11. ตารางสถานะของรายการยืม-คืน
CREATE TABLE TB_M_StatusBorrowTrans (
    BorrowTransStatusID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสสถานะของรายการยืม-คืน
    StatusNameTrans VARCHAR(255) -- ชื่อสถานะของรายการยืม-คืน
);

-- 12. ตารางพนักงาน
-- หมายเหตุ: ตารางนี้มีโครงสร้างที่ซับซ้อนกว่าและมาแทนที่ตาราง 'users' เดิม
-- การจะใช้งานตารางนี้จำเป็นต้องมีการแก้ไขโค้ดใน backend/server.js อย่างมาก
CREATE TABLE TB_T_Employee (
    EMPID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสลำดับการสร้างพนักงาน
    fname VARCHAR(255) NOT NULL, -- ชื่อจริง
    lname VARCHAR(255) NOT NULL, -- นามสกุล
    username VARCHAR(255) UNIQUE NOT NULL, -- ชื่อผู้ใช้
    InstitutionID INT, -- FK สำนัก
    DepartmentID INT, -- FK ฝ่าย
    RoleID INT, -- FK บทบาท
    EMPStatusID INT, -- FK สถานะพนักงาน
    email VARCHAR(255) UNIQUE NOT NULL, -- อีเมล
    password VARCHAR(255) NOT NULL, -- รหัสผ่าน
    phone VARCHAR(50), -- เบอร์โทรศัพท์
    fax VARCHAR(50), -- เบอร์โทรสาร
    CreateDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- วันที่สร้างข้อมูล
    CreateBy VARCHAR(255), -- ผู้บันทึกข้อมูล
    image TEXT, -- รูปภาพพนักงาน
    EMP_NUM VARCHAR(50) UNIQUE NOT NULL, -- รหัสพนักงาน (รหัสองค์กร)
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,

    FOREIGN KEY (InstitutionID) REFERENCES TB_M_Institution(InstitutionID),
    FOREIGN KEY (DepartmentID) REFERENCES TB_M_Department(DepartmentID),
    FOREIGN KEY (RoleID) REFERENCES TB_M_Role(RoleID),
    FOREIGN KEY (EMPStatusID) REFERENCES TB_M_StatusEMP(EMPStatusID)
);

-- 13. ตารางอุปกรณ์
CREATE TABLE TB_T_Device (
    DVID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสลำดับอุปกรณ์
    devicename VARCHAR(255) NOT NULL, -- ชื่ออุปกรณ์
    CategoryID INT, -- FK หมวดหมู่
    BrandID INT, -- FK ยี่ห้อ
    ModelID INT, -- FK รุ่น
    DVStatusID INT, -- FK สถานะอุปกรณ์
    serialnumber VARCHAR(255) UNIQUE, -- หมายเลขประจำเครื่อง
    stickerid VARCHAR(255) UNIQUE, -- รหัสสติ๊กเกอร์
    CreateDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- วันที่บันทึก
    CreateBy VARCHAR(255), -- ผู้บันทึก
    ModifyDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- วันที่แก้ไขล่าสุด
    ModifyBy VARCHAR(255), -- ผู้แก้ไขล่าสุด
    TypeID INT, -- FK ประเภทอุปกรณ์
    sticker TEXT, -- รูปภาพสติ๊กเกอร์
    BorrowTransStatusID INT, -- FK สถานะรายการยืม

    FOREIGN KEY (CategoryID) REFERENCES TB_M_Category(CategoryID),
    FOREIGN KEY (BrandID) REFERENCES TB_M_Brand(BrandID),
    FOREIGN KEY (ModelID) REFERENCES TB_M_Model(ModelID),
    FOREIGN KEY (DVStatusID) REFERENCES TB_M_StatusDevice(DVStatusID),
    FOREIGN KEY (TypeID) REFERENCES TB_M_Type(TypeID),
    FOREIGN KEY (BorrowTransStatusID) REFERENCES TB_M_StatusBorrowTrans(BorrowTransStatusID)
);

-- 14. ตารางรายการทำธุรกรรมการยืม
CREATE TABLE TB_T_BorrowTrans (
    TSTID INT AUTO_INCREMENT PRIMARY KEY, -- รหัสลำดับธุรกรรม
    transaction_num VARCHAR(255) UNIQUE NOT NULL, -- เลขที่รายการการยืม
    transactiondate TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- วันที่บันทึกรายการ
    DVID INT, -- FK อุปกรณ์
    EMPID INT, -- FK พนักงาน
    borrowdate DATETIME NOT NULL, -- วันที่ยืม
    duedate DATETIME NOT NULL, -- วันที่ครบกำหนดคืน
    returndate DATETIME, -- วันที่คืนจริง (NULL ได้)
    purpose TEXT, -- วัตถุประสงค์
    location VARCHAR(255), -- สถานที่ใช้งาน
    BorrowTransStatusID INT, -- FK สถานะรายการยืม-คืน
    notes_emp TEXT, -- หมายเหตุจากผู้ยืม
    notes_admin TEXT, -- หมายเหตุจากแอดมิน
    ModifyDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- วันที่แก้ไขล่าสุด
    ModifyBy VARCHAR(255), -- ผู้แก้ไขล่าสุด
    Due_statusID INT, -- FK สถานะการคืน
    
    -- ข้อมูล Denormalized เพื่อการแสดงผลที่ง่ายขึ้น
    InstitutionID INT,
    DepartmentID INT,
    CategoryID INT,
    TypeID INT,
    ModelID INT,
    BrandID INT,
    StatusNameTrans VARCHAR(255),
    EMP_NUM VARCHAR(50),
    phone VARCHAR(50),

    FOREIGN KEY (DVID) REFERENCES TB_T_Device(DVID),
    FOREIGN KEY (EMPID) REFERENCES TB_T_Employee(EMPID),
    FOREIGN KEY (BorrowTransStatusID) REFERENCES TB_M_StatusBorrowTrans(BorrowTransStatusID),
    FOREIGN KEY (Due_statusID) REFERENCES TB_M_Duestatus(Due_statusID),
    FOREIGN KEY (InstitutionID) REFERENCES TB_M_Institution(InstitutionID),
    FOREIGN KEY (DepartmentID) REFERENCES TB_M_Department(DepartmentID),
    FOREIGN KEY (CategoryID) REFERENCES TB_M_Category(CategoryID),
    FOREIGN KEY (TypeID) REFERENCES TB_M_Type(TypeID),
    FOREIGN KEY (ModelID) REFERENCES TB_M_Model(ModelID),
    FOREIGN KEY (BrandID) REFERENCES TB_M_Brand(BrandID)
);

-- =====================================================================================
-- MOCK DATA INSERTION
-- =====================================================================================

-- Master Data
INSERT INTO TB_M_Institution (InstitutionName) VALUES ('สำนักข่าว'), ('สำนักรายการ'), ('สำนักเทคโนโลยีและสารสนเทศ'), ('สำนักทรัพยากรมนุษย์');
INSERT INTO TB_M_Department (DepartmentName) VALUES ('ฝ่ายข่าวออนไลน์'), ('ฝ่ายข่าววิทยุ'), ('ฝ่ายพัฒนาระบบ'), ('ฝ่ายโครงสร้างพื้นฐาน');
INSERT INTO TB_M_Role (RoleName) VALUES ('Admin'), ('Manager'), ('User');
INSERT INTO TB_M_StatusEMP (StatusNameEMP) VALUES ('Active'), ('Inactive');
INSERT INTO TB_M_Category (CategoryName) VALUES ('Laptop'), ('Camera'), ('Microphone'), ('Mobile Phone');
INSERT INTO TB_M_Brand (BrandName) VALUES ('Apple'), ('Dell'), ('Sony'), ('Canon'), ('Shure');
INSERT INTO TB_M_Type (TypeName) VALUES ('แล็ปท็อป'), ('กล้อง Mirrorless'), ('กล้อง DSLR'), ('ไมโครโฟน Condenser');
INSERT INTO TB_M_Model (ModelName) VALUES ('MacBook Pro 14" M3'), ('Dell XPS 15'), ('Sony A7 IV'), ('Canon EOS R6'), ('Shure SM7B');
INSERT INTO TB_M_StatusDevice (StatusNameDV) VALUES ('พร้อมใช้งาน'), ('ถูกยืม'), ('ส่งซ่อม'), ('จำหน่าย');
INSERT INTO TB_M_Duestatus (Due_statusName) VALUES ('ตรงเวลา'), ('เกินกำหนด');
INSERT INTO TB_M_StatusBorrowTrans (StatusNameTrans) VALUES ('รออนุมัติ'), ('อนุมัติ'), ('คืนแล้ว'), ('ยกเลิก'), ('ไม่อนุมัติ');

-- Transactional Data

-- Sample Employees
-- The password for both users is 'password123'
-- The hash was generated using bcrypt with 10 rounds.
INSERT INTO TB_T_Employee (fname, lname, username, InstitutionID, DepartmentID, RoleID, EMPStatusID, email, password, phone, EMP_NUM, CreateBy) VALUES 
(
    'John', 
    'Doe', 
    'admin', 
    3, -- สำนักเทคโนโลยีและสารสนเทศ
    3, -- ฝ่ายพัฒนาระบบ
    1, -- Admin
    1, -- Active
    'admin@example.com', 
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
    '0810000001', 
    'EMP001',
    'System'
),
(
    'Jane', 
    'Smith', 
    'jane.s', 
    1, -- สำนักข่าว
    1, -- ฝ่ายข่าวออนไลน์
    3, -- User
    1, -- Active
    'jane@example.com', 
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
    '0810000002', 
    'EMP002',
    'System'
);

-- Sample Devices
INSERT INTO TB_T_Device (devicename, CategoryID, BrandID, ModelID, DVStatusID, serialnumber, stickerid, TypeID, BorrowTransStatusID, CreateBy) VALUES
(
    'MacBook Pro 14" M3', 1, 1, 1, 1, 'SN-MBP14-001', 'STK-MBP14-001', 1, 3, 'admin'
),
(
    'Sony A7 IV', 2, 3, 3, 1, 'SN-A7IV-001', 'STK-A7IV-001', 2, 3, 'admin'
),
(
    'Dell XPS 15', 1, 2, 2, 2, 'SN-XPS15-001', 'STK-XPS15-001', 1, 2, 'admin'
);

-- Sample Borrow Transaction
INSERT INTO TB_T_BorrowTrans (transaction_num, DVID, EMPID, borrowdate, duedate, purpose, location, BorrowTransStatusID, Due_statusID, CreateBy, ModifyBy) VALUES
(
    'BORROW-2024-001',
    3, -- Dell XPS 15
    2, -- Jane Smith
    '2024-05-20 10:00:00',
    '2024-05-27 17:00:00',
    'ใช้งานนอกสถานที่สำหรับทำข่าว',
    'ภาคสนาม',
    2, -- อนุมัติ
    1, -- ตรงเวลา
    'admin',
    'admin'
);