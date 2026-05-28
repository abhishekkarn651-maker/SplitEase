const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

const {
  createPost,
  getAllPosts,
  getMyWishlist,
  getPostById,
  toggleHelpful,
  toggleWishlist,
  deletePost,
} = require("../controllers/communityController");

/**
 * ========================================
 * COMMUNITY ROUTES
 * ========================================
 *
 * Base path: /api/community
 * All routes are protected (require JWT token).
 *
 * POST   /api/community              → Create a post (with photo upload)
 * GET    /api/community              → Paginated community feed
 * GET    /api/community/wishlist     → User's wishlisted posts
 * GET    /api/community/:id          → Single post details
 * PUT    /api/community/:id/helpful  → Toggle helpful vote
 * PUT    /api/community/:id/wishlist → Toggle wishlist
 * DELETE /api/community/:id          → Delete own post
 */

// All community routes require authentication
router.use(protect);

// ⚠️ /wishlist must come before /:id to avoid treating "wishlist" as an ID
router.get("/wishlist", getMyWishlist);

router
  .route("/")
  .get(getAllPosts)
  .post(upload.array("photos", 5), createPost);

router
  .route("/:id")
  .get(getPostById)
  .delete(deletePost);

router.put("/:id/helpful", toggleHelpful);
router.put("/:id/wishlist", toggleWishlist);

module.exports = router;
