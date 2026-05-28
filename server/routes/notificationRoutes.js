const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");

// All notification routes are protected (require auth)
router.use(protect);

router.route("/").get(getNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markRead);

module.exports = router;
