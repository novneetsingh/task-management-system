// Importing express module
const express = require("express");

// Creating a router object
const router = express.Router();

// Importing controller function from userController
const { signup, login } = require("../controllers/userController");

// Defining routes

router.post("/signup", signup);

router.post("/login", login);

module.exports = router;
