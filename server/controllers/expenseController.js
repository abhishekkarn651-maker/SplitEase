const Expense = require("../models/Expense");
const Group = require("../models/Group");
const asyncHandler = require("../utils/asyncHandler");

/**
 * ========================================
 * EXPENSE CONTROLLER
 * ========================================
 * Handles all CRUD operations for expenses
 * within a specific group.
 */

// -----------------------------------------
// @route   POST /api/expenses
// @desc    Add a new expense to a group
// -----------------------------------------
const createExpense = asyncHandler(async (req, res) => {
  const { title, amount, paidBy, paidByMultiple, payerMode, contributors, groupId, date, note } = req.body;

  const mode = payerMode || "single";

  // --- Validation ---
  if (!title || !amount || !groupId) {
    const error = new Error(
      "Please provide title, amount, and groupId"
    );
    error.statusCode = 400;
    throw error;
  }

  // Make sure the group exists
  const group = await Group.findById(groupId);
  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  // --- Payer validation ---
  let finalPaidBy = paidBy;
  let finalPaidByMultiple = [];

  if (mode === "multiple") {
    // Multi-payer mode
    if (!paidByMultiple || !Array.isArray(paidByMultiple) || paidByMultiple.length === 0) {
      const error = new Error("Multiple payer mode requires at least one payer in paidByMultiple");
      error.statusCode = 400;
      throw error;
    }

    // Validate all payers are group members
    const invalidPayers = paidByMultiple.filter(
      (p) => !group.members.includes(p.member.trim())
    );
    if (invalidPayers.length > 0) {
      const error = new Error(
        `These payers are not group members: ${invalidPayers.map((p) => p.member).join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Validate sum of contributions equals total amount (within tolerance)
    const totalContributed = paidByMultiple.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalContributed - amount) > 0.01) {
      const error = new Error(
        `Sum of payer contributions (₹${totalContributed.toFixed(2)}) does not match expense amount (₹${amount.toFixed(2)})`
      );
      error.statusCode = 400;
      throw error;
    }

    finalPaidByMultiple = paidByMultiple.map((p) => ({
      member: p.member.trim(),
      amount: p.amount,
    }));
    // Set paidBy to the first contributor for backward compat / display
    finalPaidBy = finalPaidByMultiple[0].member;
  } else {
    // Single-payer mode
    if (!paidBy) {
      const error = new Error("Please specify who paid");
      error.statusCode = 400;
      throw error;
    }
    if (!group.members.includes(paidBy.trim())) {
      const error = new Error(
        `"${paidBy}" is not a member of this group. Members: ${group.members.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // If contributors are specified, validate they are all group members
  const finalContributors = contributors && contributors.length > 0
    ? contributors.map((c) => c.trim()).filter((c) => c.length > 0)
    : []; // Empty = everyone shares

  if (finalContributors.length > 0) {
    const invalidMembers = finalContributors.filter(
      (c) => !group.members.includes(c)
    );
    if (invalidMembers.length > 0) {
      const error = new Error(
        `These contributors are not group members: ${invalidMembers.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Create the expense
  const expense = await Expense.create({
    title: title.trim(),
    amount,
    paidBy: finalPaidBy.trim(),
    payerMode: mode,
    paidByMultiple: finalPaidByMultiple,
    contributors: finalContributors,
    groupId,
    date: date || Date.now(),
    note: note ? note.trim() : "",
  });

  res.status(201).json({
    success: true,
    data: expense,
  });
});

// -----------------------------------------
// @route   GET /api/expenses/group/:groupId
// @desc    Get all expenses for a specific group
//          Supports search and filter via query params
// -----------------------------------------
const getExpensesByGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  // Make sure the group exists
  const group = await Group.findById(groupId);
  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  // Build the query filter
  const filter = { groupId };

  // --- Search by title (case-insensitive partial match) ---
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: "i" };
  }

  // --- Filter by payer ---
  if (req.query.paidBy) {
    filter.paidBy = req.query.paidBy;
  }

  // --- Filter by date range ---
  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) {
      filter.date.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.date.$lte = new Date(req.query.endDate);
    }
  }

  // Fetch expenses, newest first
  const expenses = await Expense.find(filter).sort({ date: -1 });

  res.json({
    success: true,
    count: expenses.length,
    data: expenses,
  });
});

// -----------------------------------------
// @route   GET /api/expenses/:id
// @desc    Get a single expense by ID
// -----------------------------------------
const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    const error = new Error("Expense not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: expense,
  });
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

  // Fetch the parent group to validate members
  const group = await Group.findById(expense.groupId);
  const finalAmount = amount || expense.amount;

  // Handle payer mode update
  const mode = payerMode || expense.payerMode || "single";

  if (mode === "multiple") {
    if (paidByMultiple && Array.isArray(paidByMultiple) && paidByMultiple.length > 0) {
      // Validate all payers are group members
      const invalidPayers = paidByMultiple.filter(
        (p) => !group.members.includes(p.member.trim())
      );
      if (invalidPayers.length > 0) {
        const error = new Error(
          `These payers are not group members: ${invalidPayers.map((p) => p.member).join(", ")}`
        );
        error.statusCode = 400;
        throw error;
      }

      // Validate sum matches total
      const totalContributed = paidByMultiple.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalContributed - finalAmount) > 0.01) {
        const error = new Error(
          `Sum of payer contributions (₹${totalContributed.toFixed(2)}) does not match expense amount (₹${finalAmount.toFixed(2)})`
        );
        error.statusCode = 400;
        throw error;
      }

      expense.paidByMultiple = paidByMultiple.map((p) => ({
        member: p.member.trim(),
        amount: p.amount,
      }));
      expense.paidBy = expense.paidByMultiple[0].member;
    }
    expense.payerMode = "multiple";
  } else {
    // Single-payer mode
    if (paidBy && !group.members.includes(paidBy.trim())) {
      const error = new Error(`"${paidBy}" is not a member of this group`);
      error.statusCode = 400;
      throw error;
    }
    if (paidBy) expense.paidBy = paidBy.trim();
    expense.payerMode = "single";
    expense.paidByMultiple = [];
  }

  // Validate contributors if being updated
  if (contributors && contributors.length > 0) {
    const cleaned = contributors.map((c) => c.trim()).filter((c) => c.length > 0);
    const invalidMembers = cleaned.filter((c) => !group.members.includes(c));
    if (invalidMembers.length > 0) {
      const error = new Error(
        `These contributors are not group members: ${invalidMembers.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }
    expense.contributors = cleaned;
  }

  // Update fields if provided
  if (title) expense.title = title.trim();
  if (amount) expense.amount = amount;
  if (date) expense.date = date;
  if (note !== undefined) expense.note = note.trim();

  await expense.save();

  res.json({
    success: true,
    data: expense,
  });
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

  await Expense.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Expense deleted successfully",
  });
});

module.exports = {
  createExpense,
  getExpensesByGroup,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
