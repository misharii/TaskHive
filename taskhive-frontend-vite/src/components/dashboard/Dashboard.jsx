// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiClipboard, FiList,  FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getTasks } from '../../api/tasks';

const Dashboard = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0
    });

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true);
                const response = await getTasks();

                if (response.status === 'success') {
                    const taskData = response.data || [];
                    setTasks(taskData);

                    // Calculate statistics
                    const completed = taskData.filter(task => task.status_id === 4).length; // Assuming status_id 4 is "Done"
                    const inProgress = taskData.filter(task => task.status_id === 3).length; // Assuming status_id 3 is "In Progress"
                    const overdue = taskData.filter(task => {
                        if (!task.due_date) return false;
                        return new Date(task.due_date) < new Date() && task.status_id !== 4;
                    }).length;

                    setStats({
                        total: taskData.length,
                        completed,
                        inProgress,
                        overdue
                    });
                }
            } catch (error) {
                console.error('Error fetching tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    // Get most recent tasks (limit to 5)
    const recentTasks = [...tasks]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    // Get tasks due soon (within next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const tasksDueSoon = tasks
        .filter(task => {
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            return dueDate >= today && dueDate <= nextWeek && task.status_id !== 4;
        })
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.username || 'User'}</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">Here's an overview of your tasks and activities</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <Link
                            to="/tasks/kanban"
                            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-sm transition-colors"
                        >
                            <FiPlus className="mr-2" />
                            New Task
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                            <FiClipboard className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                            <FiCheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mr-4">
                            <FiClock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.inProgress}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
                            <FiAlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.overdue}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Task Distribution Visualization */}
            <section className="bg-white dark:bg-slate-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Status Distribution</h2>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                    ) : stats.total > 0 ? (
                        <div className="flex flex-col md:flex-row items-center justify-around">
                            {/* Simple bar chart */}
                            <div className="grid grid-cols-4 gap-4 w-full max-w-md mb-6 md:mb-0">
                                {/* Backlog */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-full">
                                        <div className="bg-gray-200 dark:bg-gray-700 h-40 rounded-t-lg"></div>
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-gray-500 dark:bg-gray-500 rounded-t-lg"
                                            style={{
                                                height: `${Math.max(
                                                    ((tasks.filter(t => t.status_id === 1).length / stats.total) * 100),
                                                    5
                                                )}%`
                                            }}
                                        ></div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Backlog</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {tasks.filter(t => t.status_id === 1).length}
                                    </p>
                                </div>

                                {/* Todo */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-full">
                                        <div className="bg-gray-200 dark:bg-gray-700 h-40 rounded-t-lg"></div>
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-yellow-500 dark:bg-yellow-500 rounded-t-lg"
                                            style={{
                                                height: `${Math.max(
                                                    ((tasks.filter(t => t.status_id === 2).length / stats.total) * 100),
                                                    5
                                                )}%`
                                            }}
                                        ></div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Todo</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {tasks.filter(t => t.status_id === 2).length}
                                    </p>
                                </div>

                                {/* In Progress */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-full">
                                        <div className="bg-gray-200 dark:bg-gray-700 h-40 rounded-t-lg"></div>
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-blue-500 dark:bg-blue-500 rounded-t-lg"
                                            style={{
                                                height: `${Math.max(
                                                    ((stats.inProgress / stats.total) * 100),
                                                    5
                                                )}%`
                                            }}
                                        ></div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">In Progress</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{stats.inProgress}</p>
                                </div>

                                {/* Completed */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-full">
                                        <div className="bg-gray-200 dark:bg-gray-700 h-40 rounded-t-lg"></div>
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-green-500 dark:bg-green-500 rounded-t-lg"
                                            style={{
                                                height: `${Math.max(
                                                    ((stats.completed / stats.total) * 100),
                                                    5
                                                )}%`
                                            }}
                                        ></div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Completed</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
                                </div>
                            </div>

                            <div className="mt-6 md:mt-0 md:ml-6 text-center md:text-left">
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Task Completion Rate</p>
                                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {stats.completed} of {stats.total} tasks completed
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-12 text-gray-500 dark:text-gray-400">
                            No tasks available. Create some tasks to see statistics.
                        </div>
                    )}
                </div>
            </section>

            {/* Task Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Tasks */}
                <section className="bg-white dark:bg-slate-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
                            <Link
                                to="/tasks/list"
                                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                            >
                                View All
                            </Link>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <div className="p-6 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                            </div>
                        ) : recentTasks.length > 0 ? (
                            recentTasks.map(task => (
                                <div key={task.task_id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                    <div className="flex items-start">
                                        <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${getStatusColor(task.status_id)}`}></div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h3>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                {task.description || 'No description provided'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                No tasks found
                            </div>
                        )}
                    </div>
                </section>

                {/* Tasks Due Soon */}
                <section className="bg-white dark:bg-slate-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Due Soon</h2>
                            <Link
                                to="/tasks/kanban"
                                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                            >
                                View Board
                            </Link>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <div className="p-6 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                            </div>
                        ) : tasksDueSoon.length > 0 ? (
                            tasksDueSoon.map(task => (
                                <div key={task.task_id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <FiClock className={getDueDateColor(task.due_date)} />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h3>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Due: {formatDate(task.due_date)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                No upcoming deadlines
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Quick Actions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    to="/tasks/kanban"
                    className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow group"
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                            <FiClipboard className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Kanban Board</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Manage tasks visually</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/tasks/list"
                    className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow group"
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors">
                            <FiList className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Task List</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">View all tasks in a list</p>
                        </div>
                    </div>
                </Link>
            </section>
        </div>
    );
};

// Helper functions
const getStatusColor = (statusId) => {
    switch (statusId) {
        case 1: // Backlog
            return 'bg-gray-400 dark:bg-gray-500';
        case 2: // Todo
            return 'bg-yellow-400 dark:bg-yellow-500';
        case 3: // In Progress
            return 'bg-blue-400 dark:bg-blue-500';
        case 4: // Done
            return 'bg-green-400 dark:bg-green-500';
        default:
            return 'bg-gray-400 dark:bg-gray-500';
    }
};

const getDueDateColor = (dueDate) => {
    if (!dueDate) return 'text-gray-400';

    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-500 dark:text-red-400';
    if (diffDays < 2) return 'text-orange-500 dark:text-orange-400';
    return 'text-green-500 dark:text-green-400';
};

const formatDate = (dateString) => {
    if (!dateString) return 'No date';

    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }

    // Check if date is tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }

    // Otherwise return formatted date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default Dashboard;