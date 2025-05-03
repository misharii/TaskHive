// src/api/tasks.js
import api from './api';

// Get all tasks without filters - simply list all tasks
export const getTasks = async () => {
    try {
        // Just get all tasks without any parameters
        const response = await api.get('/tasks/read.php');
        return response;
    } catch (error) {
        console.error("Error in getTasks:", error);
        throw error.response?.data || error;
    }
};

// Create a new task
export const createTask = async (taskData) => {
    try {
        const response = await api.post('/tasks/create.php', taskData);
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Update a task
export const updateTask = async (taskData) => {
    try {
        console.log("Sending update task request with data:", taskData);

        // Ensure we have a task_id
        if (!taskData.task_id) {
            throw new Error("Task ID is required for updates");
        }

        // Remove any undefined or null values
        const cleanData = Object.entries(taskData)
            .filter(([_, value]) => value !== null && value !== undefined)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});

        const response = await api.put('/tasks/update.php', cleanData);
        console.log("Update task response:", response);
        return response;
    } catch (error) {
        console.error("Update task error:", error);
        throw error.response?.data || error;
    }
};

// Delete a task
export const deleteTask = async (taskId) => {
    try {
        const response = await api.delete('/tasks/delete.php', {
            data: { task_id: taskId }
        });
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Delete a subtask
export const deleteSubtask = async (subtaskId) => {
    try {
        const response = await api.delete('/subtasks/delete.php', {
            data: { subtask_id: parseInt(subtaskId) }
        });
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get task statuses
export const getTaskStatuses = async () => {
    try {
        const response = await api.get('/tasks/statuses.php');
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get task priorities
export const getTaskPriorities = async () => {
    try {
        const response = await api.get('/tasks/priorities.php');
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Create a subtask
export const createSubtask = async (subtaskData) => {
    try {
        const response = await api.post('/subtasks/create.php', subtaskData);
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Update a subtask
export const updateSubtask = async (subtaskData) => {
    try {
        const response = await api.put('/subtasks/update.php', subtaskData);
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get tags
export const getTags = async () => {
    try {
        const response = await api.get('/tags/read.php');
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};