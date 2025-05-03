<?php
// index.php - Main entry point
header("Content-Type: application/json");

// Display API welcome message if accessed directly
echo json_encode([
    "name" => "TaskHive API",
    "version" => "1.0.0",
    "message" => "Welcome to the TaskHive API. Please use the appropriate endpoints."
]);