<?php
// api/subtasks/delete.php - Delete a subtask

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

// Get subtask ID from URL parameter or request body
$subtask_id = isset($_GET['subtask_id']) ? intval($_GET['subtask_id']) : null;

// If subtask_id is not in URL, check in request body
if (!$subtask_id) {
    $data = get_input_data();
    $subtask_id = isset($data['subtask_id']) ? intval($data['subtask_id']) : null;
}

// Validate subtask_id
if (!$subtask_id) {
    send_error_response("Subtask ID is required", 400);
}

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Check if subtask exists and belongs to a task owned by the current user
$check_query = "SELECT s.subtask_id 
                FROM subtasks s
                JOIN tasks t ON s.task_id = t.task_id
                WHERE s.subtask_id = :subtask_id AND t.user_id = :user_id";
                
$check_stmt = $conn->prepare($check_query);
$check_stmt->bindParam(':subtask_id', $subtask_id);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->execute();

if ($check_stmt->rowCount() === 0) {
    send_error_response("Subtask not found or you don't have permission to delete it", 404);
}

// Delete the subtask
$query = "DELETE FROM subtasks WHERE subtask_id = :subtask_id";
$stmt = $conn->prepare($query);
$stmt->bindParam(':subtask_id', $subtask_id);
    
try {
    $stmt->execute();
    send_success_response(null, "Subtask deleted successfully");
} catch(PDOException $e) {
    send_error_response("Error deleting subtask: " . $e->getMessage(), 500);
}