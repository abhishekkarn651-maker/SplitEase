const express = require("express");
const router = express.Router();
const { signup, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

/**
 * ========================================
 * AUTH ROUTES
 * ========================================
 *
 * Base path: /api/auth
 *
 * POST   /api/auth/signup   → Register a new user (public)
 * POST   /api/auth/login    → Login and get token (public)
 * GET    /api/auth/me        → Get current user (protected)
 */

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);

module.exports = router;
