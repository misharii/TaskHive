<?php
// utils/response_utils.php - API response utility functions


// Set CORS headers
function set_cors_headers() {
    // Replace this with your actual frontend domain
    $allowed_origin = "https://taskhive.albuhairi.me";

    header("Access-Control-Allow-Origin: $allowed_origin");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");

    // Handle preflight requests
    if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
        http_response_code(204);
        exit();
    }
}

// Set JSON content type header
function set_json_header() {
    header("Content-Type: application/json; charset=UTF-8");
    set_cors_headers();

}

// Send a success response
function send_success_response($data = null, $message = "Success") {
    set_json_header();
    echo json_encode([
        "status" => "success",
        "message" => $message,
        "data" => $data
    ]);
    exit();
}

// Send an error response
function send_error_response($message = "Error", $code = 400) {
    set_json_header();
    
    // Set the HTTP response code
    http_response_code($code);
    
    echo json_encode([
        "status" => "error",
        "message" => $message
    ]);
    exit();
}

// Check if request method is the expected one
function validate_request_method($expected_method) {
    if ($_SERVER["REQUEST_METHOD"] !== $expected_method) {
        send_error_response("Method not allowed. Expected $expected_method.", 405);
    }
}

// Get and sanitize input data from various sources
function get_input_data() {
    // For GET requests
    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        return $_GET;
    }
    
    // For POST, PUT, DELETE with JSON body
    $content_type = isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : "";
    
    if (strpos($content_type, "application/json") !== false) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            send_error_response("Invalid JSON format", 400);
        }
        return $data;
    }
    
    // For POST/PUT with form data
    return $_POST;
}

// Validate required fields in the input data
function validate_required_fields($data, $required_fields) {
    $missing_fields = [];
    
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        send_error_response("Missing required fields: " . implode(", ", $missing_fields), 400);
    }
}