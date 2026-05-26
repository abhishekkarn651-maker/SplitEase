const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

/**
 * protect Middleware
 * -----------------
 * Verifies the JWT token from the Authorization header.
 * If valid, attaches the user to req.user and calls next().
 * If invalid or missing, returns 401 Unauthorized.
 *
 * Expected header format: Authorization: Bearer <token>
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    const error = new Error("Not authorized — no token provided");
    error.statusCode = 401;
    throw error;
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user to the request (excluding password)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      const error = new Error("Not authorized — user no longer exists");
      error.statusCode = 401;
      throw error;
    }

    next();
  } catch (err) {
    // If jwt.verify throws (expired, malformed, etc.)
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      const error = new Error("Not authorized — invalid or expired token");
      error.statusCode = 401;
      throw error;
    }
    throw err;
  }
});

module.exports = { protect };
