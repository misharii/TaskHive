
// src/components/tasks/KanbanBoard.jsx
import React, { useState, useEffect, useRef } from "react";
import { FiPlus, FiTrash } from "react-icons/fi";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";
import { getTaskStatuses, getTasks, updateTask, createTask, deleteTask } from "../../api/tasks";
import TaskDetails from "./TaskDetails";
import TaskForm from "./TaskForm";
import Modal from "../common/Modal";

const KanbanBoard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cards, setCards] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [statusMap, setStatusMap] = useState({});
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Function to refresh tasks
    const refreshTasks = async () => {
        try {
            setLoading(true);

            // If statuses haven't been loaded yet, load them first
            if (statuses.length === 0) {
                const statusesResponse = await getTaskStatuses();
                if (statusesResponse.status === 'success') {
                    const statusesData = statusesResponse.data || [];
                    setStatuses(statusesData);

                    // Create a map for easier lookup of status names
                    const statusMappings = {};
                    statusesData.forEach(status => {
                        // Convert to lowercase for case-insensitive comparison
                        statusMappings[status.status_id] = status.name.toLowerCase();
                    });
                    setStatusMap(statusMappings);
                }
            }

            const tasksResponse = await getTasks();

            if (tasksResponse.status === 'success') {
                const tasksData = tasksResponse.data || [];

                // Transform tasks to match the format needed by the board
                const transformedTasks = tasksData.map(task => {
                    // Use the status_name from the task data if available
                    // This ensures we're using the correct column name regardless of statusMap
                    let columnName;
                    if (task.status_name) {
                        columnName = task.status_name.toLowerCase();
                    } else {
                        columnName = statusMap[task.status_id]?.toLowerCase() || 'backlog';
                    }

                    return {
                        id: task.task_id.toString(),
                        title: task.title,
                        description: task.description,
                        column: columnName,
                        status_id: task.status_id,
                        priority_id: task.priority_id,
                        priority_name: task.priority_name,
                        status_name: task.status_name,
                        due_date: task.due_date,
                        tags: task.tags,
                        subtasks: task.subtasks,
                        // Store the full task data for task details view
                        rawData: task
                    };
                });

                setCards(transformedTasks);
            }
        } catch (err) {
            console.error('Error refreshing tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load statuses and tasks on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch statuses first
                const statusesResponse = await getTaskStatuses();

                if (statusesResponse.status === 'success') {
                    const statusesData = statusesResponse.data || [];
                    setStatuses(statusesData);

                    // Create a map for easier lookup of status names
                    const statusMappings = {};
                    statusesData.forEach(status => {
                        // Convert to lowercase for case-insensitive comparison
                        statusMappings[status.status_id] = status.name.toLowerCase();
                    });
                    setStatusMap(statusMappings);

                    // Now fetch tasks
                    const tasksResponse = await getTasks();

                    if (tasksResponse.status === 'success') {
                        const tasksData = tasksResponse.data || [];

                        // Transform tasks to match the format needed by the board
                        const transformedTasks = tasksData.map(task => {
                            // Use the status_name from the task data if available
                            let columnName;
                            if (task.status_name) {
                                columnName = task.status_name.toLowerCase();
                            } else {
                                columnName = statusMappings[task.status_id]?.toLowerCase() || 'backlog';
                            }

                            return {
                                id: task.task_id.toString(),
                                title: task.title,
                                description: task.description,
                                column: columnName,
                                status_id: task.status_id,
                                priority_id: task.priority_id,
                                priority_name: task.priority_name,
                                status_name: task.status_name,
                                due_date: task.due_date,
                                tags: task.tags,
                                subtasks: task.subtasks,
                                // Store the full task data for task details view
                                rawData: task
                            };
                        });

                        setCards(transformedTasks);
                    }
                }
            } catch (err) {
                console.error('Error fetching board data:', err);
                setError('Failed to load board data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle card updates including status changes
    const handleCardUpdate = async (updatedCards) => {
        try {
            // Find the cards that have changed status
            for (let i = 0; i < updatedCards.length; i++) {
                const updatedCard = updatedCards[i];
                const originalCard = cards.find(c => c.id === updatedCard.id);

                // If status has changed, update in the database
                if (originalCard && originalCard.column !== updatedCard.column) {
                    console.log("Card moved:", {
                        id: updatedCard.id,
                        from: originalCard.column,
                        to: updatedCard.column
                    });

                    // Find the status_id based on the column name
                    const matchingStatus = statuses.find(
                        status => status.name.toLowerCase() === updatedCard.column
                    );

                    if (matchingStatus) {
                        console.log("Found matching status:", {
                            name: matchingStatus.name,
                            id: matchingStatus.status_id
                        });

                        // Create update payload
                        const updatePayload = {
                            task_id: parseInt(updatedCard.id),
                            status_id: parseInt(matchingStatus.status_id)
                        };

                        console.log("Updating task with payload:", updatePayload);

                        // Update the task in the database
                        await updateTask(updatePayload);

                        // Update local card data
                        updatedCard.status_id = matchingStatus.status_id;
                        updatedCard.status_name = matchingStatus.name;
                    } else {
                        console.error("No matching status found for column:", updatedCard.column);
                        console.log("Available statuses:", statuses);
                    }
                }
            }

            // After all updates are complete, update the state
            setCards(updatedCards);
        } catch (error) {
            console.error("Error updating card positions:", error);
        }
    };

    const handleCardDelete = async (cardId) => {
        try {
            await deleteTask(parseInt(cardId));
            setCards(prevCards => prevCards.filter(card => card.id !== cardId));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    // Handle new card creation
    const handleCardCreate = async (column, title) => {
        try {
            // Find the status_id based on the column name
            const status_id = Object.keys(statusMap).find(
                key => statusMap[key] === column
            );

            if (status_id) {
                const response = await createTask({
                    title,
                    status_id: parseInt(status_id),
                    priority_id: 2 // Default to medium priority
                });

                if (response.status === 'success' && response.data) {
                    await refreshTasks(); // Refresh all tasks to get complete data
                }
            }
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    // Handle opening task details
    const handleTaskClick = (card) => {
        // Find the complete task data from the cards array
        const task = {
            ...card,
            task_id: parseInt(card.id),
        };

        setSelectedTask(task);
        setIsModalOpen(true);
    };

    // Handle task update
    const handleTaskUpdated = async () => {
        await refreshTasks();
    };

    // Handle task save from edit form
    const handleTaskSaved = () => {
        setIsEditModalOpen(false);
        setSelectedTask(null);
        refreshTasks();
    };

    // Handle closing the modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    // Handle editing the task - now opens the edit modal
    const handleEditTask = () => {
        // Close the details modal and open the edit modal
        setIsModalOpen(false);
        setIsEditModalOpen(true);
        // Keep the selectedTask set so the edit form can use it
    };

    // Handle canceling the edit
    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setSelectedTask(null);
    };

    // Handle deleting the task from the modal
    const handleDeleteTask = async () => {
        if (selectedTask) {
            await handleCardDelete(selectedTask.id);
            handleCloseModal();
        }
    };

    if (loading && cards.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 overflow-hidden">
            <Board
                cards={cards}
                setCards={handleCardUpdate}
                onDelete={handleCardDelete}
                onCreateCard={handleCardCreate}
                onTaskClick={handleTaskClick}
                statuses={statuses}
            />

            {/* Task Details Modal */}
            {isModalOpen && selectedTask && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                    <TaskDetails
                        task={selectedTask}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onClose={handleCloseModal}
                        onTaskUpdated={handleTaskUpdated}
                    />
                </Modal>
            )}

            {/* Task Edit Modal */}
            {isEditModalOpen && selectedTask && (
                <Modal isOpen={isEditModalOpen} onClose={handleCancelEdit}>
                    <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Edit Task
                            </h3>
                        </div>

                        <TaskForm
                            task={selectedTask}
                            onSuccess={handleTaskSaved}
                            onCancel={handleCancelEdit}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
};

const Board = ({ cards, setCards, onDelete, onCreateCard, onTaskClick, statuses }) => {
    // Sort statuses by display_order to maintain consistent column order
    const sortedStatuses = [...statuses].sort((a, b) => a.display_order - b.display_order);

    return (
        <div className="flex h-full gap-3 p-2 overflow-x-auto overflow-y-hidden scrollbar-hide">
            {sortedStatuses.map((status) => {
                const columnName = status.name.toLowerCase();
                return (
                    <Column
                        key={status.status_id}
                        title={status.name}
                        column={columnName}
                        headingColor={getHeadingColor(columnName)}
                        cards={cards}
                        setCards={setCards}
                        onCreateCard={onCreateCard}
                        onTaskClick={onTaskClick}
                    />
                );
            })}
            <BurnBarrel setCards={onDelete} />
        </div>
    );
};

// Helper function to get heading color based on column
const getHeadingColor = (column) => {
    switch (column) {
        case 'backlog':
            return 'text-neutral-500';
        case 'todo':
            return 'text-yellow-200';
        case 'doing':
            return 'text-blue-200';
        case 'done':
            return 'text-emerald-200';
        default:
            return 'text-gray-500';
    }
};

const Column = ({ title, headingColor, cards, column, setCards, onCreateCard, onTaskClick }) => {
    const [active, setActive] = useState(false);

    const handleDragStart = (e, card) => {
        e.dataTransfer.setData("cardId", card.id);
    };

    const handleDragEnd = (e) => {
        const cardId = e.dataTransfer.getData("cardId");

        setActive(false);
        clearHighlights();

        const indicators = getIndicators();
        const { element } = getNearestIndicator(e, indicators);

        const before = element.dataset.before || "-1";

        if (before !== cardId) {
            let copy = [...cards];

            let cardToTransfer = copy.find((c) => c.id === cardId);
            if (!cardToTransfer) return;
            cardToTransfer = { ...cardToTransfer, column };

            copy = copy.filter((c) => c.id !== cardId);

            const moveToBack = before === "-1";

            if (moveToBack) {
                copy.push(cardToTransfer);
            } else {
                const insertAtIndex = copy.findIndex((el) => el.id === before);
                if (insertAtIndex === undefined) return;

                copy.splice(insertAtIndex, 0, cardToTransfer);
            }

            setCards(copy);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        highlightIndicator(e);

        setActive(true);
    };

    const clearHighlights = (els) => {
        const indicators = els || getIndicators();

        indicators.forEach((i) => {
            i.style.opacity = "0";
        });
    };

    const highlightIndicator = (e) => {
        const indicators = getIndicators();

        clearHighlights(indicators);

        const el = getNearestIndicator(e, indicators);

        el.element.style.opacity = "1";
    };

    const getNearestIndicator = (e, indicators) => {
        const DISTANCE_OFFSET = 50;

        const el = indicators.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();

                const offset = e.clientY - (box.top + DISTANCE_OFFSET);

                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            },
            {
                offset: Number.NEGATIVE_INFINITY,
                element: indicators[indicators.length - 1],
            }
        );

        return el;
    };

    const getIndicators = () => {
        return Array.from(document.querySelectorAll(`[data-column="${column}"]`));
    };

    const handleDragLeave = () => {
        clearHighlights();
        setActive(false);
    };

    const filteredCards = cards.filter((c) => c.column === column);

    return (
        <div className="w-56 shrink-0 flex flex-col h-full max-h-full">
            <div className="mb-3 flex items-center justify-between">
                <h3 className={`font-medium ${headingColor}`}>{title}</h3>
                <span className="rounded text-sm text-neutral-400">
                    {filteredCards.length}
                </span>
            </div>
            <div
                onDrop={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex-1 overflow-y-auto scrollbar-hide w-full transition-colors ${
                    active ? "bg-neutral-800/50" : "bg-neutral-800/0"
                }`}
            >
                {filteredCards.map((c) => {
                    return <Card
                        key={c.id}
                        {...c}
                        handleDragStart={handleDragStart}
                        onTaskClick={onTaskClick}
                    />;
                })}
                <DropIndicator beforeId={null} column={column} />
            </div>
            <div className="mt-2">
                <AddCard column={column} setCards={onCreateCard} />
            </div>
        </div>
    );
};

const Card = ({ title, id, column, handleDragStart, onTaskClick, ...cardProps }) => {
    const [isDragging, setIsDragging] = useState(false);
    const clickTimer = useRef(null);
    const dragStartPos = useRef({ x: 0, y: 0 });

    // Handle mouse down to determine if it's a click or a drag
    const handleMouseDown = (e) => {
        dragStartPos.current = { x: e.clientX, y: e.clientY };

        // Set a timer to detect if this is a click or drag
        clickTimer.current = setTimeout(() => {
            setIsDragging(true);
        }, 200); // Adjust this delay as needed
    };

    // Handle mouse up to detect clicks
    const handleMouseUp = (e) => {
        // Clear the timer
        if (clickTimer.current) {
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
        }

        // If we're not dragging and didn't move much, consider it a click
        if (!isDragging) {
            const dx = Math.abs(e.clientX - dragStartPos.current.x);
            const dy = Math.abs(e.clientY - dragStartPos.current.y);

            // If the mouse didn't move much, consider it a click
            if (dx < 5 && dy < 5) {
                onTaskClick({ id, title, column, ...cardProps });
            }
        }

        setIsDragging(false);
    };

    // Handle drag start
    const onDragStart = (e) => {
        // Clear the click timer
        if (clickTimer.current) {
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
        }

        setIsDragging(true);
        handleDragStart(e, { title, id, column });
    };

    return (
        <>
            <DropIndicator beforeId={id} column={column} />
            <motion.div
                layout
                layoutId={id}
                draggable="true"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onDragStart={onDragStart}
                className={`cursor-grab rounded border border-neutral-700 bg-white dark:bg-slate-800 p-3 active:cursor-grabbing ${
                    isDragging ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
            >
                <p className="text-sm text-gray-900 dark:text-gray-100">{title}</p>
            </motion.div>
        </>
    );
};

const DropIndicator = ({ beforeId, column }) => {
    return (
        <div
            data-before={beforeId || "-1"}
            data-column={column}
            className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
        />
    );
};

const BurnBarrel = ({ setCards }) => {
    const [active, setActive] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setActive(true);
    };

    const handleDragLeave = () => {
        setActive(false);
    };

    const handleDragEnd = (e) => {
        const cardId = e.dataTransfer.getData("cardId");

        if (cardId) {
            setCards(cardId);
        }

        setActive(false);
    };

    return (
        <div
            onDrop={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded border text-3xl ${
                active
                    ? "border-red-800 bg-red-800/20 text-red-500"
                    : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
            }`}
        >
            {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
        </div>
    );
};

const AddCard = ({ column, setCards }) => {
    const [text, setText] = useState("");
    const [adding, setAdding] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!text.trim().length) return;

        // Call the parent component's createCard function
        setCards(column, text.trim());

        setText("");
        setAdding(false);
    };

    return (
        <>
            {adding ? (
                <motion.form layout onSubmit={handleSubmit}>
                    <textarea
                        onChange={(e) => setText(e.target.value)}
                        autoFocus
                        placeholder="Add new task..."
                        className="w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm text-gray-900 dark:text-gray-100 placeholder-violet-300 focus:outline-0"
                    />
                    <div className="mt-1.5 flex items-center justify-end gap-1.5">
                        <button
                            onClick={() => setAdding(false)}
                            className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
                            type="button"
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300"
                        >
                            <span>Add</span>
                            <FiPlus />
                        </button>
                    </div>
                </motion.form>
            ) : (
                <motion.button
                    layout
                    onClick={() => setAdding(true)}
                    className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
                >
                    <span>Add card</span>
                    <FiPlus />
                </motion.button>
            )}
        </>
    );
};

export default KanbanBoard;