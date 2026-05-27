const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

/**
 * ========================================
 * AUTH CONTROLLER
 * ========================================
 * Handles user registration, login, and
 * fetching the current authenticated user.
 */

/**
 * Generate a JWT token for a given user ID.
 * @param {string} id - The user's MongoDB _id
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// -----------------------------------------
// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
// -----------------------------------------
const signup = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  // Validate required fields
  if (!name || !username || !email || !password) {
    const error = new Error("Please provide name, username, email, and password");
    error.statusCode = 400;
    throw error;
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 400;
    throw error;
  }

  // Check if username already exists
  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) {
    const error = new Error("This username is already taken");
    error.statusCode = 400;
    throw error;
  }

  // Create the user
  const user = await User.create({
    name: name.trim(),
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  // Generate token and respond
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    },
  });
});

// -----------------------------------------
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
// -----------------------------------------
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    const error = new Error("Please provide email and password");
    error.statusCode = 400;
    throw error;
  }

  // Find user by email and explicitly include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Generate token and respond
  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    },
  });
});

// -----------------------------------------
// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Protected
// -----------------------------------------
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  res.json({
    success: true,
    data: {
      _id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
    },
  });
});

module.exports = { signup, login, getMe };
