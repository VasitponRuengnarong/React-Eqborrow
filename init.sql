CREATE DATABASE IF NOT EXISTS ebrs_system;
USE ebrs_system;

-- 1. Master Data Tables
CREATE TABLE IF NOT EXISTS TB_M_Institution (
    InstitutionID INT AUTO_INCREMENT PRIMARY KEY,
    InstitutionName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_Department (
    DepartmentID INT AUTO_INCREMENT PRIMARY KEY,
    DepartmentName VARCHAR(255) NOT NULL,
    InstitutionID INT,
    FOREIGN KEY (InstitutionID) REFERENCES TB_M_Institution(InstitutionID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS TB_M_Role (
    RoleID INT AUTO_INCREMENT PRIMARY KEY,
    RoleName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_StatusEMP (
    EMPStatusID INT AUTO_INCREMENT PRIMARY KEY,
    StatusNameEMP VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_Category (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_Brand (
    BrandID INT AUTO_INCREMENT PRIMARY KEY,
    BrandName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_Type (
    TypeID INT AUTO_INCREMENT PRIMARY KEY,
    TypeName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_Model (
    ModelID INT AUTO_INCREMENT PRIMARY KEY,
    ModelName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_StatusDevice (
    DVStatusID INT AUTO_INCREMENT PRIMARY KEY,
    StatusNameDV VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_Duestatus (
    Due_statusID INT AUTO_INCREMENT PRIMARY KEY,
    Due_statusName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_StatusBorrowTrans (
    BorrowTransStatusID INT AUTO_INCREMENT PRIMARY KEY,
    StatusNameTrans VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS TB_M_Product (
    ProductID INT AUTO_INCREMENT PRIMARY KEY,
    ProductName VARCHAR(255) NOT NULL,
    ProductCode VARCHAR(100),
    Price DECIMAL(10, 2),
    Quantity INT,
    Description TEXT,
    Image LONGTEXT,
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transaction Tables
CREATE TABLE IF NOT EXISTS TB_T_Employee (
    EMPID INT AUTO_INCREMENT PRIMARY KEY,
    fname VARCHAR(255) NOT NULL,
    lname VARCHAR(255) NOT NULL,
    EMP_NUM VARCHAR(50) NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    image LONGTEXT,
    RoleID INT,
    InstitutionID INT,
    DepartmentID INT,
    EMPStatusID INT,
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (RoleID) REFERENCES TB_M_Role(RoleID),
    FOREIGN KEY (InstitutionID) REFERENCES TB_M_Institution(InstitutionID),
    FOREIGN KEY (DepartmentID) REFERENCES TB_M_Department(DepartmentID),
    FOREIGN KEY (EMPStatusID) REFERENCES TB_M_StatusEMP(EMPStatusID)
);

CREATE TABLE IF NOT EXISTS TB_T_Device (
    DVID INT AUTO_INCREMENT PRIMARY KEY,
    devicename VARCHAR(255),
    CategoryID INT,
    BrandID INT,
    ModelID INT,
    DVStatusID INT,
    serialnumber VARCHAR(255) UNIQUE,
    stickerid VARCHAR(255) UNIQUE,
    CreateDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreateBy VARCHAR(255),
    ModifyDate DATETIME ON UPDATE CURRENT_TIMESTAMP,
    ModifyBy VARCHAR(255),
    TypeID INT,
    sticker LONGTEXT,
    BorrowTransStatusID INT,
    Brand VARCHAR(100),
    DeviceType VARCHAR(100),
    Price DECIMAL(10, 2),
    Quantity INT,
    Description TEXT,
    FOREIGN KEY (CategoryID) REFERENCES TB_M_Category(CategoryID),
    FOREIGN KEY (BrandID) REFERENCES TB_M_Brand(BrandID),
    FOREIGN KEY (ModelID) REFERENCES TB_M_Model(ModelID),
    FOREIGN KEY (DVStatusID) REFERENCES TB_M_StatusDevice(DVStatusID),
    FOREIGN KEY (TypeID) REFERENCES TB_M_Type(TypeID),
    FOREIGN KEY (BorrowTransStatusID) REFERENCES TB_M_StatusBorrowTrans(BorrowTransStatusID)
);

CREATE TABLE IF NOT EXISTS TB_T_BorrowTrans (
    TSTID INT AUTO_INCREMENT PRIMARY KEY,
    transaction_num VARCHAR(255),
    transactiondate DATETIME DEFAULT CURRENT_TIMESTAMP,
    DVID INT,
    EMPID INT,
    borrowdate DATETIME,
    duedate DATETIME,
    returndate DATETIME,
    purpose TEXT,
    location VARCHAR(255),
    BorrowTransStatusID INT,
    notes_emp TEXT,
    notes_admin TEXT,
    ModifyDate DATETIME ON UPDATE CURRENT_TIMESTAMP,
    ModifyBy VARCHAR(255),
    Due_statusID INT,
    InstitutionID INT,
    DepartmentID INT,
    StatusNameTrans VARCHAR(255),
    CategoryID INT,
    TypeID INT,
    ModelID INT,
    BrandID INT,
    EMP_NUM VARCHAR(50),
    phone VARCHAR(50),
    FOREIGN KEY (DVID) REFERENCES TB_T_Device(DVID),
    FOREIGN KEY (EMPID) REFERENCES TB_T_Employee(EMPID),
    FOREIGN KEY (BorrowTransStatusID) REFERENCES TB_M_StatusBorrowTrans(BorrowTransStatusID),
    FOREIGN KEY (Due_statusID) REFERENCES TB_M_Duestatus(Due_statusID)
);

CREATE TABLE IF NOT EXISTS TB_T_Borrow (
    BorrowID INT AUTO_INCREMENT PRIMARY KEY,
    EMPID INT,
    BorrowDate DATETIME NOT NULL,
    ReturnDate DATETIME NOT NULL,
    Purpose TEXT,
    Status ENUM('Pending', 'Approved', 'Rejected', 'Returned') DEFAULT 'Pending',
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (EMPID) REFERENCES TB_T_Employee(EMPID)
);

CREATE TABLE IF NOT EXISTS TB_T_BorrowDetail (
    DetailID INT AUTO_INCREMENT PRIMARY KEY,
    BorrowID INT,
    ItemName VARCHAR(255) NOT NULL,
    Quantity INT NOT NULL,
    Remark TEXT,
    FOREIGN KEY (BorrowID) REFERENCES TB_T_Borrow(BorrowID) ON DELETE CASCADE
);

-- 3. Insert Mock Data (Master Data)
INSERT INTO TB_M_Institution (InstitutionName) VALUES ('สำนักเทคโนโลยีและวิศวกรรม'), ('สำนักข่าว'), ('สำนักรายการ'), ('สำนักบริหาร');
INSERT INTO TB_M_Department (DepartmentName, InstitutionID) VALUES ('ฝ่ายวิศวกรรมออกอากาศ', 1), ('ฝ่ายเทคโนโลยีสารสนเทศ', 1), ('ฝ่ายข่าวในประเทศ', 2), ('ฝ่ายผลิตรายการ', 3), ('ฝ่ายทรัพยากรบุคคล', 4);
INSERT INTO TB_M_Role (RoleName) VALUES ('Admin'), ('User'), ('Manager'), ('Approver');
INSERT INTO TB_M_StatusEMP (StatusNameEMP) VALUES ('พนักงานประจำ'), ('ลูกจ้างชั่วคราว'), ('ทดลองงาน'), ('ลาออก');