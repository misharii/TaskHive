<?php
// api/auth/logout.php - User logout endpoint

// Include required files
require_once '../../config/cors.php';
require_once '../../utils/auth_utils.php';
require_once '../../utils/response_utils.php';

// Set response content type to JSON
set_json_header();

// Validate request method
validate_request_method('POST');

// If user is already logged in, log them out
if (is_authenticated()) {
    logout_user();
    send_success_response(null, "Logout successful");
} else {
    send_error_response("No active session", 400);
}