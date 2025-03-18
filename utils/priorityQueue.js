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
  taskQueue.enqueue(task);
};

// Remove a task from the queue by rebuilding it without the task
const removeTaskFromQueue = (taskId) => {
  const tempQueue = new PriorityQueue(taskComparator);

  while (!taskQueue.isEmpty()) {
    const item = taskQueue.dequeue();
    if (item._id.toString() !== taskId.toString()) {
      tempQueue.enqueue(item);
    }
  }

  // Replace the original queue with the updated one
  while (!tempQueue.isEmpty()) {
    taskQueue.enqueue(tempQueue.dequeue());
  }
};

module.exports = {
  taskQueue,
  initializeTaskQueue,
  addTaskToQueue,
  removeTaskFromQueue,
};
