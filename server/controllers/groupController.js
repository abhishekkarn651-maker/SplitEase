const Group = require("../models/Group");
const Expense = require("../models/Expense");
const asyncHandler = require("../utils/asyncHandler");

/**
 * ========================================
 * GROUP CONTROLLER
 * ========================================
 * Handles all CRUD operations for groups,
 * plus dashboard stats and settlement calculations.
 */

// -----------------------------------------
// @route   POST /api/groups
// @desc    Create a new group
// -----------------------------------------
const createGroup = asyncHandler(async (req, res) => {
  const { name, members, description, currency, category, icon } = req.body;

  // Validate that name and members were provided
  if (!name || !members || !Array.isArray(members)) {
    const error = new Error("Please provide a group name and members array");
    error.statusCode = 400;
    throw error;
  }

  // Remove duplicates (case-insensitive) and empty strings
  const uniqueMembers = [
    ...new Set(members.map((m) => m.trim()).filter((m) => m.length > 0)),
  ];

  if (uniqueMembers.length < 2) {
    const error = new Error("A group needs at least 2 members");
    error.statusCode = 400;
    throw error;
  }

  const groupData = { name, members: uniqueMembers, createdBy: req.user._id };
  if (description !== undefined) groupData.description = description;
  if (currency) groupData.currency = currency;
  if (category) groupData.category = category;
  if (icon) groupData.icon = icon;

  const group = await Group.create(groupData);

  res.status(201).json({
    success: true,
    data: group,
  });
});

// -----------------------------------------
// @route   GET /api/groups
// @desc    Get all groups
// -----------------------------------------
const getAllGroups = asyncHandler(async (req, res) => {
  // Only return groups created by the logged-in user
  const groups = await Group.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: groups.length,
    data: groups,
  });
});

// -----------------------------------------
// @route   GET /api/groups/:id
// @desc    Get a single group by ID
// -----------------------------------------
const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: group,
  });
});

// -----------------------------------------
// @route   PUT /api/groups/:id
// @desc    Update a group (name and/or members)
// -----------------------------------------
const updateGroup = asyncHandler(async (req, res) => {
  const { name, members, description, currency, category, icon } = req.body;

  let group = await Group.findById(req.params.id);

  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  // If updating members, validate and deduplicate
  if (members) {
    const uniqueMembers = [
      ...new Set(members.map((m) => m.trim()).filter((m) => m.length > 0)),
    ];

    if (uniqueMembers.length < 2) {
      const error = new Error("A group needs at least 2 members");
      error.statusCode = 400;
      throw error;
    }

    group.members = uniqueMembers;
  }

  if (name) group.name = name;
  if (description !== undefined) group.description = description;
  if (currency) group.currency = currency;
  if (category) group.category = category;
  if (icon) group.icon = icon;

  await group.save();

  res.json({
    success: true,
    data: group,
  });
});

// -----------------------------------------
// @route   DELETE /api/groups/:id
// @desc    Delete a group and all its expenses
// -----------------------------------------
const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  // Delete all expenses that belong to this group first
  await Expense.deleteMany({ groupId: req.params.id });

  // Then delete the group itself
  await Group.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Group and all associated expenses deleted",
  });
});

// -----------------------------------------
// @route   GET /api/groups/:id/settlements
// @desc    Calculate simplified settlements for a group
// -----------------------------------------
const getGroupSettlements = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  // Fetch all expenses for this group
  const expenses = await Expense.find({ groupId: req.params.id });

  // Calculate balances and settlements
  const balances = calculateBalances(expenses, group.members);
  const settlements = simplifyDebts(balances);

  res.json({
    success: true,
    data: {
      group: group.name,
      members: group.members,
      balances,
      settlements,
    },
  });
});

