USE ebrs_system;

SET NAMES utf8mb4;

-- 1. Master Data: Departments & Institutions
INSERT IGNORE INTO
    TB_M_Institution (
        InstitutionID,
        InstitutionName
    )
VALUES (1, 'ไม่มีสำนัก'),
    (2, 'สำนักสื่อดิจิทัล'),
    (3, 'สำนักโทรทัศน์และวิทยุ'),
    (4, 'สำนักบริหาร'),
    (5, 'สำนักวิศวกรรม'),
    (6, 'สำนักทรัพยากรมนุษย์'),
    (7, 'สำนักตรวจสอบภายใน'),
    (8, 'สำนักสร้างสรรค์เนื้อหา'),
    (9, 'สำนักข่าว'),
    (
        10,
        'สำนักเครือข่ายและการมีส่วนร่วมสาธารณะ'
    ),
    (11, 'คณะกรรมการนโยบาย'),
    (12, 'คณะกรรมการบริหาร');

INSERT IGNORE INTO
    TB_M_Department (
        DepartmentID,
        DepartmentName,
        InstitutionID
    )
VALUES (1, 'ไม่มีฝ่าย', 1),
    (2, 'ฝ่ายเทคโนโลยีสารสนเทศ', 5),
    (
        3,
        'ฝ่ายบริหารความเสี่ยงและธรรมาภิบาล',
        4
    ),
    (4, 'ฝ่ายยุทธศาสตร์องค์การ', 4),
    (
        5,
        'ฝ่ายสนับสนุนคณะกรรมการและผู้บริหาร',
        12
    ),
    (6, 'ศูนย์การเงิน', 4),
    (
        7,
        'ศูนย์สื่อสารวาระทางสังคมและนโยบายสาธารณะ',
        10
    ),
    (8, 'ศูนย์ Thai PBS World', 9),
    (
        9,
        'ศูนย์วิจัยและพัฒนาสื่อสาธารณะ',
        2
    ),
    (
        10,
        'ศูนย์สื่อสารและส่งเสริมการตลาดเพื่อสาธารณะ',
        4
    ),
    (
        11,
        'ศูนย์พัฒนานวัตกรรมสื่อสาธารณะ',
        2
    ),
    (
        12,
        'ศูนย์พัฒนาระบบงานสารสนเทศ',
        5
    ),
    (
        13,
        'ศูนย์สื่อสาธารณะเพื่อเด็กและการเรียนรู้',
        8
    ),
    (
        14,
        'ศูนย์สื่อศิลปวัฒนธรรม',
        8
    ),
    (
        15,
        'หน่วยสนับสนุนสภาผู้ชมและผู้ฟังรายการ',
        10
    );

-- 2. Master Data: Roles & Status
INSERT IGNORE INTO
    TB_M_Role (RoleName)
VALUES ('Admin'),
    ('User');

INSERT IGNORE INTO
    TB_M_StatusEMP (StatusNameEMP)
VALUES ('พนักงานประจำ'),
    ('ลูกจ้างชั่วคราว'),
    ('ทดลองงาน'),
    ('ลาออก');

-- 3. Master Data: Device Categories & Attributes
INSERT IGNORE INTO
    TB_M_Category (CategoryName)
VALUES ('กล้อง (Camera)'),
    ('เลนส์ (Lens)'),
    ('ขาตั้งกล้อง (Tripod)'),
    ('ไมโครโฟน (Microphone)'),
    ('ไฟ (Lighting)'),
    (
        'อุปกรณ์ตัดต่อ (Editing console)'
    ),
    ('โดรน (Drone)'),
    ('อุปกรณ์เสริม (Accessories)');

INSERT IGNORE INTO
    TB_M_Brand (BrandName)
VALUES ('Sony'),
    ('Canon'),
    ('Nikon'),
    ('Panasonic'),
    ('Blackmagic'),
    ('Sennheiser'),
    ('Rode'),
    ('Manfrotto'),
    ('DJI'),
    ('Aputure'),
    ('Apple'),
    ('Dell');

INSERT IGNORE INTO
    TB_M_Type (TypeName)
VALUES ('DSLR'),
    ('Mirrorless'),
    ('Cinema Camera'),
    ('Action Camera'),
    ('Boom Mic'),
    ('Wireless Mic'),
    ('LED Panel'),
    ('Softbox'),
    ('Carbon Fiber'),
    ('Aluminum');

INSERT IGNORE INTO
    TB_M_Model (ModelName)
VALUES ('Alpha A7 IV'),
    ('EOS R5'),
    ('Lumix GH6'),
    ('Pocket 6K'),
    ('Mavic 3'),
    ('VideoMic Pro'),
    ('MK055XPRO3'),
    ('Amaran 200d');

INSERT IGNORE INTO
    TB_M_StatusDevice (StatusNameDV)
