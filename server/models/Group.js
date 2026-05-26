const mongoose = require("mongoose");

/**
 * Group Schema
 * ------------
 * Represents a group of friends who share expenses.
 *
 * Fields:
 *  - name:    The group name (e.g., "Goa Trip 2026")
 *  - members: An array of member names (strings). Since there's no auth,
 *             members are simply stored as name strings.
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
    members: {
      type: [String],
      validate: {
        validator: function (arr) {
          // A group must have at least 2 members to split expenses
          return arr.length >= 2;
        },
        message: "A group must have at least 2 members",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt fields
  }
);

/**
 * Pre-save middleware:
 * Trims whitespace from each member name and removes any empty strings.
 * This keeps our data clean regardless of how the frontend sends it.
 */
groupSchema.pre("save", function (next) {
  this.members = this.members
    .map((member) => member.trim())
    .filter((member) => member.length > 0);
  next();
});

module.exports = mongoose.model("Group", groupSchema);
