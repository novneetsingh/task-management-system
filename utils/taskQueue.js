const { PriorityQueue } = require("@datastructures-js/priority-queue");
const Task = require("../models/Task");

// Custom comparator: lower numeric value means higher priority.
// high = 1, medium = 2, low = 3. If equal, compare by createdAt.
const taskComparator = (a, b) => {
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }
  // Compare timestamps (newer tasks get higher scheduling priority)
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

// Singleton instance of the priority queue
const taskQueue = new PriorityQueue(taskComparator);

// Initialize the queue with pending tasks from the database
const initializeTaskQueue = async () => {
  try {
    taskQueue.clear();

    // get all pending tasks from the database and sort them by createdAt descending
    const tasks = await Task.find({ status: "pending" }).sort({
      createdAt: -1,
    });

    // Add tasks to the queue
    tasks.forEach((task) => {
      taskQueue.enqueue(task);
    });

    console.log(`Initialized task queue with ${tasks.length} pending tasks`);
    return tasks.length;
  } catch (error) {
    console.error("Failed to initialize task queue:", error);
    return 0;
  }
};

// Add a task to the queue
const addTaskToQueue = (task) => {
  console.log("Adding task to queue:", task);
  taskQueue.enqueue(task);
};

// Remove a task from the queue by rebuilding it without the task
const removeTaskFromQueue = (taskId) => {
  console.log("Removing task from queue:", taskId);
  taskQueue.remove((task) => task._id.toString() === taskId.toString());
};

module.exports = {
  taskQueue,
  initializeTaskQueue,
  addTaskToQueue,
  removeTaskFromQueue,
};
