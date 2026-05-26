const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupSettlements,
  getDashboardStats,
} = require("../controllers/groupController");

/**
 * ========================================
 * GROUP ROUTES
 * ========================================
 *
 * Base path: /api/groups
 * All routes are protected (require JWT token).
 *
 * GET    /api/groups/dashboard/stats   → Dashboard statistics
 * GET    /api/groups                   → List all groups
 * POST   /api/groups                   → Create a new group
 * GET    /api/groups/:id               → Get single group
 * PUT    /api/groups/:id               → Update a group
 * DELETE /api/groups/:id               → Delete a group + its expenses
 * GET    /api/groups/:id/settlements   → Get settlement summary
 */

// All group routes require authentication
router.use(protect);

// ⚠️ Dashboard route MUST come before /:id routes,
// otherwise Express thinks "dashboard" is an ID!
router.get("/dashboard/stats", getDashboardStats);

router.route("/")
  .get(getAllGroups)
  .post(createGroup);

router.route("/:id")
  .get(getGroupById)
  .put(updateGroup)
  .delete(deleteGroup);

router.get("/:id/settlements", getGroupSettlements);

module.exports = router;
