const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

// -----------------------------------------
// @route   GET /api/notifications
// @desc    Get current user's notifications
// @access  Protected
// -----------------------------------------
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "name username")
    .populate("post", "title destination")
    .populate("comment", "text")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});

// -----------------------------------------
// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Protected
// -----------------------------------------
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify recipient matches logged in user
  if (notification.recipient.toString() !== req.user._id.toString()) {
    const error = new Error("Not authorized");
    error.statusCode = 403;
    throw error;
  }

  notification.isRead = true;
  await notification.save();

  res.json({
    success: true,
    data: notification,
  });
});

// -----------------------------------------
// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Protected
// -----------------------------------------
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.json({
    success: true,
    message: "All notifications marked as read",
  });
});

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
};
