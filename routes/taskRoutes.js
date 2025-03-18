const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");

const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

router.post("/create", auth, createTask);
router.get("/get-all", auth, getTasks);
router.get("/get-task/:id", auth, getTask);
router.put("/update/:id", auth, updateTask);
router.delete("/delete/:id", auth, deleteTask);

module.exports = router;
