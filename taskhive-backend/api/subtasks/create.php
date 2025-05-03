<?php
// api/subtasks/create.php - Create a new subtask

// Include required files
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../utils/auth_utils.php';
require_once '../../utils/response_utils.php';

// Set response content type to JSON
set_json_header();

// Validate request method
validate_request_method('POST');

// Require authentication
$user_id = require_authentication();

// Get input data
$data = get_input_data();

// Validate required fields
validate_required_fields($data, ['task_id', 'title']);

// Sanitize input
$task_id = intval($data['task_id']);
$title = htmlspecialchars(strip_tags($data['title']));

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Check if task exists and belongs to the current user
$check_query = "SELECT task_id FROM tasks WHERE task_id = :task_id AND user_id = :user_id";
$check_stmt = $conn->prepare($check_query);
$check_stmt->bindParam(':task_id', $task_id);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->execute();

if ($check_stmt->rowCount() === 0) {
    send_error_response("Task not found or you don't have permission to add subtasks", 404);
}

// Prepare insert query
$query = "INSERT INTO subtasks (task_id, title) VALUES (:task_id, :title)";
$stmt = $conn->prepare($query);
$stmt->bindParam(':task_id', $task_id);
$stmt->bindParam(':title', $title);

try {
    $stmt->execute();
    $subtask_id = $conn->lastInsertId();
    
    // Get the newly created subtask
    $get_query = "SELECT subtask_id, task_id, title, is_completed, created_at, updated_at 
                 FROM subtasks 
                 WHERE subtask_id = :subtask_id";
    $get_stmt = $conn->prepare($get_query);
    $get_stmt->bindParam(':subtask_id', $subtask_id);
    $get_stmt->execute();
    
    $subtask = $get_stmt->fetch(PDO::FETCH_ASSOC);
    
    send_success_response($subtask, "Subtask created successfully");
} catch(PDOException $e) {
    send_error_response("Error creating subtask: " . $e->getMessage(), 500);
}