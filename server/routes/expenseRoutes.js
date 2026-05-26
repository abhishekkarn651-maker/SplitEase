const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createExpense,
  getExpensesByGroup,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

/**
 * ========================================
 * EXPENSE ROUTES
 * ========================================
 *
 * Base path: /api/expenses
 * All routes are protected (require JWT token).
 *
 * POST   /api/expenses                 → Create a new expense
 * GET    /api/expenses/group/:groupId   → Get all expenses for a group (supports search/filter)
 * GET    /api/expenses/:id              → Get a single expense
 * PUT    /api/expenses/:id              → Update an expense
 * DELETE /api/expenses/:id              → Delete an expense
 *
 * Query params for GET /group/:groupId:
 *   ?search=dinner       → Search expenses by title
 *   ?paidBy=Rahul         → Filter by who paid
 *   ?startDate=2026-01-01 → Filter by start date
 *   ?endDate=2026-12-31   → Filter by end date
 */

// All expense routes require authentication
router.use(protect);

router.post("/", createExpense);

// ⚠️ This route must come before /:id to avoid "group" being treated as an ID
router.get("/group/:groupId", getExpensesByGroup);

router.route("/:id")
  .get(getExpenseById)
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;
