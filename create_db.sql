CREATE DATABASE patientrecord;
USE patientrecord;

-- creating table for patients

CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    disease VARCHAR(255), -- Store the disease name directly
    medical_info TEXT
);


CREATE USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2027';
GRANT ALL PRIVILEGES ON patientrecord.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;

-- create table for users
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    hashedPassword VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_details (
    user_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);