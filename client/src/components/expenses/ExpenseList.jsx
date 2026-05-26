import { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  HiOutlineBanknotes,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCalendar,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineUser,
} from "react-icons/hi2";

/**
 * ExpenseList — Renders the list of expenses for a group.
 *
 * Each expense card shows:
 *  - Title, total amount, who paid, date
 *  - Expandable section: all contributors with per-person share
 *  - Edit/delete action buttons
 */
export default function ExpenseList({ expenses, onEdit, group }) {
  const { removeExpense, darkMode } = useApp();

  // Track which expense cards are expanded to show the split breakdown
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete expense "${title}"?`)) {
      await removeExpense(id);
    }
  };

  if (expenses.length === 0) {
    return (
      <p
        className={`text-sm text-center py-8 ${
          darkMode ? "text-surface-400" : "text-surface-500"
        }`}
      >
        No expenses yet. Add your first expense!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const isExpanded = expandedId === expense._id;

        // Determine who is splitting this expense
        // If contributors array is empty, everyone in the group shares
        const splitMembers =
          expense.contributors.length > 0
            ? expense.contributors
            : group?.members || [];

        // Per-person share for this expense
        const perPersonShare =
          splitMembers.length > 0 ? expense.amount / splitMembers.length : 0;

        return (
          <div
            key={expense._id}
            className={`group rounded-xl transition-all duration-200 ${
              darkMode
                ? "bg-surface-700/50 hover:bg-surface-700 border border-surface-600"
                : "bg-surface-50 hover:bg-white border border-surface-200 hover:shadow-card"
            }`}
          >
            {/* Main Row */}
            <div className="flex items-start justify-between p-4">
              {/* Left: Icon + details */}
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    darkMode
                      ? "bg-primary-900/30 text-primary-400"
                      : "bg-primary-50 text-primary-600"
                  }`}
                >
                  <HiOutlineBanknotes className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4
                    className={`font-medium text-sm ${
                      darkMode ? "text-white" : "text-surface-800"
                    }`}
                  >
                    {expense.title}
                  </h4>
                  <p
                    className={`text-xs mt-0.5 ${
                      darkMode ? "text-surface-400" : "text-surface-500"
                    }`}
                  >
                    <span className="font-medium">
                      {expense.payerMode === "multiple" && expense.paidByMultiple?.length > 0
                        ? expense.paidByMultiple.map((p) => p.member).join(", ")
                        : expense.paidBy}
                    </span>{" "}
                    paid ₹{expense.amount.toLocaleString()} •{" "}
                    {splitMembers.length} people
                  </p>
                  {expense.note && (
                    <p
                      className={`text-xs mt-1 italic ${
                        darkMode ? "text-surface-500" : "text-surface-400"
                      }`}
                    >
                      "{expense.note}"
                    </p>
                  )}
                  <div
                    className={`flex items-center gap-1 text-xs mt-1 ${
                      darkMode ? "text-surface-500" : "text-surface-400"
                    }`}
                  >
                    <HiOutlineCalendar className="w-3 h-3" />
                    {new Date(expense.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Right: Amount + Actions */}
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span
                  className={`text-sm font-bold ${
                    darkMode ? "text-white" : "text-surface-800"
                  }`}
                >
                  ₹{expense.amount.toLocaleString()}
                </span>

                {/* Action buttons — appear on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(expense)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      darkMode
                        ? "hover:bg-surface-600 text-surface-400 hover:text-blue-400"
                        : "hover:bg-blue-50 text-surface-400 hover:text-blue-500"
                    }`}
                    aria-label="Edit expense"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense._id, expense.title)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      darkMode
                        ? "hover:bg-red-900/30 text-surface-400 hover:text-red-400"
                        : "hover:bg-red-50 text-surface-400 hover:text-red-500"
                    }`}
                    aria-label="Delete expense"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>

                {/* Expand/Collapse toggle */}
                <button
                  onClick={() => toggleExpand(expense._id)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    darkMode
                      ? "text-surface-400 hover:text-white hover:bg-surface-600"
                      : "text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                  }`}
                  aria-label="Toggle split details"
                >
                  {isExpanded ? (
                    <HiOutlineChevronUp className="w-4 h-4" />
                  ) : (
                    <HiOutlineChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* ── Expanded: Per-person Split Breakdown ── */}
            {isExpanded && (
              <div
                className={`px-4 pb-4 animate-slide-up ${
                  darkMode ? "border-t border-surface-600" : "border-t border-surface-200"
                }`}
              >
                <div className="pt-3 space-y-2">
                  {/* Payer highlight(s) */}
                  {expense.payerMode === "multiple" && expense.paidByMultiple?.length > 0 ? (
                    // Multi-payer: show each payer
                    expense.paidByMultiple.map((payer, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
                          darkMode
                            ? "bg-primary-900/20 border border-primary-800"
                            : "bg-primary-50 border border-primary-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              darkMode
                                ? "bg-primary-800 text-primary-300"
                                : "bg-primary-200 text-primary-700"
                            }`}
                          >
                            {payer.member.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`font-medium ${
                              darkMode ? "text-primary-300" : "text-primary-700"
                            }`}
                          >
                            {payer.member}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                              darkMode
                                ? "bg-primary-800 text-primary-300"
                                : "bg-primary-200 text-primary-700"
                            }`}
                          >
                            Paid
                          </span>
                        </div>
                        <span
                          className={`font-semibold ${
                            darkMode ? "text-primary-300" : "text-primary-700"
                          }`}
                        >
                          ₹{payer.amount.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    // Single payer
                    <div
                      className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
                        darkMode
                          ? "bg-primary-900/20 border border-primary-800"
                          : "bg-primary-50 border border-primary-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            darkMode
                              ? "bg-primary-800 text-primary-300"
                              : "bg-primary-200 text-primary-700"
                          }`}
                        >
                          {expense.paidBy.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={`font-medium ${
                            darkMode ? "text-primary-300" : "text-primary-700"
                          }`}
                        >
                          {expense.paidBy}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                            darkMode
                              ? "bg-primary-800 text-primary-300"
                              : "bg-primary-200 text-primary-700"
                          }`}
                        >
                          Paid
                        </span>
                      </div>
                      <span
                        className={`font-semibold ${
                          darkMode ? "text-primary-300" : "text-primary-700"
                        }`}
                      >
                        ₹{expense.amount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Divider label */}
                  <p
                    className={`text-xs font-medium uppercase tracking-wide px-1 pt-1 ${
                      darkMode ? "text-surface-400" : "text-surface-500"
                    }`}
                  >
                    Each person's share — ₹{perPersonShare.toFixed(2)} per person
                  </p>

                  {/* Each contributor's share */}
                  {splitMembers.map((member) => {
                    // Determine how much this member paid
                    let memberPaid = 0;
                    if (expense.payerMode === "multiple" && expense.paidByMultiple?.length > 0) {
                      const payerEntry = expense.paidByMultiple.find((p) => p.member === member);
                      memberPaid = payerEntry ? payerEntry.amount : 0;
                    } else {
                      memberPaid = member === expense.paidBy ? expense.amount : 0;
                    }
                    const netBalance = memberPaid - perPersonShare;

                    return (
                      <div
                        key={member}
                        className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
                          darkMode
                            ? "bg-surface-700 border border-surface-600"
                            : "bg-white border border-surface-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              darkMode
                                ? "bg-surface-600 text-surface-300"
                                : "bg-surface-100 text-surface-600"
                            }`}
                          >
                            {member.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={
                              darkMode ? "text-surface-200" : "text-surface-700"
                            }
                          >
                            {member}
                          </span>
                        </div>

                        {/* Show what this person owes or gets back */}
                        <span
                          className={`text-sm font-medium ${
                            netBalance > 0.01
                              ? "text-green-500"
                              : netBalance < -0.01
                              ? darkMode
                                ? "text-red-400"
                                : "text-red-500"
                              : darkMode
                              ? "text-surface-400"
                              : "text-surface-500"
                          }`}
                        >
                          {netBalance > 0.01
                            ? `gets back ₹${netBalance.toFixed(2)}`
                            : netBalance < -0.01
                            ? `owes ₹${Math.abs(netBalance).toFixed(2)}`
                            : "settled ✓"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
