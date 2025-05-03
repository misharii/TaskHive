<?php
// api/tasks/update.php - Update an existing task

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
error_log("Task update input data: " . json_encode($data)); // Add logging to debug

// Validate required fields
validate_required_fields($data, ['task_id']);

// Get task ID
$task_id = intval($data['task_id']);

// Create database connection
$database = new Database();
$conn = $database->getConnection();

// Check if task exists and belongs to the current user
$check_query = "SELECT task_id FROM tasks WHERE task_id = :task_id AND user_id = :user_id";
$check_stmt = $conn->prepare($check_query);
$check_stmt->bindParam(':task_id', $task_id);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->execute();

if ($check_stmt->rowCount() === 0) {
    send_error_response("Task not found or you don't have permission to update it", 404);
}

// Build update fields
$update_fields = [];
$params = [':task_id' => $task_id];

// FIX: Use bindValue instead of bindParam, and ensure proper handling of string values
if (isset($data['title'])) {
    $title = htmlspecialchars(strip_tags($data['title']));
    $update_fields[] = "title = :title";
    $params[':title'] = $title; // Store the processed value
}

if (isset($data['description'])) {
    $description = htmlspecialchars(strip_tags($data['description']));
    $update_fields[] = "description = :description";
    $params[':description'] = $description; // Store the processed value
}

if (isset($data['status_id'])) {
    $status_id = intval($data['status_id']);
    $update_fields[] = "status_id = :status_id";
    $params[':status_id'] = $status_id;
}

if (isset($data['priority_id'])) {
    $priority_id = intval($data['priority_id']);
    $update_fields[] = "priority_id = :priority_id";
    $params[':priority_id'] = $priority_id;
}

if (isset($data['due_date'])) {
    $due_date = $data['due_date'];
    $update_fields[] = "due_date = :due_date";
    $params[':due_date'] = $due_date;
}

// If no fields to update, just return success
if (empty($update_fields)) {
    send_success_response(null, "No changes to update");
}

// Build the update query
$query = "UPDATE tasks SET " . implode(", ", $update_fields) . " WHERE task_id = :task_id";
$stmt = $conn->prepare($query);

// FIX: Use bindValue instead of bindParam for consistent value binding
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}

try {
    // Begin transaction
    $conn->beginTransaction();
    
    // Execute the update query
    $stmt->execute();
    
    // Update tags if provided
    if (isset($data['tags']) && is_array($data['tags'])) {
        // Remove existing tags
        $delete_tags_query = "DELETE FROM task_tags WHERE task_id = :task_id";
        $delete_tags_stmt = $conn->prepare($delete_tags_query);
        $delete_tags_stmt->bindValue(':task_id', $task_id);
        $delete_tags_stmt->execute();
        
        // Add new tags
        foreach ($data['tags'] as $tag_name) {
            $tag_name = htmlspecialchars(strip_tags($tag_name));
            
            // Check if tag exists
            $tag_query = "SELECT tag_id FROM tags WHERE user_id = :user_id AND name = :name";
            $tag_stmt = $conn->prepare($tag_query);
            $tag_stmt->bindValue(':user_id', $user_id);
            $tag_stmt->bindValue(':name', $tag_name);
            $tag_stmt->execute();
            
            if ($tag_stmt->rowCount() > 0) {
                // Tag exists, get the ID
                $tag_row = $tag_stmt->fetch(PDO::FETCH_ASSOC);
                $tag_id = $tag_row['tag_id'];
            } else {
                // Create new tag
                $new_tag_query = "INSERT INTO tags (user_id, name) VALUES (:user_id, :name)";
                $new_tag_stmt = $conn->prepare($new_tag_query);
                $new_tag_stmt->bindValue(':user_id', $user_id);
                $new_tag_stmt->bindValue(':name', $tag_name);
                $new_tag_stmt->execute();
                $tag_id = $conn->lastInsertId();
            }
            
            // Associate tag with task
            $task_tag_query = "INSERT INTO task_tags (task_id, tag_id) VALUES (:task_id, :tag_id)";
            $task_tag_stmt = $conn->prepare($task_tag_query);
            $task_tag_stmt->bindValue(':task_id', $task_id);
            $task_tag_stmt->bindValue(':tag_id', $tag_id);
            $task_tag_stmt->execute();
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    // Get the updated task
    $get_task_query = "SELECT t.task_id, t.title, t.description, t.status_id, s.name as status_name, 
                      t.priority_id, p.name as priority_name, t.due_date, t.created_at, t.updated_at
                      FROM tasks t
                      JOIN task_statuses s ON t.status_id = s.status_id
                      JOIN task_priorities p ON t.priority_id = p.priority_id
                      WHERE t.task_id = :task_id";
    $get_task_stmt = $conn->prepare($get_task_query);
    $get_task_stmt->bindValue(':task_id', $task_id);
    $get_task_stmt->execute();
    
    $task = $get_task_stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get associated tags
    $tags_query = "SELECT t.tag_id, t.name, t.color
                  FROM tags t
                  JOIN task_tags tt ON t.tag_id = tt.tag_id
                  WHERE tt.task_id = :task_id";
    $tags_stmt = $conn->prepare($tags_query);
    $tags_stmt->bindValue(':task_id', $task_id);
    $tags_stmt->execute();
    
    $task['tags'] = $tags_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get subtasks
    $subtasks_query = "SELECT subtask_id, title, is_completed
                      FROM subtasks
                      WHERE task_id = :task_id";
    $subtasks_stmt = $conn->prepare($subtasks_query);
    $subtasks_stmt->bindValue(':task_id', $task_id);
    $subtasks_stmt->execute();
    
    $task['subtasks'] = $subtasks_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Log the final task data for debugging
    error_log("Updated task: " . json_encode($task));
    
    send_success_response($task, "Task updated successfully");
} catch(PDOException $e) {
    // Rollback the transaction if an error occurs
    $conn->rollBack();
    error_log("PDO Error: " . $e->getMessage());
    send_error_response("Error updating task: " . $e->getMessage(), 500);
}