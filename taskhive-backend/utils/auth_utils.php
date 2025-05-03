<?php
// utils/auth_utils.php - Authentication utility functions

// Start or resume session
function init_session() {
    if (session_status() == PHP_SESSION_NONE) {
        // Include the session configuration
        require_once __DIR__ . '/../config/session.php';
    }
}


// Verify if user is logged in
function is_authenticated() {
    init_session();
    return isset($_SESSION['user_id']);
}

// Get current user ID
function get_user_id() {
    init_session();
    return $_SESSION['user_id'] ?? null;
}

// Authenticate user and create session
function authenticate_user($user_id, $username) {
    init_session();
    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $username;
}

// Log out user by destroying session
function logout_user() {
    init_session();
    session_unset();
    session_destroy();
}

// Validate user credentials
function validate_credentials($conn, $username, $password) {
    $query = "SELECT user_id, username, password FROM users WHERE username = :username OR email = :email";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':email', $username); // Allow login with email too
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $id = $row['user_id'];
        $username = $row['username'];
        $hashed_password = $row['password'];
        
        // Verify password
        if (password_verify($password, $hashed_password)) {
            return [
                'user_id' => $id,
                'username' => $username
            ];
        }
    }
    
    return false;
}

// Generate a secure password hash
function hash_password($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

// Check if request requires authentication and validate
function require_authentication() {
    if (!is_authenticated()) {
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(array("message" => "Unauthorized", "authenticated" => false));
        exit();
    }
    return get_user_id();
}