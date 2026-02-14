USE ebrs_system;

CREATE TABLE IF NOT EXISTS TB_M_Institution (
  InstitutionID INT AUTO_INCREMENT PRIMARY KEY,
  InstitutionName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_Department (
  DepartmentID INT AUTO_INCREMENT PRIMARY KEY,
  DepartmentName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_Role (
  RoleID INT AUTO_INCREMENT PRIMARY KEY,
  RoleName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_StatusEMP (
  EMPStatusID INT AUTO_INCREMENT PRIMARY KEY,
  StatusName VARCHAR(255) NOT NULL
);

-- ตารางหมวดหมู่สินค้า (ย้ายขึ้นมาเพื่อให้ TB_M_Product อ้างอิงได้)
CREATE TABLE IF NOT EXISTS TB_M_ProductCategory (
  CategoryID INT AUTO_INCREMENT PRIMARY KEY,
  CategoryName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_T_Employee (
  EMPID INT AUTO_INCREMENT PRIMARY KEY,
  fname VARCHAR(255) NOT NULL,
  lname VARCHAR(255) NOT NULL,
  EMP_NUM VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  RoleID INT,
  InstitutionID INT,
  DepartmentID INT,
  EMPStatusID INT,
  image LONGTEXT,
  password VARCHAR(255) NOT NULL,
  reset_token VARCHAR(255),
  reset_token_expires DATETIME,
  FOREIGN KEY (RoleID) REFERENCES TB_M_Role(RoleID),
  FOREIGN KEY (InstitutionID) REFERENCES TB_M_Institution(InstitutionID),
  FOREIGN KEY (DepartmentID) REFERENCES TB_M_Department(DepartmentID),
  FOREIGN KEY (EMPStatusID) REFERENCES TB_M_StatusEMP(EMPStatusID)
);

-- ตารางข้อมูลการยืม (Header)
CREATE TABLE IF NOT EXISTS TB_T_Borrow (
  BorrowID INT AUTO_INCREMENT PRIMARY KEY,
  EMPID INT NOT NULL,
  BorrowDate DATE NOT NULL,
  ReturnDate DATE NOT NULL,
  ActualReturnDate DATETIME,
  Purpose TEXT,
  Status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Returned, Rejected
  ApprovedBy INT,
  CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (EMPID) REFERENCES TB_T_Employee(EMPID),
  FOREIGN KEY (ApprovedBy) REFERENCES TB_T_Employee(EMPID)
);

-- ตารางรายละเอียดอุปกรณ์ที่ยืม (Detail)
CREATE TABLE IF NOT EXISTS TB_T_BorrowDetail (
  BorrowDetailID INT AUTO_INCREMENT PRIMARY KEY,
  BorrowID INT NOT NULL,
  ProductID INT,
  ItemName VARCHAR(255) NOT NULL,
  Quantity INT NOT NULL,
  Remark TEXT,
  FOREIGN KEY (BorrowID) REFERENCES TB_T_Borrow(BorrowID) ON DELETE CASCADE,
  FOREIGN KEY (ProductID) REFERENCES TB_M_Product(ProductID)
);

-- ตารางสินค้า/ครุภัณฑ์
CREATE TABLE IF NOT EXISTS TB_M_Product (
  ProductID INT AUTO_INCREMENT PRIMARY KEY,
  ProductName VARCHAR(255) NOT NULL,
  ProductCode VARCHAR(50) NOT NULL,
  Price DECIMAL(10, 2) DEFAULT 0.00,
  Quantity INT DEFAULT 0,
  Description TEXT,
  Image LONGTEXT,
  CategoryID INT,
  CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (CategoryID) REFERENCES TB_M_ProductCategory(CategoryID)
);

-- ข้อมูลเริ่มต้น (Master Data) เพื่อให้ Dropdown ในหน้าเว็บมีข้อมูล
INSERT INTO TB_M_Role (RoleName) VALUES ('Admin'), ('User'), ('Staff');
INSERT INTO TB_M_StatusEMP (StatusName) VALUES ('Active'), ('Inactive'), ('Suspended');
INSERT INTO TB_M_Department (DepartmentName) VALUES ('IT'), ('HR'), ('Finance'), ('Marketing');
INSERT INTO TB_M_Institution (InstitutionName) VALUES ('สำนักงานใหญ่'), ('สาขา 1');

-- สร้าง User Admin เริ่มต้น
-- Username: admin
-- Password: 123456 (Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy)
INSERT INTO TB_T_Employee (fname, lname, EMP_NUM, username, email, phone, RoleID, InstitutionID, DepartmentID, EMPStatusID, password) 
VALUES ('System', 'Admin', '99999', 'admin', 'admin@example.com', '0123456789', 1, 1, 1, 1, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');