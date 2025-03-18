const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");

const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getNextTask,
} = require("../controllers/taskController");

router.post("/", auth, createTask);
router.get("/", auth, getTasks);
router.get("/next", auth, getNextTask);
router.get("/:id", auth, getTask);
router.put("/:id", auth, updateTask);
router.delete("/:id", auth, deleteTask);

module.exports = router;
