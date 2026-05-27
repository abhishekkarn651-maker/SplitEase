const express = require("express");
const router = express.Router();
const { signup, login, getMe, updateProfile } = require("../controllers/authController");
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
 * PUT    /api/auth/profile   → Update profile details (protected)
 */

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

module.exports = router;
