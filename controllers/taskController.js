const Task = require("../models/Task");
const { redisClient } = require("../redis");
const {
  taskQueue,
  addTaskToQueue,
  removeTaskFromQueue,
} = require("../utils/priorityQueue");

// Clear all cached task keys for a given user
const clearUserCache = async (userId) => {
  try {
    const keys = await redisClient.keys(`tasks:${userId}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error("Error clearing cache for user", userId, error);
  }
};

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

    // Clear cached tasks for this user (invalidate cache)
    await clearUserCache(req.user._id.toString());

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all tasks with pagination and filtering using Redis cache
exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id.toString();

    // Build a cache key specific for this user and query
    const cacheKey = `tasks:${userId}:${page}:${limit}:${status || ""}:${
      priority || ""
    }`;

    // Try to retrieve the cached result from Redis
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }

    // Build query based on user and optional filters
    const query = { createdBy: userId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);
    const result = {
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    };

    // Cache the result in Redis with an expiration of 1 hour (3600 seconds)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

    res.json(result);
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

    // Invalidate cached tasks for this user
    await clearUserCache(req.user._id.toString());

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

    // Invalidate cached tasks for this user
    await clearUserCache(req.user._id.toString());

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
    const nextTask = taskQueue.front();
    res.json(nextTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
