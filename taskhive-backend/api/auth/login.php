<?php
// api/auth/login.php - User login endpoint

// Include required files
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../utils/auth_utils.php';
require_once '../../utils/response_utils.php';

// Set response content type to JSON
set_json_header();


// Validate request method
validate_request_method('POST');

// Get input data
$data = get_input_data();

// Validate required fields
validate_required_fields($data, ['username', 'password']);

// Sanitize input
$username = htmlspecialchars(strip_tags($data['username']));
$password = $data['password'];

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Validate credentials
$user = validate_credentials($conn, $username, $password);

if ($user) {
    // Create session for the user
    authenticate_user($user['user_id'], $user['username']);
    
    // Return success response
    send_success_response([
        'user_id' => $user['user_id'],
        'username' => $user['username']
    ], "Login successful");
} else {
    send_error_response("Invalid username or password", 401);
}