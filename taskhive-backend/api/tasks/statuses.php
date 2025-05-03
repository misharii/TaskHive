<?php
// api/tasks/statuses.php - Get available task statuses

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

// Query to get all statuses
$query = "SELECT status_id, name, display_order FROM task_statuses ORDER BY display_order ASC";
$stmt = $conn->prepare($query);



try {
    session_start();
    
    $stmt->execute();
    $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Attach username to each status object
    foreach ($statuses as &$status) {
        $status['_username'] = $_SESSION['username'] ?? null;
        // We only need to do this for the first item since the frontend can read it from any item
        break;
    }
    
    send_success_response($statuses, "Task statuses retrieved successfully");
    
} catch(PDOException $e) {
    send_error_response("Error retrieving task statuses: " . $e->getMessage(), 500);
}


// try {
//     session_start();

//     $stmt->execute();
//     $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    
    
//     send_success_response($statuses, "Task statuses retrieved successfully");
// } catch(PDOException $e) {
//     send_error_response("Error retrieving task statuses: " . $e->getMessage(), 500);
// }