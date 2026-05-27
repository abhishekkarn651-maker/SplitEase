const mongoose = require("mongoose");

/**
 * Invitation Schema
 * -----------------
 * Tracks invitations sent by group admins to other registered users.
 * Status transitions: pending → accepted | declined
 */
const invitationSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Group is required"],
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Inviter is required"],
    },
    invitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Invitee is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Prevent duplicate pending invitations for the same user + group
invitationSchema.index(
  { group: 1, invitee: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("Invitation", invitationSchema);
