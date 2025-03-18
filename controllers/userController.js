const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// signup a user
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email and password" });
    }

    // check if user already exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created successfully",
      newUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// login a user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    // check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // create token
    const token = jwt.sign(
      { id: user._id, currUserName: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      message: "User logged in successfully",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// login as a guest user
exports.loginAsGuest = async (req, res) => {
  try {
    const token = jwt.sign({}, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); // create a guest user token

    res.status(200).json({
      message: "Guest user logged in successfully",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
