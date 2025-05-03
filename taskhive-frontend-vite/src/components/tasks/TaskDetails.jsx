//src/components/tasks/TaskDetails.jsx
import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiCalendar, FiCheckSquare, FiSquare, FiPlus, FiX } from 'react-icons/fi';
import { updateSubtask, createSubtask } from '../../api/tasks';

const TaskDetails = ({ task, onEdit, onDelete, onClose, onTaskUpdated }) => {
    const [newSubtask, setNewSubtask] = useState('');
    const [addingSubtask, setAddingSubtask] = useState(false);
    const [subtasks, setSubtasks] = useState(task.subtasks || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Format date to a user-friendly format
    const formatDate = (dateString) => {
        if (!dateString) return 'No due date';

        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) return 'Invalid date';

        return date.toLocaleDateString();
    };

    // Get priority styling based on priority name
    const getPriorityStyle = (priorityName) => {
        switch (priorityName?.toLowerCase()) {
            case 'high':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'low':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    // Get status styling based on status name
    const getStatusStyle = (statusName) => {
        switch (statusName?.toLowerCase()) {
            case 'backlog':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'todo':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'doing':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'done':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    // Toggle subtask completion
    const toggleSubtask = async (subtaskId, isCompleted) => {
        try {
            setLoading(true);
            setError('');

            console.log("----- SUBTASK TOGGLE DEBUG -----");
            console.log("Subtask ID:", subtaskId);
            console.log("Current is_completed value:", isCompleted);
            console.log("Current is_completed type:", typeof isCompleted);

            // Toggle the is_completed value: if it's 1 or true, set to 0; otherwise set to 1
            const newCompletedValue = isCompleted ? 0 : 1;

            console.log("Sending to API - is_completed:", newCompletedValue);
            console.log("Sending to API - is_completed type:", typeof newCompletedValue);

            const updateData = {
                subtask_id: parseInt(subtaskId),
                is_completed: newCompletedValue
            };

            console.log("Complete payload:", JSON.stringify(updateData));

            const response = await updateSubtask(updateData);
            console.log("Raw API response:", response);

            if (response.status === 'success') {
                console.log("SUCCESS - updating local state");
                setSubtasks(prevSubtasks =>
                    prevSubtasks.map(subtask =>
                        subtask.subtask_id === subtaskId
                            ? { ...subtask, is_completed: newCompletedValue }
                            : subtask
                    )
                );

                if (onTaskUpdated) {
                    onTaskUpdated();
                }
            } else {
                throw new Error(response.message || 'Failed to update subtask');
            }
        } catch (err) {
            console.error('Error updating subtask:', err);
            setError('Failed to update subtask: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtask.trim()) return;

        try {
            setLoading(true);
            setError('');

            const response = await createSubtask({
                task_id: task.task_id,
                title: newSubtask.trim()
            });

            if (response.status === 'success') {
                setSubtasks(prevSubtasks => [...prevSubtasks, response.data]);
                setNewSubtask('');
                setAddingSubtask(false);

                if (onTaskUpdated) {
                    onTaskUpdated();
                }
            } else {
                throw new Error(response.message || 'Failed to add subtask');
            }
        } catch (err) {
            console.error('Error adding subtask:', err);
            setError('Failed to add subtask');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{task.title}</h2>

                <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(task.status_name)}`}>
            {task.status_name}
          </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityStyle(task.priority_name)}`}>
            {task.priority_name}
          </span>
                </div>

                {task.description && (
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
                            {task.description}
                        </p>
                    </div>
                )}

                <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <FiCalendar className="mr-2" />
                        <span>Due: {formatDate(task.due_date)}</span>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subtasks</h3>

                    {subtasks.length === 0 && !addingSubtask ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No subtasks</p>
                    ) : (
                        <div className="space-y-2">
                            {subtasks.map((subtask) => (
                                <div
                                    key={subtask.subtask_id}
                                    className="flex items-start"
                                >
                                    <button
                                        onClick={() => toggleSubtask(subtask.subtask_id, subtask.is_completed)}
                                        className="mt-0.5 mr-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 focus:outline-none"
                                        disabled={loading}
                                    >
                                        {subtask.is_completed ? (
                                            <FiCheckSquare className="h-5 w-5" />
                                        ) : (
                                            <FiSquare className="h-5 w-5" />
                                        )}
                                    </button>
                                    <span className={`text-sm ${subtask.is_completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {subtask.title}
                  </span>
                                </div>
                            ))}

                            {addingSubtask && (
                                <div className="flex items-center space-x-2 mt-2">
                                    <input
                                        type="text"
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        placeholder="Enter subtask..."
                                        className="input text-sm py-1 flex-grow"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleAddSubtask}
                                        disabled={!newSubtask.trim() || loading}
                                        className="text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 p-1.5 rounded"
                                    >
                                        <FiPlus className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAddingSubtask(false);
                                            setNewSubtask('');
                                        }}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1.5"
                                    >
                                        <FiX className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {!addingSubtask && (
                        <button
                            onClick={() => setAddingSubtask(true)}
                            className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                            <FiPlus className="mr-1 h-4 w-4" />
                            Add subtask
                        </button>
                    )}
                </div>

                {task.tags && task.tags.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {task.tags.map((tag) => (
                                <span
                                    key={tag.tag_id}
                                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                >
                  {tag.name}
                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={onDelete}
                    className="flex items-center text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                >
                    <FiTrash2 className="mr-1" />
                    Delete
                </button>
                <button
                    onClick={onEdit}
                    className="flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                    <FiEdit2 className="mr-1" />
                    Edit
                </button>
                <button
                    onClick={onClose}
                    className="btn btn-secondary"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default TaskDetails;