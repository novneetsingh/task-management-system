const Task = require("../models/Task");
const User = require("../models/User");
const { redisClient } = require("../config/redis");
const {
  taskQueue,
  addTaskToQueue,
  removeTaskFromQueue,
} = require("../utils/taskQueue");

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

// Create a task
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      createdBy: req.user.id,
    });

    // add task to user's task list
    await User.findByIdAndUpdate(req.user.id, {
      $push: { tasks: task._id },
    });

    // Add task to the priority queue for scheduling
    addTaskToQueue(task);

    // Clear cached tasks for this user (invalidate cache)
    await clearUserCache(req.user.id.toString());

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a single task by ID
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
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
      createdBy: req.user.id,
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
    await clearUserCache(req.user.id.toString());

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
      createdBy: req.user.id,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Remove the deleted task from the user's task list
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { tasks: task._id },
    });

    // Remove the deleted task from the priority queue
    removeTaskFromQueue(task._id);

    // Invalidate cached tasks for this user
    await clearUserCache(req.user.id.toString());

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tasks with pagination and filtering from the priority queue
exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, priority } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // make redis key for the tasks
    const tasksKey = `tasks:${req.user.id}:${pageNum}:${limitNum}:${priority}`;

    // check if the tasks are cached
    const cachedTasks = await redisClient.get(tasksKey);
    if (cachedTasks) {
      return res.json(JSON.parse(cachedTasks));
    }

    // convert the queue to an array
    const taskArray = taskQueue.toArray();

    // Array to hold tasks that pass the filters
    const tasksToReturn = [];
    const totalTasks = taskArray.length; // Total number of tasks in the queue

    // Iterate through the entire queue without losing any tasks
    for (let i = 0; i < totalTasks; i++) {
      const task = taskArray[i];

      // check if the task passes the filters
      if (priority && task.priority !== priority) {
        // if the task does not pass the filters, skip it
        continue;
      }

      // add the task to the return array
      tasksToReturn.push(task);
    }

    // Implement pagination on the filtered tasks
    const paginatedTasks = tasksToReturn.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(tasksToReturn.length / limitNum);

    // cache the tasks for 1 hour
    await redisClient.setEx(tasksKey, 3600, JSON.stringify(paginatedTasks));

    res.json({
      tasks: paginatedTasks,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
