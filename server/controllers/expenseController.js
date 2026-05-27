const Expense = require("../models/Expense");
const Group = require("../models/Group");
const asyncHandler = require("../utils/asyncHandler");

/**
 * ========================================
 * EXPENSE CONTROLLER
 * ========================================
 * Handles all CRUD operations for expenses
 * within a specific group.
 *
 * All group members can add/edit/delete expenses.
 * paidBy and contributors store User ObjectIds.
 */

// ── Helpers ────────────────────────────────

function isGroupMember(group, userId) {
  return group.members.some((m) => {
    const id = m.user._id ? m.user._id.toString() : m.user.toString();
    return id === userId.toString();
  });
}

function getMemberIds(group) {
  return group.members.map((m) => {
    return m.user._id ? m.user._id.toString() : m.user.toString();
  });
}

// -----------------------------------------
// @route   POST /api/expenses
// @desc    Add a new expense to a group
// -----------------------------------------
const createExpense = asyncHandler(async (req, res) => {
  const { title, amount, paidBy, paidByMultiple, payerMode, contributors, groupId, date, note } = req.body;

  const mode = payerMode || "single";

  if (!title || !amount || !groupId) {
    const error = new Error("Please provide title, amount, and groupId");
    error.statusCode = 400;
    throw error;
  }

  // Find group and populate members for validation
  const group = await Group.findById(groupId).populate("members.user", "name username");
  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify the requester is a group member
  if (!isGroupMember(group, req.user._id)) {
    const error = new Error("You must be a group member to add expenses");
    error.statusCode = 403;
    throw error;
  }

  const memberIds = getMemberIds(group);

  // --- Payer validation ---
  let finalPaidBy = paidBy;
  let finalPaidByMultiple = [];

  if (mode === "multiple") {
    if (!paidByMultiple || !Array.isArray(paidByMultiple) || paidByMultiple.length === 0) {
      const error = new Error("Multiple payer mode requires at least one payer in paidByMultiple");
      error.statusCode = 400;
      throw error;
    }

    const invalidPayers = paidByMultiple.filter(
      (p) => !memberIds.includes(p.member.toString())
    );
    if (invalidPayers.length > 0) {
      const error = new Error("Some payers are not members of this group");
      error.statusCode = 400;
      throw error;
    }

    const totalContributed = paidByMultiple.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalContributed - amount) > 0.01) {
      const error = new Error(
        `Sum of payer contributions (${totalContributed.toFixed(2)}) does not match expense amount (${amount.toFixed(2)})`
      );
      error.statusCode = 400;
      throw error;
    }

    finalPaidByMultiple = paidByMultiple.map((p) => ({
      member: p.member.toString(),
      amount: p.amount,
    }));
    finalPaidBy = finalPaidByMultiple[0].member;
  } else {
    if (!paidBy) {
      const error = new Error("Please specify who paid");
      error.statusCode = 400;
      throw error;
    }
    if (!memberIds.includes(paidBy.toString())) {
      const error = new Error("Selected payer is not a member of this group");
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate contributors
  const finalContributors = contributors && contributors.length > 0
    ? contributors.map((c) => c.toString())
    : [];

  if (finalContributors.length > 0) {
    const invalidMembers = finalContributors.filter(
      (c) => !memberIds.includes(c)
    );
    if (invalidMembers.length > 0) {
      const error = new Error("Some contributors are not members of this group");
      error.statusCode = 400;
      throw error;
    }
  }

  let expense = await Expense.create({
    title: title.trim(),
    amount,
    paidBy: finalPaidBy,
    payerMode: mode,
    paidByMultiple: finalPaidByMultiple,
    contributors: finalContributors,
    groupId,
    date: date || Date.now(),
    note: note ? note.trim() : "",
    addedBy: req.user._id,
  });

  expense = await Expense.findById(expense._id)
    .populate("paidBy", "name username email")
    .populate("paidByMultiple.member", "name username email")
    .populate("contributors", "name username email");

  res.status(201).json({ success: true, data: expense });
});

