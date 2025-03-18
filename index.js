const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");

// Import Routes
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");

// Import task queue and run initializer
const { initializeTaskQueue } = require("./utils/priorityQueue");

// Define port number
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(express.json());

// Connect to database and cloudinary
require("./config/database").dbconnect();

// Route setup
app.use("/user", userRoutes);
app.use("/task", taskRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("<h1>Task Management API</h1>");
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Initialize task queue with existing tasks
  await initializeTaskQueue();
});
