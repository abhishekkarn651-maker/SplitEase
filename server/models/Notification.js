const mongoose = require("mongoose");

/**
 * Notification Schema
 * -------------------
 * Represents an activity alert for users (e.g., when someone comments
 * on their post or replies to their comment).
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    type: {
      type: String,
      enum: ["comment", "reply"],
      required: [true, "Notification type is required"],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: [true, "Post reference is required"],
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: [true, "Comment reference is required"],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for getting unread notifications in reverse-chronological order
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
