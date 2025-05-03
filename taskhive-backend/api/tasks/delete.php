<?php
// api/tasks/delete.php - Delete a task

// Include required files
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../utils/auth_utils.php';
require_once '../../utils/response_utils.php';

// Set response content type to JSON
set_json_header();

// Validate request method
validate_request_method('DELETE');

// Require authentication
$user_id = require_authentication();

// Get task ID from URL parameter or request body
$task_id = isset($_GET['task_id']) ? intval($_GET['task_id']) : null;

// If task_id is not in URL, check in request body
if (!$task_id) {
    $data = get_input_data();
    $task_id = isset($data['task_id']) ? intval($data['task_id']) : null;
}

// Validate task_id
if (!$task_id) {
    send_error_response("Task ID is required", 400);
}

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
    send_error_response("Task not found or you don't have permission to delete it", 404);
}

// Delete the task
$query = "DELETE FROM tasks WHERE task_id = :task_id";
$stmt = $conn->prepare($query);
$stmt->bindParam(':task_id', $task_id);

try {
    $stmt->execute();
    send_success_response(null, "Task deleted successfully");
} catch(PDOException $e) {
    send_error_response("Error deleting task: " . $e->getMessage(), 500);
}