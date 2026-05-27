const Invitation = require("../models/Invitation");
const Group = require("../models/Group");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

/**
 * ========================================
 * INVITATION CONTROLLER
 * ========================================
 * Handles sending, fetching, accepting,
 * and declining group invitations.
 */

// -----------------------------------------
// @route   POST /api/invitations
// @desc    Send an invitation to a user by username
// @access  Group admin only
// -----------------------------------------
const sendInvitation = asyncHandler(async (req, res) => {
  const { groupId, username } = req.body;

  if (!groupId || !username) {
    const error = new Error("Please provide groupId and username");
    error.statusCode = 400;
    throw error;
  }

  const group = await Group.findById(groupId);
  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify requester is an admin of the group
  const requesterMember = group.members.find(
    (m) => m.user.toString() === req.user._id.toString()
  );
  if (!requesterMember || requesterMember.role !== "admin") {
    const error = new Error("Only group admins can send invitations");
    error.statusCode = 403;
    throw error;
  }

  // Find the invitee by username
  const invitee = await User.findOne({ username: username.toLowerCase().trim() });
  if (!invitee) {
    const error = new Error(`No user found with username "${username}"`);
    error.statusCode = 404;
    throw error;
  }

  // Can't invite yourself
  if (invitee._id.toString() === req.user._id.toString()) {
    const error = new Error("You cannot invite yourself");
    error.statusCode = 400;
    throw error;
  }

  // Check if invitee is already a member
  const alreadyMember = group.members.some(
    (m) => m.user.toString() === invitee._id.toString()
  );
  if (alreadyMember) {
    const error = new Error("This user is already a member of the group");
    error.statusCode = 400;
    throw error;
  }

  // Check for existing pending invitation
  const existingInvite = await Invitation.findOne({
    group: groupId,
    invitee: invitee._id,
    status: "pending",
  });
  if (existingInvite) {
    const error = new Error("An invitation is already pending for this user");
    error.statusCode = 400;
    throw error;
  }

  const invitation = await Invitation.create({
    group: groupId,
    invitedBy: req.user._id,
    invitee: invitee._id,
  });

  await invitation.populate([
    { path: "group", select: "name icon" },
    { path: "invitedBy", select: "name username" },
    { path: "invitee", select: "name username" },
  ]);

  res.status(201).json({ success: true, data: invitation });
});

// -----------------------------------------
// @route   GET /api/invitations/pending
// @desc    Get all pending invitations for current user
// @access  Protected
// -----------------------------------------
const getPendingInvitations = asyncHandler(async (req, res) => {
  const invitations = await Invitation.find({
    invitee: req.user._id,
    status: "pending",
  })
    .populate("group", "name icon category")
    .populate("invitedBy", "name username")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: invitations.length, data: invitations });
});

// -----------------------------------------
// @route   GET /api/invitations/pending/count
// @desc    Get count of pending invitations (for badge)
// @access  Protected
// -----------------------------------------
const getPendingCount = asyncHandler(async (req, res) => {
  const count = await Invitation.countDocuments({
    invitee: req.user._id,
    status: "pending",
  });
  res.json({ success: true, data: { count } });
});

// -----------------------------------------
// @route   PUT /api/invitations/:id/accept
// @desc    Accept a pending invitation
// @access  Invitee only
// -----------------------------------------
const acceptInvitation = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findById(req.params.id);

  if (!invitation) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }

  if (invitation.invitee.toString() !== req.user._id.toString()) {
    const error = new Error("You can only accept your own invitations");
    error.statusCode = 403;
    throw error;
  }

  if (invitation.status !== "pending") {
    const error = new Error(`Invitation has already been ${invitation.status}`);
    error.statusCode = 400;
    throw error;
  }

  // Update invitation status
  invitation.status = "accepted";
  await invitation.save();

  // Add user to group members atomically only if they aren't already a member
  await Group.findOneAndUpdate(
    { _id: invitation.group, "members.user": { $ne: req.user._id } },
    {
      $push: {
        members: { user: req.user._id, role: "member", joinedAt: new Date() },
      },
    }
  );

  await invitation.populate([
    { path: "group", select: "name icon" },
    { path: "invitedBy", select: "name username" },
  ]);

  res.json({ success: true, data: invitation });
});

// -----------------------------------------
// @route   PUT /api/invitations/:id/decline
// @desc    Decline a pending invitation
// @access  Invitee only
// -----------------------------------------
const declineInvitation = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findById(req.params.id);

  if (!invitation) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }

  if (invitation.invitee.toString() !== req.user._id.toString()) {
    const error = new Error("You can only decline your own invitations");
    error.statusCode = 403;
    throw error;
  }

  if (invitation.status !== "pending") {
    const error = new Error(`Invitation has already been ${invitation.status}`);
    error.statusCode = 400;
    throw error;
  }

  // Delete the declined invitation so admin can re-invite later
  await Invitation.findByIdAndDelete(invitation._id);

  res.json({ success: true, message: "Invitation declined" });
});

module.exports = {
  sendInvitation,
  getPendingInvitations,
  getPendingCount,
  acceptInvitation,
  declineInvitation,
};
