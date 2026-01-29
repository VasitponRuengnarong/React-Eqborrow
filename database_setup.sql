-- Active: 1769497819742@@127.0.0.1@3307@ebrs_system

/*******************************************************
 * ส่วนที่ 1: MASTER TABLES (ตารางข้อมูลหลัก)
 *******************************************************/

CREATE TABLE IF NOT EXISTS `TB_M_Product` (
  `ProductID` int(11) NOT NULL AUTO_INCREMENT,
  `ProductName` varchar(255) NOT NULL,
  `ProductCode` varchar(100) DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT NULL,
  `Quantity` int(11) DEFAULT NULL,
  `Description` text,
  `Image` longtext,
  `CreatedDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1. ตาราง TB_M_Institution (สำนัก)
CREATE TABLE IF NOT EXISTS `TB_M_Institution` (
  `InstitutionID` int(11) NOT NULL AUTO_INCREMENT,
  `InstitutionName` varchar(255) NOT NULL,
  PRIMARY KEY (`InstitutionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. ตาราง TB_M_Department (ฝ่าย)
CREATE TABLE IF NOT EXISTS `TB_M_Department` (
  `DepartmentID` int(11) NOT NULL AUTO_INCREMENT,
  `DepartmentName` varchar(255) NOT NULL,
  PRIMARY KEY (`DepartmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ตาราง TB_M_Role (บทบาทผู้ใช้งาน)
CREATE TABLE IF NOT EXISTS `TB_M_Role` (
  `RoleID` int(11) NOT NULL AUTO_INCREMENT,
  `RoleName` varchar(255) NOT NULL,
  PRIMARY KEY (`RoleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ตาราง TB_M_StatusEMP (สถานะการใช้งานของพนักงาน)
DROP TABLE IF EXISTS `TB_M_StatusEMP`;
CREATE TABLE `TB_M_StatusEMP` (
  `EMPStatusID` int(11) NOT NULL AUTO_INCREMENT,
  `StatusNameEMP` varchar(50) NOT NULL,
  PRIMARY KEY (`EMPStatusID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. ตาราง TB_M_Category (หมวดหมู่ของอุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_M_Category` (
  `CategoryID` int(11) NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(255) NOT NULL,
  `CreatedDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdateDate` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CategoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. ตาราง TB_M_Brand (ยี่ห้อของอุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_M_Brand` (
  `BrandID` int(11) NOT NULL AUTO_INCREMENT,
  `BrandName` varchar(255) NOT NULL,
  PRIMARY KEY (`BrandID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. ตาราง TB_M_Type (ประเภทของอุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_M_Type` (
  `TypeID` int(11) NOT NULL AUTO_INCREMENT,
  `TypeName` varchar(255) NOT NULL,
  PRIMARY KEY (`TypeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. ตาราง TB_M_Model (รุ่นของอุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_M_Model` (
  `ModelID` int(11) NOT NULL AUTO_INCREMENT,
  `ModelName` varchar(255) NOT NULL,
  PRIMARY KEY (`ModelID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. ตาราง TB_M_StatusDevice (สถานะของอุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_M_StatusDevice` (
  `DVStatusID` int(11) NOT NULL AUTO_INCREMENT,
  `StatusNameDV` varchar(255) NOT NULL,
  PRIMARY KEY (`DVStatusID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. ตาราง TB_M_Duestatus (สถานะการคืน)
CREATE TABLE IF NOT EXISTS `TB_M_Duestatus` (
  `Due_statusID` int(11) NOT NULL AUTO_INCREMENT,
  `Due_statusName` varchar(255) NOT NULL,
  PRIMARY KEY (`Due_statusID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. ตาราง TB_M_StatusBorrowTrans (สถานะของรายการยืม-คืน)
CREATE TABLE IF NOT EXISTS `TB_M_StatusBorrowTrans` (
  `BorrowTransStatusID` int(11) NOT NULL AUTO_INCREMENT,
  `StatusNameTrans` varchar(255) NOT NULL,
  PRIMARY KEY (`BorrowTransStatusID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*******************************************************
 * ส่วนที่ 2: MAIN TABLES (ตารางข้อมูลหลัก - พนักงาน/อุปกรณ์)
 *******************************************************/

-- 12. ตาราง TB_T_Employee (พนักงาน)
CREATE TABLE IF NOT EXISTS `TB_T_Employee` (
  `EMPID` int(11) NOT NULL AUTO_INCREMENT,
  `fname` varchar(255) DEFAULT NULL,
  `lname` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `InstitutionID` int(11) DEFAULT NULL,
  `DepartmentID` int(11) DEFAULT NULL,
  `RoleID` int(11) DEFAULT NULL,
  `EMPStatusID` int(11) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `fax` varchar(50) DEFAULT NULL,
  `CreateDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `CreateBy` varchar(255) DEFAULT NULL,
  `image` longtext DEFAULT NULL,
  `EMP_NUM` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`EMPID`),
  KEY `FK_Employee_Institution` (`InstitutionID`),
  KEY `FK_Employee_Department` (`DepartmentID`),
  KEY `FK_Employee_Role` (`RoleID`),
  KEY `FK_Employee_Status` (`EMPStatusID`),
  CONSTRAINT `FK_Employee_Institution` FOREIGN KEY (`InstitutionID`) REFERENCES `TB_M_Institution` (`InstitutionID`),
  CONSTRAINT `FK_Employee_Department` FOREIGN KEY (`DepartmentID`) REFERENCES `TB_M_Department` (`DepartmentID`),
  CONSTRAINT `FK_Employee_Role` FOREIGN KEY (`RoleID`) REFERENCES `TB_M_Role` (`RoleID`),
  CONSTRAINT `FK_Employee_Status` FOREIGN KEY (`EMPStatusID`) REFERENCES `TB_M_StatusEMP` (`EMPStatusID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. ตาราง TB_T_Device (อุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_T_Device` (
  `DVID` int(11) NOT NULL AUTO_INCREMENT,
  `CategoryID` int(11) DEFAULT NULL,
  `BrandID` int(11) DEFAULT NULL,
  `ModelID` int(11) DEFAULT NULL,
  `DVStatusID` int(11) DEFAULT NULL,
  `serialnumber` varchar(255) DEFAULT NULL,
  `stickerid` varchar(255) DEFAULT NULL,
  `CreateDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `CreateBy` varchar(255) DEFAULT NULL,
  `ModifyDate` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `ModifyBy` varchar(255) DEFAULT NULL,
  `TypeID` int(11) DEFAULT NULL,
  `sticker` longtext DEFAULT NULL,
  `BorrowTransStatusID` int(11) DEFAULT NULL,
  PRIMARY KEY (`DVID`),
  KEY `FK_Device_Category` (`CategoryID`),
  KEY `FK_Device_Brand` (`BrandID`),
  KEY `FK_Device_Model` (`ModelID`),
  KEY `FK_Device_Status` (`DVStatusID`),
  KEY `FK_Device_Type` (`TypeID`),
  KEY `FK_Device_BorrowStatus` (`BorrowTransStatusID`),
  CONSTRAINT `FK_Device_Category` FOREIGN KEY (`CategoryID`) REFERENCES `TB_M_Category` (`CategoryID`),
  CONSTRAINT `FK_Device_Brand` FOREIGN KEY (`BrandID`) REFERENCES `TB_M_Brand` (`BrandID`),
  CONSTRAINT `FK_Device_Model` FOREIGN KEY (`ModelID`) REFERENCES `TB_M_Model` (`ModelID`),
  CONSTRAINT `FK_Device_Status` FOREIGN KEY (`DVStatusID`) REFERENCES `TB_M_StatusDevice` (`DVStatusID`),
  CONSTRAINT `FK_Device_Type` FOREIGN KEY (`TypeID`) REFERENCES `TB_M_Type` (`TypeID`),
  CONSTRAINT `FK_Device_BorrowStatus` FOREIGN KEY (`BorrowTransStatusID`) REFERENCES `TB_M_StatusBorrowTrans` (`BorrowTransStatusID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*******************************************************
 * ส่วนที่ 3: TRANSACTION TABLES (ตารางการทำรายการ)
 *******************************************************/

-- 14. ตาราง TB_T_BorrowTrans (รายการทำธุรกรรมการยืม)
CREATE TABLE IF NOT EXISTS `TB_T_BorrowTrans` (
  `TSTID` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_num` varchar(255) DEFAULT NULL,
  `transactiondate` datetime DEFAULT CURRENT_TIMESTAMP,
  `DVID` int(11) DEFAULT NULL,
  `EMPID` int(11) DEFAULT NULL,
  `borrowdate` datetime DEFAULT NULL,
  `duedate` datetime DEFAULT NULL,
  `returndate` datetime DEFAULT NULL,
  `purpose` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `BorrowTransStatusID` int(11) DEFAULT NULL,
  `notes_emp` text DEFAULT NULL,
  `notes_admin` text DEFAULT NULL,
  `ModifyDate` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `ModifyBy` varchar(255) DEFAULT NULL,
  `Due_statusID` int(11) DEFAULT NULL,
  `InstitutionID` int(11) DEFAULT NULL,
  `DepartmentID` int(11) DEFAULT NULL,
  `StatusNameTrans` varchar(255) DEFAULT NULL,
  `CategoryID` int(11) DEFAULT NULL,
  `TypeID` int(11) DEFAULT NULL,
  `ModelID` int(11) DEFAULT NULL,
  `BrandID` int(11) DEFAULT NULL,
  `EMP_NUM` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`TSTID`),
  KEY `FK_Borrow_Device` (`DVID`),
  KEY `FK_Borrow_Employee` (`EMPID`),
  KEY `FK_Borrow_Status` (`BorrowTransStatusID`),
  KEY `FK_Borrow_DueStatus` (`Due_statusID`),
  CONSTRAINT `FK_Borrow_Device` FOREIGN KEY (`DVID`) REFERENCES `TB_T_Device` (`DVID`),
  CONSTRAINT `FK_Borrow_Employee` FOREIGN KEY (`EMPID`) REFERENCES `TB_T_Employee` (`EMPID`),
  CONSTRAINT `FK_Borrow_Status` FOREIGN KEY (`BorrowTransStatusID`) REFERENCES `TB_M_StatusBorrowTrans` (`BorrowTransStatusID`),
  CONSTRAINT `FK_Borrow_DueStatus` FOREIGN KEY (`Due_statusID`) REFERENCES `TB_M_Duestatus` (`Due_statusID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


/*******************************************************
 * ส่วนที่ 4: SAMPLE DATA (ข้อมูลตัวอย่าง)
 *******************************************************/

-- 1. TB_M_Institution
INSERT INTO `TB_M_Institution` (`InstitutionName`) VALUES 
('Engineering Bureau'), ('News Bureau'), ('Program Bureau'), ('New Media Bureau');

-- 2. TB_M_Department
INSERT INTO `TB_M_Department` (`DepartmentName`) VALUES 
('IT Department'), ('Production Department'), ('Technical Support'), ('Administration');

-- 3. TB_M_Role
INSERT INTO `TB_M_Role` (`RoleName`) VALUES 
('Admin'), ('Staff'), ('User');

-- 4. TB_M_StatusEMP
INSERT INTO `TB_M_StatusEMP` (`StatusNameEMP`) VALUES 
('Active'), ('Inactive'), ('Resigned');

-- 5. TB_M_Category
INSERT INTO `TB_M_Category` (`CategoryName`) VALUES 
('IT Equipment'), ('Camera'), ('Audio'), ('Lighting'), ('Accessories');

-- 6. TB_M_Brand
INSERT INTO `TB_M_Brand` (`BrandName`) VALUES 
('Sony'), ('Canon'), ('Panasonic'), ('Apple'), ('Dell'), ('Shure'), ('Sennheiser'), ('Manfrotto');

-- 7. TB_M_Type
INSERT INTO `TB_M_Type` (`TypeName`) VALUES 
('Laptop'), ('Desktop'), ('Video Camera'), ('DSLR/Mirrorless'), ('Lens'), ('Microphone'), ('Tripod'), ('Light Kit');

-- 8. TB_M_Model
INSERT INTO `TB_M_Model` (`ModelName`) VALUES 
('MacBook Pro 16'), ('Dell Latitude 7420'), ('Sony A7S III'), ('Canon EOS R5'), ('Sennheiser EW 100 G4'), ('Manfrotto 504X');

-- 9. TB_M_StatusDevice
INSERT INTO `TB_M_StatusDevice` (`StatusNameDV`) VALUES 
('ว่าง'), ('ถูกยืม'), ('ส่งซ่อม'), ('ชำรุด'), ('สูญหาย');

-- 10. TB_M_Duestatus
INSERT INTO `TB_M_Duestatus` (`Due_statusName`) VALUES 
('Normal'), ('Overdue');

-- 11. TB_M_StatusBorrowTrans
INSERT INTO `TB_M_StatusBorrowTrans` (`StatusNameTrans`) VALUES 
('Pending'), ('Approved'), ('Rejected'), ('Returned'), ('Cancelled');

-- เพิ่ม User Admin ตัวอย่าง (Password: 123456)
-- หมายเหตุ: ในการใช้งานจริง Password ควรถูก Hash ก่อนบันทึก
INSERT INTO `TB_T_Employee` (`fname`, `lname`, `username`, `email`, `password`, `RoleID`, `EMPStatusID`, `InstitutionID`, `DepartmentID`, `EMP_NUM`) 
VALUES 
('System', 'Admin', 'admin', 'admin@thaipbs.or.th', '123456', 1, 1, 1, 1, 'EMP001'),
('Test', 'User', 'user', 'user@thaipbs.or.th', '123456', 3, 1, 2, 2, 'EMP002');

-- 13. TB_T_Device (ข้อมูลอุปกรณ์ตัวอย่าง)
INSERT INTO `TB_T_Device` (`devicename`, `CategoryID`, `BrandID`, `ModelID`, `DVStatusID`, `serialnumber`, `stickerid`, `TypeID`, `CreateBy`) VALUES 
('Sony Alpha A7S III', 2, 1, 3, 1, 'SN12345678', 'EQ-CAM-001', 4, 'System Admin'),
('Canon EOS R5', 2, 2, 4, 1, 'SN87654321', 'EQ-CAM-002', 4, 'System Admin'),
('MacBook Pro 16 M1', 1, 4, 1, 2, 'C02XXXXX', 'EQ-NB-001', 1, 'System Admin'),
('Sennheiser EW 100 G4', 3, 7, 5, 1, 'SN112233', 'EQ-AUD-001', 6, 'System Admin'),
('Dell Latitude 7420', 1, 5, 2, 1, 'DL123456', 'EQ-NB-002', 1, 'System Admin'),
('Manfrotto 504X Tripod', 5, 8, 6, 1, 'MN504X001', 'EQ-ACC-001', 7, 'System Admin'),
('Panasonic Lumix GH6', 2, 3, 3, 3, 'PN987654', 'EQ-CAM-003', 4, 'System Admin'),
('Shure SM7B', 3, 6, 5, 1, 'SH778899', 'EQ-AUD-002', 6, 'System Admin');

-- 14. TB_M_Product (ข้อมูลสินค้าตัวอย่าง - ถ้ามีการใช้งานตารางนี้)
INSERT INTO `TB_M_Product` (`ProductName`, `ProductCode`, `Price`, `Quantity`, `Description`) VALUES 
('MacBook Pro 16 M1', 'P-IT-001', 89900.00, 5, 'High performance laptop for video editing'),
('Sony Alpha A7S III', 'P-CAM-001', 120000.00, 3, 'Full-frame mirrorless camera for video'),
('Sennheiser EW 100 G4', 'P-AUD-001', 25000.00, 10, 'Wireless microphone system'),
('Dell Latitude 7420', 'P-IT-002', 45000.00, 8, 'Business laptop for general use');