// -----------------------------------------
// @route   GET /api/groups/dashboard/stats
// @desc    Get dashboard statistics
// -----------------------------------------
const getDashboardStats = asyncHandler(async (req, res) => {
  // Only count groups owned by the current user
  const userId = req.user._id;
  const totalGroups = await Group.countDocuments({ createdBy: userId });

  // Get all group IDs owned by this user
  const userGroups = await Group.find({ createdBy: userId }).lean();
  const userGroupIds = userGroups.map((g) => g._id);

  // Count expenses only from user's groups
  const expenses = await Expense.find({ groupId: { $in: userGroupIds } });
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Get recent activity — last 5 expenses from user's groups
  const recentExpenses = await Expense.find({ groupId: { $in: userGroupIds } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Attach group names to recent expenses
  const groupMap = {};
  userGroups.forEach((g) => {
    groupMap[g._id.toString()] = g.name;
  });

  const recentActivity = recentExpenses.map((exp) => ({
    ...exp,
    groupName: groupMap[exp.groupId.toString()] || "Unknown Group",
  }));

  // Calculate total pending balances across user's groups
  let totalPendingBalance = 0;

  for (const group of userGroups) {
    const groupExpenses = expenses.filter(
      (e) => e.groupId.toString() === group._id.toString()
    );
    const balances = calculateBalances(groupExpenses, group.members);
    const settlements = simplifyDebts(balances);

    totalPendingBalance += settlements.reduce((sum, s) => sum + s.amount, 0);
  }

  res.json({
    success: true,
    data: {
      totalGroups,
      totalExpenses,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalPendingBalance: Math.round(totalPendingBalance * 100) / 100,
      recentActivity,
    },
  });
});

// ========================================
// HELPER FUNCTIONS — Split Logic
// ========================================

/**
 * calculateBalances()
 * -------------------
 * For each member, calculates their net balance:
 *   Positive balance = they are owed money (they paid more than their share)
 *   Negative balance = they owe money (they paid less than their share)
 *
 * How it works:
 *   1. For each expense, figure out who the contributors are
 *      (if contributors array is empty, ALL members share it).
 *   2. Calculate each contributor's share = amount / number of contributors.
 *   3. The payer gets +amount (they paid the full bill).
 *   4. Each contributor gets -share (they owe their portion).
 *
 * @param {Array} expenses - All expenses in the group
 * @param {Array} members  - All member names in the group
 * @returns {Object} - { memberName: netBalance, ... }
 */
function calculateBalances(expenses, members) {
  // Initialize every member's balance to 0
  const balances = {};
  members.forEach((member) => {
    balances[member] = 0;
  });

  for (const expense of expenses) {
    const { amount, paidBy, paidByMultiple, payerMode, contributors } = expense;

    // If no specific contributors, everyone in the group shares
    const splitAmong =
      contributors.length > 0 ? contributors : members;

    // Each person's share of this expense
    const sharePerPerson = amount / splitAmong.length;

    // Credit the payer(s)
    if (payerMode === "multiple" && paidByMultiple && paidByMultiple.length > 0) {
      // Multi-payer: credit each payer by their individual contribution
      for (const p of paidByMultiple) {
        if (balances[p.member] !== undefined) {
          balances[p.member] += p.amount;
        }
      }
    } else {
      // Single payer: credit the full amount
      if (balances[paidBy] !== undefined) {
        balances[paidBy] += amount;
      }
    }

    // Each contributor owes their share
    for (const person of splitAmong) {
      if (balances[person] !== undefined) {
        balances[person] -= sharePerPerson;
      }
    }
  }

  // Round to 2 decimal places to avoid floating-point weirdness
  for (const member in balances) {
    balances[member] = Math.round(balances[member] * 100) / 100;
  }

  return balances;
}

/**
 * simplifyDebts()
 * ---------------
 * Takes the net balances and produces the minimum number of transactions
 * needed to settle all debts.
 *
 * Algorithm (Greedy approach):
 *   1. Separate members into "creditors" (positive balance, are owed money)
 *      and "debtors" (negative balance, owe money).
 *   2. Sort both lists by amount.
 *   3. Match the biggest debtor with the biggest creditor:
 *      - Transfer the minimum of what's owed and what's due.
 *      - Adjust both balances.
 *      - If one is settled, move to the next person.
 *   4. Repeat until all balances are zero.
 *
 * Example:
 *   Balances: { Rahul: +600, Amit: -400, Priya: -200 }
 *   Result:   [ "Amit pays Rahul ₹400", "Priya pays Rahul ₹200" ]
 *
 * @param {Object} balances - { memberName: netBalance }
 * @returns {Array} - [{ from, to, amount }, ...]
 */
function simplifyDebts(balances) {
  // Separate into creditors (owed money) and debtors (owe money)
  const creditors = []; // People who are owed money (positive balance)
  const debtors = []; // People who owe money (negative balance)

  for (const [person, balance] of Object.entries(balances)) {
    if (balance > 0.01) {
      creditors.push({ person, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ person, amount: Math.abs(balance) });
    }
    // balance ≈ 0 means they're already settled, skip them
  }

  // Sort: largest amounts first (greedy — settle big debts first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    // The transfer amount is the smaller of what's owed and what's due
    const transferAmount = Math.min(creditors[i].amount, debtors[j].amount);

    settlements.push({
      from: debtors[j].person,
      to: creditors[i].person,
      amount: Math.round(transferAmount * 100) / 100,
    });

    // Reduce both sides by the transfer amount
    creditors[i].amount -= transferAmount;
    debtors[j].amount -= transferAmount;

    // If the creditor is fully paid, move to the next one
    if (creditors[i].amount < 0.01) i++;

    // If the debtor has paid off their debt, move to the next one
    if (debtors[j].amount < 0.01) j++;
  }

  return settlements;
}

module.exports = {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupSettlements,
  getDashboardStats,
  // Export helpers for testing
  calculateBalances,
  simplifyDebts,
};
