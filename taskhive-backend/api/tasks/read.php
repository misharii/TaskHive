<?php
// api/tasks/read.php - Get all tasks for the current user

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
$user_id = require_authentication();

// Get query parameters for filtering
$status_id = isset($_GET['status_id']) ? intval($_GET['status_id']) : null;
$priority_id = isset($_GET['priority_id']) ? intval($_GET['priority_id']) : null;
$tag_id = isset($_GET['tag_id']) ? intval($_GET['tag_id']) : null;
$search = isset($_GET['search']) ? $_GET['search'] : null;

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Build the base query
$query = "SELECT t.task_id, t.title, t.description, t.status_id, s.name as status_name, 
          t.priority_id, p.name as priority_name, t.due_date, t.created_at, t.updated_at
          FROM tasks t
          JOIN task_statuses s ON t.status_id = s.status_id
          JOIN task_priorities p ON t.priority_id = p.priority_id
          WHERE t.user_id = :user_id";

// Add filters to query if they exist
$params = [':user_id' => $user_id];

if ($status_id) {
    $query .= " AND t.status_id = :status_id";
    $params[':status_id'] = $status_id;
}

if ($priority_id) {
    $query .= " AND t.priority_id = :priority_id";
    $params[':priority_id'] = $priority_id;
}

if ($tag_id) {
    $query .= " AND t.task_id IN (SELECT task_id FROM task_tags WHERE tag_id = :tag_id)";
    $params[':tag_id'] = $tag_id;
}

if ($search) {
    $query .= " AND (t.title LIKE :search OR t.description LIKE :search)";
    $search_param = "%$search%";
    $params[':search'] = $search_param;
}

// Add ordering
$query .= " ORDER BY t.status_id ASC, t.due_date ASC, t.updated_at DESC";

$stmt = $conn->prepare($query);

// Bind parameters
foreach ($params as $key => $value) {
    $stmt->bindParam($key, $value);
}

try {
    $stmt->execute();
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // For each task, get the associated tags and subtasks
    foreach ($tasks as &$task) {
        // Get tags
        $tags_query = "SELECT t.tag_id, t.name, t.color
                      FROM tags t
                      JOIN task_tags tt ON t.tag_id = tt.tag_id
                      WHERE tt.task_id = :task_id";
        $tags_stmt = $conn->prepare($tags_query);
        $tags_stmt->bindParam(':task_id', $task['task_id']);
        $tags_stmt->execute();
        $task['tags'] = $tags_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get subtasks
        $subtasks_query = "SELECT subtask_id, title, is_completed
                          FROM subtasks
                          WHERE task_id = :task_id";
        $subtasks_stmt = $conn->prepare($subtasks_query);
        $subtasks_stmt->bindParam(':task_id', $task['task_id']);
        $subtasks_stmt->execute();
        $task['subtasks'] = $subtasks_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate subtask completion
        $total_subtasks = count($task['subtasks']);
        $completed_subtasks = 0;
        
        foreach ($task['subtasks'] as $subtask) {
            if ($subtask['is_completed']) {
                $completed_subtasks++;
            }
        }
        
        $task['subtask_progress'] = $total_subtasks > 0 ? 
            round(($completed_subtasks / $total_subtasks) * 100) : 0;
    }
    
    send_success_response($tasks, "Tasks retrieved successfully");
} catch(PDOException $e) {
    send_error_response("Error retrieving tasks: " . $e->getMessage(), 500);
}