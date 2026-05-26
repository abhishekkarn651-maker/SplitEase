const mongoose = require("mongoose");

/**
 * Expense Schema
 * --------------
 * Represents a single expense within a group.
 *
 * Fields:
 *  - title:        What the expense was for (e.g., "Dinner at Olive Garden")
 *  - amount:       Total amount of the expense in the group's currency
 *  - paidBy:       Name of the person who paid (must be a group member)
 *  - contributors: Array of member names who are sharing this expense.
 *                  If empty, it means ALL group members share equally.
 *  - groupId:      Reference to the Group this expense belongs to
 *  - date:         When the expense occurred
 *  - note:         Optional note/description for extra context
 *
 * Timestamps adds createdAt and updatedAt automatically.
 */
const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      maxlength: [200, "Expense title cannot exceed 200 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    paidBy: {
      type: String,
      required: [true, "Must specify who paid"],
      trim: true,
    },
    payerMode: {
      type: String,
      enum: ["single", "multiple"],
      default: "single",
    },
    paidByMultiple: [
      {
        member: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0.01 },
      },
    ],
    contributors: {
      type: [String],
      default: [], // Empty array = split among ALL group members
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Group ID is required"],
      index: true, // Index for faster queries when fetching expenses by group
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware:
 * Trims whitespace from paidBy and each contributor name.
 */
expenseSchema.pre("save", function (next) {
  this.paidBy = this.paidBy.trim();
  this.contributors = this.contributors
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
  if (this.paidByMultiple && this.paidByMultiple.length > 0) {
    this.paidByMultiple = this.paidByMultiple
      .map((p) => ({ ...p, member: p.member.trim() }))
      .filter((p) => p.member.length > 0);
  }
  next();
});

module.exports = mongoose.model("Expense", expenseSchema);
