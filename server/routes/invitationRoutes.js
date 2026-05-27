const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendInvitation,
  getPendingInvitations,
  getPendingCount,
  acceptInvitation,
  declineInvitation,
} = require("../controllers/invitationController");

/**
 * ========================================
 * INVITATION ROUTES
 * ========================================
 *
 * Base path: /api/invitations
 * All routes are protected (require JWT token).
 *
 * POST   /api/invitations              → Send an invitation (admin only)
 * GET    /api/invitations/pending       → Get current user's pending invitations
 * GET    /api/invitations/pending/count → Get count for notification badge
 * PUT    /api/invitations/:id/accept    → Accept an invitation
 * PUT    /api/invitations/:id/decline   → Decline an invitation
 */

router.use(protect);

router.post("/", sendInvitation);
router.get("/pending", getPendingInvitations);
router.get("/pending/count", getPendingCount);
router.put("/:id/accept", acceptInvitation);
router.put("/:id/decline", declineInvitation);

module.exports = router;