// -----------------------------------------
// @route   GET /api/expenses/group/:groupId
// @desc    Get all expenses for a specific group
// -----------------------------------------
const getExpensesByGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify membership
  if (!isGroupMember(group, req.user._id)) {
    const error = new Error("You must be a group member to view expenses");
    error.statusCode = 403;
    throw error;
  }

  const filter = { groupId };

  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: "i" };
  }
  if (req.query.paidBy) {
    filter.paidBy = req.query.paidBy;
  }
  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
  }

  const expenses = await Expense.find(filter)
    .populate("paidBy", "name username email")
    .populate("paidByMultiple.member", "name username email")
    .populate("contributors", "name username email")
    .sort({ date: -1 });

  res.json({ success: true, count: expenses.length, data: expenses });
});

// -----------------------------------------
// @route   GET /api/expenses/:id
// @desc    Get a single expense by ID
// -----------------------------------------
const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id)
    .populate("paidBy", "name username email")
    .populate("paidByMultiple.member", "name username email")
    .populate("contributors", "name username email");

  if (!expense) {
    const error = new Error("Expense not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: expense });
});

// -----------------------------------------
// @route   PUT /api/expenses/:id
// @desc    Update an expense
// -----------------------------------------
const updateExpense = asyncHandler(async (req, res) => {
  const { title, amount, paidBy, paidByMultiple, payerMode, contributors, date, note } = req.body;

  let expense = await Expense.findById(req.params.id);
  if (!expense) {
    const error = new Error("Expense not found");
    error.statusCode = 404;
    throw error;
  }

  // Populate group members for validation
  const group = await Group.findById(expense.groupId).populate("members.user", "name username");

  // Verify membership
  if (!isGroupMember(group, req.user._id)) {
    const error = new Error("You must be a group member to edit expenses");
    error.statusCode = 403;
    throw error;
  }

  const memberIds = getMemberIds(group);
  const finalAmount = amount || expense.amount;
  const mode = payerMode || expense.payerMode || "single";

  if (mode === "multiple") {
    if (paidByMultiple && Array.isArray(paidByMultiple) && paidByMultiple.length > 0) {
      const invalidPayers = paidByMultiple.filter(
        (p) => !memberIds.includes(p.member.toString())
      );
      if (invalidPayers.length > 0) {
        const error = new Error("Some payers are not members of this group");
        error.statusCode = 400;
        throw error;
      }

      const totalContributed = paidByMultiple.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalContributed - finalAmount) > 0.01) {
        const error = new Error(
          "Sum of payer contributions does not match expense amount"
        );
        error.statusCode = 400;
        throw error;
      }

      expense.paidByMultiple = paidByMultiple.map((p) => ({
        member: p.member.toString(),
        amount: p.amount,
      }));
      expense.paidBy = expense.paidByMultiple[0].member;
    }
    expense.payerMode = "multiple";
  } else {
    if (paidBy) {
      if (!memberIds.includes(paidBy.toString())) {
        const error = new Error("Selected payer is not a member of this group");
        error.statusCode = 400;
        throw error;
      }
      expense.paidBy = paidBy;
    }
    expense.payerMode = "single";
    expense.paidByMultiple = [];
  }

  if (contributors && contributors.length > 0) {
    const cleaned = contributors.map((c) => c.toString());
    const invalidMembers = cleaned.filter((c) => !memberIds.includes(c));
    if (invalidMembers.length > 0) {
      const error = new Error("Some contributors are not members of this group");
      error.statusCode = 400;
      throw error;
    }
    expense.contributors = cleaned;
  }

  if (title) expense.title = title.trim();
  if (amount) expense.amount = amount;
  if (date) expense.date = date;
  if (note !== undefined) expense.note = note.trim();

  await expense.save();

  expense = await Expense.findById(expense._id)
    .populate("paidBy", "name username email")
    .populate("paidByMultiple.member", "name username email")
    .populate("contributors", "name username email");

  res.json({ success: true, data: expense });
});

// -----------------------------------------
// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// -----------------------------------------
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    const error = new Error("Expense not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify membership
  const group = await Group.findById(expense.groupId);
  if (group && !isGroupMember(group, req.user._id)) {
    const error = new Error("You must be a group member to delete expenses");
    error.statusCode = 403;
    throw error;
  }

  await Expense.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: "Expense deleted successfully" });
});

module.exports = {
  createExpense,
  getExpensesByGroup,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
