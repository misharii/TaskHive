<?php
// config/database.php - Database connection setup

class Database {
    // Database credentials
    private $host = "localhost";
    private $db_name = "taskhive";
    private $username = "root";  // Default XAMPP username
    private $password = "";      // Default XAMPP password (empty)
    private $conn;

    // Get database connection
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $e) {
            echo "Connection Error: " . $e->getMessage();
        }

        return $this->conn;
    }
}