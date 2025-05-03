<?php
// api/subtasks/update.php - Update a subtask

// --- DEBUG LOGGING ---
error_log("--- SUBTASK UPDATE DEBUG ---");
error_log("Raw input: " . file_get_contents("php://input"));

// Include required files
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../utils/auth_utils.php';
require_once '../../utils/response_utils.php';

// Set response content type to JSON
set_json_header();

// Validate request method
validate_request_method('PUT');

// Require authentication
$user_id = require_authentication();

// Get input data
$data = get_input_data();
error_log("Parsed data: " . print_r($data, true));

// Validate required fields
validate_required_fields($data, ['subtask_id']);

// Sanitize input
$subtask_id = intval($data['subtask_id']);

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Check if subtask exists and belongs to the current user's task
$check_query = "SELECT s.subtask_id 
               FROM subtasks s
               JOIN tasks t ON s.task_id = t.task_id
               WHERE s.subtask_id = :subtask_id AND t.user_id = :user_id";
$check_stmt = $conn->prepare($check_query);
$check_stmt->bindParam(':subtask_id', $subtask_id);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->execute();

if ($check_stmt->rowCount() === 0) {
    send_error_response("Subtask not found or you don't have permission to update it", 404);
}

// Build update fields
$update_fields = [];
$params = [':subtask_id' => $subtask_id];

if (isset($data['title'])) {
    $title = htmlspecialchars(strip_tags($data['title']));
    $update_fields[] = "title = :title";
    $params[':title'] = $title;
}

if (isset($data['is_completed'])) {
    // Force the value to be exactly integer 1 or 0
    // Use intval to ensure it's a proper integer
    $is_completed = intval($data['is_completed']) ? 1 : 0;
    error_log("is_completed raw value: " . print_r($data['is_completed'], true) . " (type: " . gettype($data['is_completed']) . ")");
    error_log("is_completed converted value: $is_completed");
    $update_fields[] = "is_completed = :is_completed";
    $params[':is_completed'] = $is_completed;
}

// If no fields to update, just return success
if (empty($update_fields)) {
    send_success_response(null, "No changes to update");
}

// Build the update query
$query = "UPDATE subtasks SET " . implode(", ", $update_fields) . " WHERE subtask_id = :subtask_id";
error_log("Update query: $query");
error_log("Parameters: " . print_r($params, true));

$stmt = $conn->prepare($query);

foreach ($params as $key => $value) {
    // Use the proper PDO parameter type for integers
    if ($key === ':is_completed' || $key === ':subtask_id') {
        $stmt->bindValue($key, $value, PDO::PARAM_INT);
    } else {
        $stmt->bindParam($key, $value);
    }
}

try {
    $stmt->execute();

    // Direct verification after update
    $verify_query = "SELECT is_completed FROM subtasks WHERE subtask_id = :subtask_id";
    $verify_stmt = $conn->prepare($verify_query);
    $verify_stmt->bindParam(':subtask_id', $subtask_id);
    $verify_stmt->execute();
    $verify_result = $verify_stmt->fetch(PDO::FETCH_ASSOC);
    error_log("Verification after update: " . print_r($verify_result, true));

    // Get the updated subtask
    $get_query = "SELECT subtask_id, task_id, title, is_completed, created_at, updated_at 
                 FROM subtasks 
                 WHERE subtask_id = :subtask_id";
    $get_stmt = $conn->prepare($get_query);
    $get_stmt->bindParam(':subtask_id', $subtask_id);
    $get_stmt->execute();

    $subtask = $get_stmt->fetch(PDO::FETCH_ASSOC);

    send_success_response($subtask, "Subtask updated successfully");
} catch(PDOException $e) {
    send_error_response("Error updating subtask: " . $e->getMessage(), 500);
}
