-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS eqborrow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eqborrow_db;

-- Step 2: Create Tables

-- 2.1 Departments
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 Member Types
CREATE TABLE member_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- e.g., Staff, Intern, Outsider
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.3 Members
CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., Employee ID
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    department_id INT,
    member_type_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (member_type_id) REFERENCES member_types(id)
);

-- 2.4 Categories (for Equipment)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.5 Products / Equipment
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE, -- Asset Tag
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category_id INT,
    total_quantity INT DEFAULT 1,
    remaining_quantity INT DEFAULT 1,
    image_url VARCHAR(255),
    status ENUM('active', 'maintenance', 'retired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 2.6 Users (Admins/Staff who manage the system)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.7 Borrow Transactions
CREATE TABLE borrow_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., BR-2023-001
    member_id INT NOT NULL,
    product_id INT NOT NULL,
    user_id INT, -- Who processed the borrow
    borrow_date DATETIME NOT NULL,
    due_date DATETIME NOT NULL,
    return_date DATETIME,
    status ENUM('borrowed', 'returned', 'overdue', 'lost') DEFAULT 'borrowed',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2.8 System Settings (For Admin Control Page)
CREATE TABLE page_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_name VARCHAR(100) NOT NULL,
    filename VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 3: Insert Mock Data (Based on your JS files)

-- Departments
INSERT INTO departments (name) VALUES ('Production'), ('IT'), ('News');

-- Member Types
INSERT INTO member_types (name) VALUES ('Employee'), ('Intern');

-- Categories
INSERT INTO categories (name) VALUES ('Camera'), ('Audio'), ('Lighting'), ('Accessories');

-- Page Settings (From admin_control.html)
INSERT INTO page_settings (page_name, filename, is_enabled) VALUES 
('หน้าหลัก', 'dashboard.html', 1),
('รายการชำระเงิน', 'payment.html', 1),
('หมวดหมู่สินค้า', 'category.html', 1),
('สินค้า', 'product.html', 1),
('เเผนก', 'department.html', 1),
('ประเภทสมาชิก', 'member_type.html', 1),
('สมาชิก', 'member.html', 1),
('ผู้ใช้งาน', 'profile.html', 1),
('ยืม-คืน', 'borrow_return.html', 1),
('รายการคงเหลือ', 'remaining.html', 1);