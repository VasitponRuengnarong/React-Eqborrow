-- Active: 1769497819742@@127.0.0.1@3307@ebrs_system
SET FOREIGN_KEY_CHECKS = 0;

/*******************************************************
* ส่วนที่ 1: MASTER TABLES (ตารางข้อมูลหลัก)
*******************************************************/

-- 1. ตาราง TB_M_Institution (สำนัก)
CREATE TABLE IF NOT EXISTS `TB_M_Institution` (
    `InstitutionID` int(11) NOT NULL AUTO_INCREMENT,
    `InstitutionName` varchar(255) NOT NULL,
    PRIMARY KEY (`InstitutionID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2. ตาราง TB_M_Department (ฝ่าย)
CREATE TABLE `TB_M_Department` (
    `DepartmentID` int(11) NOT NULL AUTO_INCREMENT,
    `DepartmentName` varchar(255) NOT NULL,
    `InstitutionID` int(11) NOT NULL, -- คอลัมน์สำหรับเชื่อมโยง
    PRIMARY KEY (`DepartmentID`),
    FOREIGN KEY (`InstitutionID`) REFERENCES `TB_M_Institution` (`InstitutionID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 3. ตาราง TB_M_Role (บทบาทผู้ใช้งาน)
CREATE TABLE IF NOT EXISTS `TB_M_Role` (
    `RoleID` int(11) NOT NULL AUTO_INCREMENT,
    `RoleName` varchar(255) NOT NULL,
    PRIMARY KEY (`RoleID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 4. ตาราง TB_M_StatusEMP (สถานะการใช้งานของพนักงาน)
DROP TABLE IF EXISTS `TB_M_StatusEMP`;

CREATE TABLE IF NOT EXISTS `TB_M_StatusEMP` (
    `EMPStatusID` int(11) NOT NULL AUTO_INCREMENT,
    `StatusNameEMP` varchar(50) NOT NULL,
    PRIMARY KEY (`EMPStatusID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 5. ตาราง TB_M_Category (หมวดหมู่ของอุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_M_Category` (
    `CategoryID` int(11) NOT NULL AUTO_INCREMENT,
    `CategoryName` varchar(255) NOT NULL,
    `CreatedDate` datetime DEFAULT CURRENT_TIMESTAMP,
    `UpdateDate` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`CategoryID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 6. ตาราง TB_M_Brand (ยี่ห้อของอุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_M_Brand` (
    `BrandID` int(11) NOT NULL AUTO_INCREMENT,
    `BrandName` varchar(255) NOT NULL,
    PRIMARY KEY (`BrandID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 7. ตาราง TB_M_Type (ประเภทของอุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_M_Type` (
    `TypeID` int(11) NOT NULL AUTO_INCREMENT,
    `TypeName` varchar(255) NOT NULL,
    PRIMARY KEY (`TypeID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 8. ตาราง TB_M_Model (รุ่นของอุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_M_Model` (
    `ModelID` int(11) NOT NULL AUTO_INCREMENT,
    `ModelName` varchar(255) NOT NULL,
    PRIMARY KEY (`ModelID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 9. ตาราง TB_M_StatusDevice (สถานะของอุปกรณ์)
CREATE TABLE IF NOT EXISTS `TB_M_StatusDevice` (
    `DVStatusID` int(11) NOT NULL AUTO_INCREMENT,
    `StatusNameDV` varchar(255) NOT NULL,
    PRIMARY KEY (`DVStatusID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

/*******************************************************
* ส่วนที่ 2: MAIN TABLES (ตารางข้อมูลหลัก - พนักงาน/อุปกรณ์)
*******************************************************/

-- 12. ตาราง TB_T_Employee (พนักงาน)
DROP TABLE IF EXISTS `TB_T_Employee`;

CREATE TABLE `TB_T_Employee` (
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
    `reset_token` varchar(255) DEFAULT NULL,
    `reset_token_expires` datetime DEFAULT NULL,
    PRIMARY KEY (`EMPID`),
    KEY `FK_Employee_Institution` (`InstitutionID`),
    KEY `FK_Employee_Department` (`DepartmentID`),
    KEY `FK_Employee_Role` (`RoleID`),
    KEY `FK_Employee_Status` (`EMPStatusID`),
    CONSTRAINT `FK_Employee_Institution` FOREIGN KEY (`InstitutionID`) REFERENCES `TB_M_Institution` (`InstitutionID`),
    CONSTRAINT `FK_Employee_Department` FOREIGN KEY (`DepartmentID`) REFERENCES `TB_M_Department` (`DepartmentID`),
    CONSTRAINT `FK_Employee_Role` FOREIGN KEY (`RoleID`) REFERENCES `TB_M_Role` (`RoleID`),
    CONSTRAINT `FK_Employee_Status` FOREIGN KEY (`EMPStatusID`) REFERENCES `TB_M_StatusEMP` (`EMPStatusID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 13. ตาราง TB_T_Device (อุปกรณ์)
DROP TABLE IF EXISTS `TB_T_BorrowTrans`;

DROP TABLE IF EXISTS `TB_T_Device`;

CREATE TABLE `TB_T_Device` (
    `DVID` int(11) NOT NULL AUTO_INCREMENT,
    `devicename` varchar(255) DEFAULT NULL,
    `CategoryID` int(11) DEFAULT NULL,
    `BrandID` int(11) DEFAULT NULL,
    `ModelID` int(11) DEFAULT NULL,
    `DVStatusID` int(11) DEFAULT NULL,
    `serialnumber` varchar(255) DEFAULT NULL UNIQUE,
    `stickerid` varchar(255) DEFAULT NULL UNIQUE,
    `CreateDate` datetime DEFAULT CURRENT_TIMESTAMP,
    `CreateBy` varchar(255) DEFAULT NULL,
    `ModifyDate` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `ModifyBy` varchar(255) DEFAULT NULL,
    `TypeID` int(11) DEFAULT NULL,
    `sticker` longtext DEFAULT NULL,
    `DeviceType` varchar(100) DEFAULT NULL,
    `Price` decimal(10, 2) DEFAULT NULL,
    `Quantity` int(11) DEFAULT NULL,
    `Description` text,
    PRIMARY KEY (`DVID`),
    KEY `FK_Device_Category` (`CategoryID`),
    KEY `FK_Device_Brand` (`BrandID`),
    KEY `FK_Device_Model` (`ModelID`),
    KEY `FK_Device_Status` (`DVStatusID`),
    KEY `FK_Device_Type` (`TypeID`),
    CONSTRAINT `FK_Device_Status` FOREIGN KEY (`DVStatusID`) REFERENCES `TB_M_StatusDevice` (`DVStatusID`),
    CONSTRAINT `FK_Device_Type` FOREIGN KEY (`TypeID`) REFERENCES `TB_M_Type` (`TypeID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

/*******************************************************
* ส่วนที่ 3: TRANSACTION TABLES (ตารางการทำรายการ)
*******************************************************/

-- 15. ตาราง TB_L_StockMovement (ประวัติคลังสินค้า)
DROP TABLE IF EXISTS `TB_L_StockMovement`;

CREATE TABLE `TB_L_StockMovement` (
    `LogID` INT AUTO_INCREMENT PRIMARY KEY,
    `ProductID` INT,
    `MovementType` ENUM('IN', 'OUT'),
    `ChangeAmount` INT,
    `OldQuantity` INT,
    `NewQuantity` INT,
    `CreatedDate` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. ตาราง TB_T_Favorite (รายการโปรด)
DROP TABLE IF EXISTS `TB_T_Favorite`;

CREATE TABLE `TB_T_Favorite` (
    `FavoriteID` INT AUTO_INCREMENT PRIMARY KEY,
    `EMPID` INT NOT NULL,
    `DVID` INT NOT NULL,
    `CreatedDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_fav` (`EMPID`, `DVID`)
);

-- 17. ตาราง TB_T_Borrow (การยืม - ใช้คู่กับ server.js)
DROP TABLE IF EXISTS `TB_T_Borrow`;

CREATE TABLE `TB_T_Borrow` (
    `BorrowID` INT AUTO_INCREMENT PRIMARY KEY,
    `EMPID` INT,
    `BorrowDate` DATE,
    `ReturnDate` DATE,
    `Purpose` TEXT,
    `Status` ENUM(
        'Pending',
        'Approved',
        'Rejected',
        'Returned',
        'Cancelled'
    ) DEFAULT 'Pending',
    `CreatedDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`EMPID`) REFERENCES `TB_T_Employee` (`EMPID`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 18. ตาราง TB_T_BorrowDetail (รายละเอียดการยืม)
DROP TABLE IF EXISTS `TB_T_BorrowDetail`;

CREATE TABLE `TB_T_BorrowDetail` (
    `DetailID` INT AUTO_INCREMENT PRIMARY KEY,
    `BorrowID` INT,
    `ItemName` VARCHAR(255),
    `Quantity` INT,
    `Remark` TEXT,
    FOREIGN KEY (`BorrowID`) REFERENCES `TB_T_Borrow` (`BorrowID`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 19. ตาราง TB_L_ActivityLog (ประวัติการใช้งานระบบ)
DROP TABLE IF EXISTS `TB_L_ActivityLog`;

CREATE TABLE `TB_L_ActivityLog` (
    `LogID` INT AUTO_INCREMENT PRIMARY KEY,
    `ActionType` VARCHAR(50),
    `BorrowID` INT,
    `ActorID` INT,
    `Details` TEXT,
    `CreatedDate` DATETIME DEFAULT CURRENT_TIMESTAMP
);

/*******************************************************
* ส่วนที่ 4: SAMPLE DATA (ข้อมูลตัวอย่าง)
*******************************************************/

-- 1. TB_M_Institution
INSERT INTO
    `TB_M_Institution` (`InstitutionName`)
VALUES ('ไม่มีสำนัก'),
    ('สำนักสื่อดิจิทัล'),
    ('สำนักโทรทัศน์และวิทยุ'),
    ('สำนักบริหาร'),
    ('สำนักวิศวกรรม'),
    ('สำนักทรัพยากรมนุษย์'),
    ('สำนักตรวจสอบภายใน'),
    ('สำนักสร้างสรรค์เนื้อหา'),
    ('สำนักข่าว'),
    (
        'สำนักเครือข่ายและการมีส่วนร่วมสาธารณะ'
    ),
    ('คณะกรรมการนโยบาย'),
    ('คณะกรรมการบริหาร');

-- 2. TB_M_Department
INSERT INTO
    `TB_M_Department` (
        `DepartmentID`,
        `DepartmentName`,
        `InstitutionID`
    )
VALUES (1, 'ไม่มีฝ่าย', 1),
    (2, 'ฝ่ายเทคโนโลยีสารสนเทศ', 5), -- สังกัด สำนักวิศวกรรม
    (
        3,
        'ฝ่ายบริหารความเสี่ยงและธรรมาภิบาล',
        4
    ), -- สังกัด สำนักบริหาร
    (4, 'ฝ่ายยุทธศาสตร์องค์การ', 4), -- สังกัด สำนักบริหาร
    (
        5,
        'ฝ่ายสนับสนุนคณะกรรมการและผู้บริหาร',
        4
    ), -- สังกัด สำนักบริหาร
    (6, 'ศูนย์การเงิน', 4), -- สังกัด สำนักบริหาร
    (
        7,
        'ศูนย์สื่อสารวาระทางสังคมและนโยบายสาธารณะ',
        10
    ), -- สังกัด สำนักเครือข่ายฯ
    (8, 'ศูนย์ Thai PBS World', 9), -- สังกัด สำนักข่าว
    (
        9,
        'ศูนย์วิจัยและพัฒนาสื่อสาธารณะ',
        4
    ), -- สังกัด สำนักบริหาร (หรือวิศวกรรม)
    (
        10,
        'ศูนย์สื่อสารและส่งเสริมการตลาดเพื่อสาธารณะ',
        4
    ), -- สังกัด สำนักบริหาร
    (
        11,
        'ศูนย์พัฒนานวัตกรรมสื่อสาธารณะ',
        2
    ), -- สังกัด สำนักสื่อดิจิทัล
    (
        12,
        'ศูนย์พัฒนาระบบงานสารสนเทศ',
        5
    ), -- สังกัด สำนักวิศวกรรม
    (
        13,
        'ศูนย์สื่อสาธารณะเพื่อเด็กและการเรียนรู้',
        8
    ), -- สังกัด สำนักสร้างสรรค์เนื้อหา
    (
        14,
        'ศูนย์สื่อศิลปวัฒนธรรม',
        8
    ), -- สังกัด สำนักสร้างสรรค์เนื้อหา
    (
        15,
        'หน่วยสนับสนุนสภาผู้ชมและผู้ฟังรายการ',
        10
    );
-- สังกัด สำนักเครือข่ายฯ

-- 3. TB_M_Role
INSERT INTO `TB_M_Role` (`RoleName`) VALUES ('Admin'), ('User');

-- 4. TB_M_StatusEMP
INSERT INTO
    `TB_M_StatusEMP` (`StatusNameEMP`)
VALUES ('Active'),
    ('Inactive'),
    ('Resigned');

-- 5. TB_M_Category
INSERT INTO
    `TB_M_Category` (`CategoryID`, `CategoryName`)
VALUES (1, 'IT Equipment'),
    (2, 'Camera'),
    (3, 'Audio'),
    (4, 'Lighting'),
    (5, 'Accessories');

-- 6. TB_M_Brand
INSERT INTO
    `TB_M_Brand` (`BrandID`, `BrandName`)
VALUES (1, 'Sony'),
    (2, 'Canon'),
    (3, 'Panasonic'),
    (4, 'Apple'),
    (5, 'Dell'),
    (6, 'Shure'),
    (7, 'Sennheiser'),
    (8, 'Manfrotto');

-- 7. TB_M_Type
INSERT INTO
    `TB_M_Type` (`TypeID`, `TypeName`)
VALUES (1, 'Laptop'),
    (2, 'Desktop'),
    (3, 'Video Camera'),
    (4, 'DSLR/Mirrorless'),
    (5, 'Lens'),
    (6, 'Microphone'),
    (7, 'Tripod'),
    (8, 'Light Kit');

-- 8. TB_M_Model
INSERT INTO
    `TB_M_Model` (`ModelID`, `ModelName`)
VALUES (1, 'MacBook Pro 16'),
    (2, 'Dell Latitude 7420'),
    (3, 'Sony A7S III'),
    (4, 'Canon EOS R5'),
    (5, 'Sennheiser EW 100 G4'),
    (6, 'Manfrotto 504X'),
    (7, 'Panasonic Lumix GH6'),
    (8, 'Shure SM7B');

-- 9. TB_M_StatusDevice
INSERT INTO
    `TB_M_StatusDevice` (`StatusNameDV`)
VALUES ('ว่าง'),
    ('ถูกยืม'),
    ('ส่งซ่อม'),
    ('ชำรุด'),
    ('สูญหาย');

-- 13. TB_T_Device (ข้อมูลอุปกรณ์ตัวอย่าง)
INSERT INTO
    `TB_T_Device` (
        `devicename`,
        `CategoryID`,
        `BrandID`,
        `ModelID`,
        `DVStatusID`,
        `serialnumber`,
        `stickerid`,
        `TypeID`,
        `CreateBy`,
        `Brand`,
        `DeviceType`
    )
VALUES (
        'Sony Alpha A7S III',
        2,
        1,
        3,
        1,
        'SN12345678',
        'EQ-CAM-001',
        4,
        'System Admin',
        'Sony',
        'DSLR/Mirrorless'
    ),
    (
        'Canon EOS R5',
        2,
        2,
        4,
        1,
        'SN87654321',
        'EQ-CAM-002',
        4,
        'System Admin',
        'Canon',
        'DSLR/Mirrorless'
    ),
    (
        'MacBook Pro 16 M1',
        1,
        4,
        1,
        2,
        'C02XXXXX',
        'EQ-NB-001',
        1,
        'System Admin',
        'Apple',
        'Laptop'
    ),
    (
        'Sennheiser EW 100 G4',
        3,
        7,
        5,
        1,
        'SN112233',
        'EQ-AUD-001',
        6,
        'System Admin',
        'Sennheiser',
        'Microphone'
    ),
    (
        'Dell Latitude 7420',
        1,
        5,
        2,
        1,
        'DL123456',
        'EQ-NB-002',
        1,
        'System Admin',
        'Dell',
        'Laptop'
    ),
    (
        'Manfrotto 504X Tripod',
        5,
        8,
        6,
        1,
        'MN504X001',
        'EQ-ACC-001',
        7,
        'System Admin',
        'Manfrotto',
        'Tripod'
    ),
    (
        'Panasonic Lumix GH6',
        2,
        3,
        7,
        3,
        'PN987654',
        'EQ-CAM-003',
        4,
        'System Admin',
        'Panasonic',
        'DSLR/Mirrorless'
    ),
    (
        'Shure SM7B',
        3,
        6,
        8,
        1,
        'SH778899',
        'EQ-AUD-002',
        6,
        'System Admin',
        'Shure',
        'Microphone'
    );

-- 15. TB_T_Employee (ข้อมูลพนักงานตัวอย่างสำหรับ Dashboard)
INSERT INTO
    `TB_T_Employee` (
        `fname`,
        `lname`,
        `username`,
        `password`,
        `email`,
        `RoleID`,
        `EMPStatusID`,
        `InstitutionID`,
        `DepartmentID`
    )
VALUES (
        'System',
        'Admin',
        'admin',
        '$2a$10$YourHashedPasswordHere',
        'admin@system.com',
        1,
        1,
        1,
        1
    );

-- 16. TB_T_Borrow (ข้อมูลการยืมตัวอย่าง)
INSERT INTO
    `TB_T_Borrow` (
        `EMPID`,
        `BorrowDate`,
        `ReturnDate`,
        `Purpose`,
        `Status`,
        `CreatedDate`
    )
VALUES (
        1,
        CURDATE(),
        DATE_ADD(CURDATE(), INTERVAL 3 DAY),
        'ถ่ายทำรายการข่าว',
        'Pending',
        NOW()
    ),
    (
        1,
        DATE_SUB(CURDATE(), INTERVAL 5 DAY),
        DATE_SUB(CURDATE(), INTERVAL 2 DAY),
        'บันทึกภาพกิจกรรม',
        'Returned',
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    (
        1,
        DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        DATE_SUB(CURDATE(), INTERVAL 7 DAY),
        'ใช้งานนอกสถานที่',
        'Approved',
        DATE_SUB(NOW(), INTERVAL 10 DAY)
    );

-- 17. TB_T_BorrowDetail (รายละเอียดการยืมตัวอย่าง)
INSERT INTO
    `TB_T_BorrowDetail` (
        `BorrowID`,
        `ItemName`,
        `Quantity`,
        `Remark`
    )
VALUES (
        1,
        'Sony Alpha A7S III',
        1,
        ''
    ),
    (
        1,
        'Sennheiser EW 100 G4',
        2,
        ''
    ),
    (2, 'Canon EOS R5', 1, ''),
    (
        3,
        'Dell Latitude 7420',
        1,
        ''
    );

-- 18. TB_L_ActivityLog (ข้อมูล Log ตัวอย่าง)
INSERT INTO
    `TB_L_ActivityLog` (
        `ActionType`,
        `BorrowID`,
        `ActorID`,
        `Details`
    )
VALUES (
        'Approved',
        3,
        1,
        'Admin approved request'
    );

SELECT DVID, DeviceName, Brand, BrandID
FROM TB_T_Device
WHERE
    Brand IS NOT NULL
    AND Brand != ''
    AND BrandID IS NULL;

SET FOREIGN_KEY_CHECKS = 1;

DELETE FROM `TB_T_Borrow` WHERE `EMPID` = 1;

ALTER TABLE `TB_T_Borrow` DROP FOREIGN KEY `TB_T_Borrow_ibfk_1`;

ALTER TABLE `TB_T_Borrow`
ADD CONSTRAINT `TB_T_Borrow_ibfk_1` FOREIGN KEY (`EMPID`) REFERENCES `TB_T_Employee` (`EMPID`) ON DELETE CASCADE;