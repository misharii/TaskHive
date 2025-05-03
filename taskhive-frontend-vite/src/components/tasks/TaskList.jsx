// src/components/tasks/TaskList.jsx
import React, { useState, useEffect } from 'react';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiFilter, FiSearch } from 'react-icons/fi';
import { getTasks, getTaskStatuses, getTaskPriorities, deleteTask } from '../../api/tasks';
import TaskForm from './TaskForm';
import TaskDetails from './TaskDetails';

const TaskList = () => {
    const [allTasks, setAllTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        status_id: '',
        priority_id: '',
        search: ''
    });

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Load tasks, statuses, and priorities on mount
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

                // Fetch tasks
                await fetchTasks();
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch all tasks
    const fetchTasks = async () => {
        try {
            setLoading(true);

            const response = await getTasks();

            if (response.status === 'success') {
                const tasksData = response.data || [];
                setAllTasks(tasksData);
                applyFilters(tasksData, filters);
            } else {
                throw new Error(response.message || 'Failed to fetch tasks');
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters to tasks (client-side filtering)
    const applyFilters = (tasks, currentFilters) => {
        let result = [...tasks];

        // Filter by status
        if (currentFilters.status_id) {
            result = result.filter(task =>
                task.status_id === parseInt(currentFilters.status_id)
            );
        }

        // Filter by priority
        if (currentFilters.priority_id) {
            result = result.filter(task =>
                task.priority_id === parseInt(currentFilters.priority_id)
            );
        }

        // Filter by search text
        if (currentFilters.search) {
            const searchLower = currentFilters.search.toLowerCase();
            result = result.filter(task =>
                task.title.toLowerCase().includes(searchLower) ||
                (task.description && task.description.toLowerCase().includes(searchLower))
            );
        }

        setFilteredTasks(result);
    };

    // Apply filters
    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        const newFilters = {
            ...filters,
            [name]: value
        };

        setFilters(newFilters);
        applyFilters(allTasks, newFilters);
    };

    // Clear all filters
    const handleClearFilters = () => {
        const clearedFilters = {
            status_id: '',
            priority_id: '',
            search: ''
        };

        setFilters(clearedFilters);
        applyFilters(allTasks, clearedFilters);
    };

    // Handle task creation/update success
    const handleTaskSaved = () => {
        setShowAddModal(false);
        setSelectedTask(null);
        fetchTasks();
    };

    // Handle task deletion
    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await deleteTask(taskId);

                if (response.status === 'success') {
                    const updatedTasks = allTasks.filter(task => task.task_id !== taskId);
                    setAllTasks(updatedTasks);
                    applyFilters(updatedTasks, filters);
                } else {
                    throw new Error(response.message || 'Failed to delete task');
                }
            } catch (err) {
                console.error('Error deleting task:', err);
                alert('Failed to delete task');
            }
        }
    };

    // Open task edit modal
    const handleEditTask = (task) => {
        setSelectedTask(task);
        setShowAddModal(true);
    };

    // Open task details modal
    const handleViewTask = (task) => {
        setSelectedTask(task);
        setShowDetailsModal(true);
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

    // Format date to a user-friendly format
    const formatDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) return '';

        return date.toLocaleDateString();
    };

    if (loading && !allTasks.length) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // Get the tasks to display (filtered or all)
    const displayTasks = filteredTasks.length > 0 || Object.values(filters).some(v => v)
        ? filteredTasks
        : allTasks;

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h1 className="text-2xl font-bold mb-4 md:mb-0">Tasks</h1>

                <button
                    onClick={() => {
                        setSelectedTask(null);
                        setShowAddModal(true);
                    }}
                    className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded"
                >
                    <FiPlus className="mr-2" />
                    Add Task
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex items-center">
                        <FiFilter className="mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filters:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
                        <div>
                            <select
                                name="status_id"
                                value={filters.status_id}
                                onChange={handleFilterChange}
                                className="input"
                            >
                                <option value="">All Statuses</option>
                                {statuses.map(status => (
                                    <option key={status.status_id} value={status.status_id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                name="priority_id"
                                value={filters.priority_id}
                                onChange={handleFilterChange}
                                className="input"
                            >
                                <option value="">All Priorities</option>
                                {priorities.map(priority => (
                                    <option key={priority.priority_id} value={priority.priority_id}>
                                        {priority.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search tasks..."
                                className="input pl-10"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleClearFilters}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            {/* Task list */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 p-4">
                        {error}
                    </div>
                )}

                {displayTasks.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        {loading ? 'Loading tasks...' : 'No tasks found'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Task
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Due Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {displayTasks.map((task) => (
                                <tr key={task.task_id}>
                                    <td className="px-6 py-4 whitespace-normal">
                                        <div className="cursor-pointer" onClick={() => handleViewTask(task)}>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {task.title}
                                            </div>
                                            {task.description && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                                    {task.description}
                                                </div>
                                            )}
                                            {task.subtasks && task.subtasks.length > 0 && (
                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {task.subtasks.filter(s => s.is_completed).length} of {task.subtasks.length} subtasks completed
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(task.status_name)}`}>
                        {task.status_name}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityStyle(task.priority_name)}`}>
                        {task.priority_name}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {task.due_date ? formatDate(task.due_date) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditTask(task)}
                                                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.task_id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Task Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 dark:bg-gray-800 opacity-75"></div>
                        </div>

                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {selectedTask ? 'Edit Task' : 'Add New Task'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setSelectedTask(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <FiX className="h-6 w-6" />
                                    </button>
                                </div>

                                <TaskForm
                                    task={selectedTask}
                                    onSuccess={handleTaskSaved}
                                    onCancel={() => {
                                        setShowAddModal(false);
                                        setSelectedTask(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Details Modal */}
            {showDetailsModal && selectedTask && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 dark:bg-gray-800 opacity-75"></div>
                        </div>

                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Task Details
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            setSelectedTask(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <FiX className="h-6 w-6" />
                                    </button>
                                </div>

                                <TaskDetails
                                    task={selectedTask}
                                    onEdit={() => {
                                        setShowDetailsModal(false);
                                        setShowAddModal(true);
                                    }}
                                    onDelete={() => {
                                        setShowDetailsModal(false);
                                        handleDeleteTask(selectedTask.task_id);
                                    }}
                                    onClose={() => {
                                        setShowDetailsModal(false);
                                        setSelectedTask(null);
                                    }}
                                    onTaskUpdated={fetchTasks}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskList;
