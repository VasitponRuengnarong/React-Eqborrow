-- Active: 1769497819742@@127.0.0.1@3307@ebrs_system
-- Run this SQL to fix the missing table error
CREATE TABLE IF NOT EXISTS TB_L_StockMovement (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT,
    MovementType ENUM('IN', 'OUT'),
    ChangeAmount INT,
    OldQuantity INT,
    NewQuantity INT,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TB_T_Favorite (
    FavoriteID INT AUTO_INCREMENT PRIMARY KEY,
    EMPID INT NOT NULL,
    DVID INT NOT NULL,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fav (EMPID, DVID)
);

-- Add Brand and Type columns to TB_T_Device
ALTER TABLE TB_T_Device ADD COLUMN Brand VARCHAR(100) DEFAULT NULL;
ALTER TABLE TB_T_Device ADD COLUMN DeviceType VARCHAR(100) DEFAULT NULL;