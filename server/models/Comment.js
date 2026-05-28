const mongoose = require("mongoose");

/**
 * Comment Schema
 * --------------
 * Represents a user comment on a public community post.
 *
 * Fields:
 *  - post:      Reference to the CommunityPost this comment belongs to
 *  - author:    Reference to the User who wrote the comment
 *  - text:      The comment text (up to 1000 characters)
 */
const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: [true, "Post reference is required"],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author reference is required"],
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for sorted fetches (e.g., fetch all comments for a post sorted by oldest first)
commentSchema.index({ post: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
