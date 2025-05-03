
// src/components/tasks/TaskForm.jsx
import React, { useState, useEffect } from 'react';
import { getTaskStatuses, getTaskPriorities, createTask, createSubtask, updateTask, deleteSubtask } from '../../api/tasks';

const TaskForm = ({ task = null, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status_id: '',
        priority_id: '',
        due_date: '',
        subtasks: []
    });

    const [statuses, setStatuses] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [newSubtask, setNewSubtask] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [removedSubtaskIds, setRemovedSubtaskIds] = useState([]);

    // Load statuses and priorities on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch statuses
                const statusesResponse = await getTaskStatuses();
                if (statusesResponse.status === 'success') {
                    setStatuses(statusesResponse.data || []);
                }

                // Fetch priorities
                const prioritiesResponse = await getTaskPriorities();
                if (prioritiesResponse.status === 'success') {
                    setPriorities(prioritiesResponse.data || []);
                }
            } catch (err) {
                console.error('Error fetching form data:', err);
                setError('Failed to load form data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // If editing a task, populate the form
    useEffect(() => {
        if (task) {
            console.log("Loading task data for editing:", task);
            setFormData({
                task_id: task.task_id,
                title: task.title || '',
                description: task.description || '',
                status_id: task.status_id || '',
                priority_id: task.priority_id || '',
                due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
                subtasks: task.subtasks ? [...task.subtasks.map(st => ({ ...st, isNew: false }))] : []
            });
            // Reset removed subtasks array when a new task is loaded
            setRemovedSubtaskIds([]);
        }
    }, [task]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddSubtask = () => {
        if (newSubtask.trim()) {
            setFormData(prev => ({
                ...prev,
                subtasks: [...prev.subtasks, { title: newSubtask.trim(), isNew: true, is_completed: false }]
            }));
            setNewSubtask('');
        }
    };

    const handleSubtaskChange = (index, field, value) => {
        const updatedSubtasks = [...formData.subtasks];
        updatedSubtasks[index] = { ...updatedSubtasks[index], [field]: value };

        setFormData(prev => ({
            ...prev,
            subtasks: updatedSubtasks
        }));
    };

    const handleRemoveSubtask = (index) => {
        const subtask = formData.subtasks[index];

        // If this is an existing subtask (has an ID), add it to the removed list
        if (subtask.subtask_id && !subtask.isNew) {
            setRemovedSubtaskIds(prev => [...prev, subtask.subtask_id]);
        }

        // Remove from form data
        const updatedSubtasks = formData.subtasks.filter((_, i) => i !== index);

        setFormData(prev => ({
            ...prev,
            subtasks: updatedSubtasks
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);

            // Validate form
            if (!formData.title.trim()) {
                setError('Task title is required');
                setLoading(false);
                return;
            }

            // Prepare data for API
            const taskData = {
                title: String(formData.title.trim()),
                description: String(formData.description.trim()),
                status_id: formData.status_id ? parseInt(formData.status_id) : null,
                priority_id: formData.priority_id ? parseInt(formData.priority_id) : null,
                due_date: formData.due_date || null
            };

            // If editing an existing task, include task_id
            if (task) {
                taskData.task_id = parseInt(task.task_id);
            }

            console.log("Submitting task data:", taskData);

            let response;

            if (task) {
                response = await updateTask(taskData);
            } else {
                response = await createTask(taskData);
            }

            console.log("API response:", response);

            if (response.status === 'success') {
                const taskId = response.data.task_id;

                // Delete removed subtasks
                if (removedSubtaskIds.length > 0) {
                    console.log(`Deleting ${removedSubtaskIds.length} subtasks`);

                    for (const subtaskId of removedSubtaskIds) {
                        try {
                            await deleteSubtask(subtaskId);
                            console.log(`Deleted subtask ${subtaskId}`);
                        } catch (deleteError) {
                            console.error(`Failed to delete subtask ${subtaskId}:`, deleteError);
                        }
                    }
                }

                // Now that we have a task ID, add any new subtasks
                if (formData.subtasks && formData.subtasks.length > 0) {
                    console.log("Processing subtasks for the task");

                    // Process each subtask that's marked as new
                    const newSubtasks = formData.subtasks.filter(st => st.isNew);

                    if (newSubtasks.length > 0) {
                        console.log(`Adding ${newSubtasks.length} new subtasks`);

                        // Add each subtask
                        for (const subtask of newSubtasks) {
                            try {
                                const subtaskResponse = await createSubtask({
                                    task_id: taskId,
                                    title: subtask.title
                                });
                                console.log("Subtask added:", subtaskResponse);
                            } catch (subtaskError) {
                                console.error("Failed to add subtask:", subtaskError);
                            }
                        }
                    }
                }

                if (onSuccess) {
                    onSuccess(response.data);
                }
            } else {
                setError(response.message || 'Failed to save task');
            }
        } catch (err) {
            console.error('Error saving task:', err);
            setError('Failed to save task: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    if (loading && (!statuses.length || !priorities.length)) {
        return (
            <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div>
                <label htmlFor="title" className="label">
                    Title
                </label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input"
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="label">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="input"
                ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="status_id" className="label">
                        Status
                    </label>
                    <select
                        id="status_id"
                        name="status_id"
                        value={formData.status_id}
                        onChange={handleChange}
                        className="input"
                        required
                    >
                        <option value="">Select Status</option>
                        {statuses.map(status => (
                            <option key={status.status_id} value={status.status_id}>
                                {status.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="priority_id" className="label">
                        Priority
                    </label>
                    <select
                        id="priority_id"
                        name="priority_id"
                        value={formData.priority_id}
                        onChange={handleChange}
                        className="input"
                        required
                    >
                        <option value="">Select Priority</option>
                        {priorities.map(priority => (
                            <option key={priority.priority_id} value={priority.priority_id}>
                                {priority.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="due_date" className="label">
                    Due Date
                </label>
                <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className="input"
                />
            </div>

            <div>
                <label className="label">Subtasks</label>

                <div className="space-y-2 mb-2">
                    {formData.subtasks.map((subtask, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={subtask.title}
                                onChange={(e) => handleSubtaskChange(index, 'title', e.target.value)}
                                className="input flex-grow"
                                placeholder="Subtask title"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveSubtask(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        className="input flex-grow"
                        placeholder="Add a new subtask"
                    />
                    <button
                        type="button"
                        onClick={handleAddSubtask}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded"
                        disabled={!newSubtask.trim()}
                    >
                        Add
                    </button>
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-secondary"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
                </button>
            </div>
        </form>
    );
};

export default TaskForm;