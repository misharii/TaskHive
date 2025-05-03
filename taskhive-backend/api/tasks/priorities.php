<?php
// api/tasks/priorities.php - Get available task priorities

// Include required files
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../utils/auth_utils.php';
require_once '../../utils/response_utils.php';

// Set response content type to JSON
set_json_header();

// Validate request method
validate_request_method('GET');

// Require authentication
require_authentication();

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Query to get all priorities
$query = "SELECT priority_id, name, display_order FROM task_priorities ORDER BY display_order ASC";
$stmt = $conn->prepare($query);

try {
    $stmt->execute();
    $priorities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    send_success_response($priorities, "Task priorities retrieved successfully");
} catch(PDOException $e) {
    send_error_response("Error retrieving task priorities: " . $e->getMessage(), 500);
}