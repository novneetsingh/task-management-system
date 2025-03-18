const Task = require("../models/Task");
const {
  taskQueue,
  addTaskToQueue,
  removeTaskFromQueue,
} = require("../utils/priorityQueue");

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title || !description || !priority) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      createdBy: req.user._id,
    });

    // Add task to the priority queue for scheduling
    addTaskToQueue(task);

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all tasks with pagination and filtering
exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id.toString();

    // Build query based on user and optional filters
    const query = { createdBy: userId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single task by ID
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const { title, description, status, priority } = req.body;

    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;

    await task.save();

    // Update task in the priority queue (remove old version and add updated task)
    removeTaskFromQueue(task._id);
    addTaskToQueue(task);

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Remove the deleted task from the priority queue
    removeTaskFromQueue(task._id);

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get the next highest priority task (without removing it from the queue)
exports.getNextTask = async (req, res) => {
  try {
    if (taskQueue.isEmpty()) {
      return res.status(404).json({ message: "No tasks in queue" });
    }

    // Get the highest priority task without removing it from the queue
    const nextTask = taskQueue.front();
    res.json(nextTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
