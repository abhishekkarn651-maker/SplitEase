const Group = require("../models/Group");
const Expense = require("../models/Expense");
const asyncHandler = require("../utils/asyncHandler");

/**
 * ========================================
 * GROUP CONTROLLER
 * ========================================
 * Handles all CRUD operations for groups,
 * plus dashboard stats and settlement calculations.
 *
 * Members are now real user references with roles.
 * Access control is based on group membership and role.
 */

// ── Helpers ────────────────────────────────

function getMemberId(member) {
  return member.user._id ? member.user._id.toString() : member.user.toString();
}

function isGroupMember(group, userId) {
  return group.members.some((m) => getMemberId(m) === userId.toString());
}

function isGroupAdmin(group, userId) {
  return group.members.some(
    (m) => getMemberId(m) === userId.toString() && m.role === "admin"
  );
}

function getMemberUsernames(group) {
  return group.members.map((m) => m.user.username);
}

// -----------------------------------------
// @route   POST /api/groups
// @desc    Create a new group (creator is auto-added as admin)
// -----------------------------------------
const createGroup = asyncHandler(async (req, res) => {
  const { name, description, currency, category, icon } = req.body;

  if (!name) {
    const error = new Error("Please provide a group name");
    error.statusCode = 400;
    throw error;
  }

  const groupData = {
    name,
    createdBy: req.user._id,
    members: [{ user: req.user._id, role: "admin", joinedAt: new Date() }],
  };
  if (description !== undefined) groupData.description = description;
  if (currency) groupData.currency = currency;
  if (category) groupData.category = category;
  if (icon) groupData.icon = icon;

  const group = await Group.create(groupData);
  await group.populate("members.user", "name username email");

  res.status(201).json({ success: true, data: group });
});

// -----------------------------------------
// @route   GET /api/groups
// @desc    Get all groups where user is an active member
// -----------------------------------------
const getAllGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ "members.user": req.user._id })
    .populate("members.user", "name username email")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: groups.length, data: groups });
});

// -----------------------------------------
// @route   GET /api/groups/:id
// @desc    Get a single group by ID (members only)
// -----------------------------------------
const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id).populate(
    "members.user",
    "name username email"
  );

  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  if (!isGroupMember(group, req.user._id)) {
    const error = new Error("You are not a member of this group");
    error.statusCode = 403;
    throw error;
  }

  res.json({ success: true, data: group });
});

// -----------------------------------------
// @route   PUT /api/groups/:id
// @desc    Update a group (admin only, metadata only)
// -----------------------------------------
const updateGroup = asyncHandler(async (req, res) => {
  const { name, description, currency, category, icon } = req.body;

  let group = await Group.findById(req.params.id);
  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  if (!isGroupAdmin(group, req.user._id)) {
    const error = new Error("Only group admins can update group details");
    error.statusCode = 403;
    throw error;
  }

  if (name) group.name = name;
  if (description !== undefined) group.description = description;
  if (currency) group.currency = currency;
  if (category) group.category = category;
  if (icon) group.icon = icon;

  await group.save();
  await group.populate("members.user", "name username email");

  res.json({ success: true, data: group });
});

// -----------------------------------------
// @route   DELETE /api/groups/:id
// @desc    Delete a group and all its expenses (admin only)
// -----------------------------------------
const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  if (!isGroupAdmin(group, req.user._id)) {
    const error = new Error("Only group admins can delete a group");
    error.statusCode = 403;
    throw error;
  }

  await Expense.deleteMany({ groupId: req.params.id });
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
  const group = await Group.findById(req.params.id).populate(
    "members.user",
    "name username"
  );

  if (!group) {
    const error = new Error("Group not found");
    error.statusCode = 404;
    throw error;
  }

  if (!isGroupMember(group, req.user._id)) {
    const error = new Error("You are not a member of this group");
    error.statusCode = 403;
    throw error;
  }

  const expenses = await Expense.find({ groupId: req.params.id });
  const memberUsernames = getMemberUsernames(group);
  const balances = calculateBalances(expenses, memberUsernames);
  const settlements = simplifyDebts(balances);

  // Build username → name map for frontend display
  const memberMap = {};
  group.members.forEach((m) => {
    memberMap[m.user.username] = m.user.name;
  });

  res.json({
    success: true,
    data: {
      group: group.name,
      members: group.members.map((m) => ({
        username: m.user.username,
        name: m.user.name,
        role: m.role,
      })),
      memberMap,
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
  const userId = req.user._id;

  // Find all groups where user is a member
  const userGroups = await Group.find({ "members.user": userId })
    .populate("members.user", "name username")
    .lean();

  const totalGroups = userGroups.length;
  const userGroupIds = userGroups.map((g) => g._id);

  const expenses = await Expense.find({ groupId: { $in: userGroupIds } });
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Recent activity — last 5 expenses
  const recentExpenses = await Expense.find({ groupId: { $in: userGroupIds } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const groupMap = {};
  userGroups.forEach((g) => {
    groupMap[g._id.toString()] = g.name;
  });

  const recentActivity = recentExpenses.map((exp) => ({
    ...exp,
    groupName: groupMap[exp.groupId.toString()] || "Unknown Group",
  }));

  // Calculate total pending balances
  let totalPendingBalance = 0;
  for (const group of userGroups) {
    const groupExpenses = expenses.filter(
      (e) => e.groupId.toString() === group._id.toString()
    );
    const memberUsernames = group.members.map((m) => m.user.username);
    const balances = calculateBalances(groupExpenses, memberUsernames);
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
 * @param {Array} expenses - All expenses in the group
 * @param {Array} members  - All member usernames in the group
 * @returns {Object} - { username: netBalance, ... }
 */
function calculateBalances(expenses, members) {
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
      for (const p of paidByMultiple) {
        if (balances[p.member] !== undefined) {
          balances[p.member] += p.amount;
        }
      }
    } else {
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

  // Round to 2 decimal places
  for (const member in balances) {
    balances[member] = Math.round(balances[member] * 100) / 100;
  }

  return balances;
}

/**
 * simplifyDebts()
 * ---------------
 * Takes the net balances and produces the minimum number of transactions
 * needed to settle all debts using a greedy approach.
 *
 * @param {Object} balances - { username: netBalance }
 * @returns {Array} - [{ from, to, amount }, ...]
 */
function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];

  for (const [person, balance] of Object.entries(balances)) {
    if (balance > 0.01) {
      creditors.push({ person, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ person, amount: Math.abs(balance) });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const transferAmount = Math.min(creditors[i].amount, debtors[j].amount);

    settlements.push({
      from: debtors[j].person,
      to: creditors[i].person,
      amount: Math.round(transferAmount * 100) / 100,
    });

    creditors[i].amount -= transferAmount;
    debtors[j].amount -= transferAmount;

    if (creditors[i].amount < 0.01) i++;
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
