<?php
// api/tasks/create.php - Create a new task

// Include required files
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../utils/auth_utils.php';
require_once '../../utils/response_utils.php';

// Set response content type to JSON
set_json_header();

// Validate request method
validate_request_method('POST');

// Require authentication
$user_id = require_authentication();

// Get input data
$data = get_input_data();

// Validate required fields
validate_required_fields($data, ['title']);

// Sanitize input
$title = htmlspecialchars(strip_tags($data['title']));
$description = isset($data['description']) ? htmlspecialchars(strip_tags($data['description'])) : null;
$status_id = isset($data['status_id']) ? (int)$data['status_id'] : 1; // Default to "Backlog"
$priority_id = isset($data['priority_id']) ? (int)$data['priority_id'] : 2; // Default to "Medium"
$due_date = isset($data['due_date']) && !empty($data['due_date']) ? $data['due_date'] : null;

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Prepare query
$query = "INSERT INTO tasks (user_id, title, description, status_id, priority_id, due_date) 
          VALUES (:user_id, :title, :description, :status_id, :priority_id, :due_date)";

$stmt = $conn->prepare($query);

// Bind parameters
$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':title', $title);
$stmt->bindParam(':description', $description);
$stmt->bindParam(':status_id', $status_id);
$stmt->bindParam(':priority_id', $priority_id);
$stmt->bindParam(':due_date', $due_date);

// Execute the query
try {
    $stmt->execute();
    $task_id = $conn->lastInsertId();
    
    // Process tags if they exist
    if (isset($data['tags']) && is_array($data['tags']) && !empty($data['tags'])) {
        foreach ($data['tags'] as $tag_name) {
            $tag_name = htmlspecialchars(strip_tags($tag_name));
            
            // Check if tag exists
            $tag_query = "SELECT tag_id FROM tags WHERE user_id = :user_id AND name = :name";
            $tag_stmt = $conn->prepare($tag_query);
            $tag_stmt->bindParam(':user_id', $user_id);
            $tag_stmt->bindParam(':name', $tag_name);
            $tag_stmt->execute();
            
            if ($tag_stmt->rowCount() > 0) {
                // Tag exists, get the ID
                $tag_row = $tag_stmt->fetch(PDO::FETCH_ASSOC);
                $tag_id = $tag_row['tag_id'];
            } else {
                // Create new tag
                $new_tag_query = "INSERT INTO tags (user_id, name) VALUES (:user_id, :name)";
                $new_tag_stmt = $conn->prepare($new_tag_query);
                $new_tag_stmt->bindParam(':user_id', $user_id);
                $new_tag_stmt->bindParam(':name', $tag_name);
                $new_tag_stmt->execute();
                $tag_id = $conn->lastInsertId();
            }
            
            // Associate tag with task
            $task_tag_query = "INSERT INTO task_tags (task_id, tag_id) VALUES (:task_id, :tag_id)";
            $task_tag_stmt = $conn->prepare($task_tag_query);
            $task_tag_stmt->bindParam(':task_id', $task_id);
            $task_tag_stmt->bindParam(':tag_id', $tag_id);
            $task_tag_stmt->execute();
        }
    }
    
    // Process subtasks if they exist
    if (isset($data['subtasks']) && is_array($data['subtasks']) && !empty($data['subtasks'])) {
        foreach ($data['subtasks'] as $subtask_title) {
            $subtask_title = htmlspecialchars(strip_tags($subtask_title));
            
            $subtask_query = "INSERT INTO subtasks (task_id, title) VALUES (:task_id, :title)";
            $subtask_stmt = $conn->prepare($subtask_query);
            $subtask_stmt->bindParam(':task_id', $task_id);
            $subtask_stmt->bindParam(':title', $subtask_title);
            $subtask_stmt->execute();
        }
    }
    
    // Get the newly created task
    $get_task_query = "SELECT t.task_id, t.title, t.description, t.status_id, s.name as status_name, 
                      t.priority_id, p.name as priority_name, t.due_date, t.created_at, t.updated_at
                      FROM tasks t
                      JOIN task_statuses s ON t.status_id = s.status_id
                      JOIN task_priorities p ON t.priority_id = p.priority_id
                      WHERE t.task_id = :task_id";
    $get_task_stmt = $conn->prepare($get_task_query);
    $get_task_stmt->bindParam(':task_id', $task_id);
    $get_task_stmt->execute();
    
    $task = $get_task_stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get associated tags
    $tags_query = "SELECT t.tag_id, t.name, t.color
                  FROM tags t
                  JOIN task_tags tt ON t.tag_id = tt.tag_id
                  WHERE tt.task_id = :task_id";
    $tags_stmt = $conn->prepare($tags_query);
    $tags_stmt->bindParam(':task_id', $task_id);
    $tags_stmt->execute();
    
    $task['tags'] = $tags_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get subtasks
    $subtasks_query = "SELECT subtask_id, title, is_completed
                      FROM subtasks
                      WHERE task_id = :task_id";
    $subtasks_stmt = $conn->prepare($subtasks_query);
    $subtasks_stmt->bindParam(':task_id', $task_id);
    $subtasks_stmt->execute();
    
    $task['subtasks'] = $subtasks_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    send_success_response($task, "Task created successfully");
} catch(PDOException $e) {
    send_error_response("Error creating task: " . $e->getMessage(), 500);
}