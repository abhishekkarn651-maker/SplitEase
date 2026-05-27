const mongoose = require("mongoose");

/**
 * Group Schema
 * ------------
 * Represents a group of users who share expenses.
 *
 * Members are now real user references with roles:
 *  - admin:  The group creator (can invite, edit, delete)
 *  - member: Invited users who accepted (can add/manage expenses)
 *
 * Timestamps adds createdAt and updatedAt automatically.
 */
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP", "JPY"],
      default: "INR",
    },
    category: {
      type: String,
      enum: ["trip", "home", "couple", "friends", "work", "food", "other"],
      default: "other",
    },
    icon: {
      type: String,
      default: "👥",
      maxlength: [10, "Icon cannot exceed 10 characters"],
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Group", groupSchema);