VALUES ('ว่าง'),
    ('ถูกยืม'),
    ('ส่งซ่อม'),
    ('ชำรุด'),
    ('สูญหาย'),
    ('ระงับใช้งาน');

-- 4. Employees (Users)
-- Admin User
INSERT IGNORE INTO
    TB_T_Employee (
        fname,
        lname,
        EMP_NUM,
        username,
        email,
        phone,
        password,
        RoleID,
        InstitutionID,
        DepartmentID,
        EMPStatusID,
        created_at
    )
VALUES (
        'Adisorn',
        'Admin',
        'E001',
        'admin',
        'admin@thaipbs.or.th',
        '0812345678',
        '$2b$10$X7V.P.Q.R.S.T.U.V.W.X.Y.Z.0123456789abcdef',
        1,
        1,
        2,
        1,
        NOW()
    );
-- Password is 'password' (This is just a mock hash, in real app use bcrypt)

-- Regular Users
INSERT IGNORE INTO
    TB_T_Employee (
        fname,
        lname,
        EMP_NUM,
        username,
        email,
        phone,
        password,
        RoleID,
        InstitutionID,
        DepartmentID,
        EMPStatusID,
        created_at
    )
VALUES (
        'Somchai',
        'Jai-dee',
        'E002',
        'somchai',
        'somchai@thaipbs.or.th',
        '0898765432',
        '$2b$10$X7V.P.Q.R.S.T.U.V.W.X.Y.Z.0123456789abcdef',
        2,
        2,
        4,
        1,
        NOW()
    ),
    (
        'Suda',
        'Rak-ngan',
        'E003',
        'suda',
        'suda@thaipbs.or.th',
        '0865432109',
        '$2b$10$X7V.P.Q.R.S.T.U.V.W.X.Y.Z.0123456789abcdef',
        2,
        3,
        6,
        1,
        NOW()
    );

-- 5. Devices (Assets)
INSERT IGNORE INTO
    TB_T_Device (
        devicename,
        DeviceCode,
        CategoryID,
        BrandID,
        ModelID,
        DVStatusID,
        serialnumber,
        stickerid,
        Brand,
        DeviceType,
        Price,
        Quantity,
        Description,
        CreateBy,
        CreateDate
    )
VALUES (
        'Sony A7 IV Kit',
        'CAM-001',
        1,
        1,
        1,
        1,
        'SN12345678',
        'STK001',
        'Sony',
        'Mirrorless',
        85000.00,
        1,
        'กล้อง Full Frame ความละเอียดสูง เหมาะสำหรับถ่ายวิดีโอ 4K',
        'System',
        NOW()
    ),
    (
        'Canon EOS R5 Body',
        'CAM-002',
        1,
        2,
        2,
        1,
        'SN87654321',
        'STK002',
        'Canon',
        'Mirrorless',
        120000.00,
        1,
        'กล้องความละเอียด 45MP ถ่ายวิดีโอ 8K RAW ได้',
        'System',
        NOW()
    ),
    (
        'Sennheiser MKH 416',
        'MIC-001',
        4,
        6,
        NULL,
        1,
        'SN11223344',
        'STK003',
        'Sennheiser',
        'Shotgun Mic',
        35000.00,
        1,
        'ไมค์ช็อตกันคุณภาพสูง สำหรับงานโปรดักชั่น',
        'System',
        NOW()
    ),
    (
        'DJI Mavic 3 Cine',
        'DRN-001',
        7,
        9,
        5,
        2,
        'SN55667788',
        'STK004',
        'DJI',
        'Drone',
        180000.00,
        1,
        'โดรนถ่ายภาพยนตร์ รองรับ Apple ProRes',
        'System',
        NOW()
    ),
    (
        'Manfrotto 055 Carbon',
        'TRI-001',
        3,
        8,
        7,
        1,
        'SN99887766',
        'STK005',
        'Manfrotto',
        'Carbon Fiber',
        15000.00,
        1,
        'ขาตั้งกล้องคาร์บอน น้ำหนักเบา แข็งแรง',
        'System',
        NOW()
    ),
    (
        'Aputure 300d II',
        'LIG-001',
        5,
        10,
        8,
        3,
        'SN44332211',
        'STK006',
        'Aputure',
        'LED',
        25000.00,
        1,
        'ไฟ LED กำลังสูง แสง Daylight',
        'System',
        NOW()
    );

-- 6. Borrow Transactions (History)
INSERT IGNORE INTO
    TB_T_Borrow (
        EMPID,
        BorrowDate,
        ReturnDate,
        Purpose,
        Status,
        CreatedDate
    )
VALUES (
        2,
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        'ถ่ายทำข่าวภาคสนาม',
        'Returned',
        DATE_SUB(NOW(), INTERVAL 5 DAY)
    ),
    (
        3,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        DATE_ADD(NOW(), INTERVAL 1 DAY),
        'ถ่ายรายการสารคดี',
        'Approved',
        DATE_SUB(NOW(), INTERVAL 2 DAY)
    );

);