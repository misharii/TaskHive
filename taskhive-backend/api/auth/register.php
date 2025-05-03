<?php
// api/auth/register.php - User registration endpoint

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
validate_required_fields($data, ['username', 'email', 'password']);

// Sanitize input
$username = htmlspecialchars(strip_tags($data['username']));
$email = htmlspecialchars(strip_tags($data['email']));
$password = $data['password']; // Will be hashed before storage

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Check if username or email already exists
$check_query = "SELECT user_id FROM users WHERE username = :username OR email = :email";
$check_stmt = $conn->prepare($check_query);
$check_stmt->bindParam(':username', $username);
$check_stmt->bindParam(':email', $email);
$check_stmt->execute();

if ($check_stmt->rowCount() > 0) {
    send_error_response("Username or email already exists.", 409);
}

// Hash password
$hashed_password = hash_password($password);

// Prepare the insert query
$query = "INSERT INTO users (username, email, password) VALUES (:username, :email, :password)";
$stmt = $conn->prepare($query);

// Bind parameters
$stmt->bindParam(':username', $username);
$stmt->bindParam(':email', $email);
$stmt->bindParam(':password', $hashed_password);

// Execute the query
try {
    $stmt->execute();
    $user_id = $conn->lastInsertId();
    
    // Create session for the new user
    authenticate_user($user_id, $username);
    
    // Return success response
    send_success_response([
        'user_id' => $user_id,
        'username' => $username,
        'email' => $email
    ], "Registration successful");
    
} catch(PDOException $e) {
    send_error_response("Registration failed: " . $e->getMessage(), 500);
}