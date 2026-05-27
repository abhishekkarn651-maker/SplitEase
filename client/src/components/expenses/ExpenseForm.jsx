import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { HiOutlineEye, HiOutlinePlus, HiOutlineXMark } from "react-icons/hi2";

/**
 * ExpenseForm — Add or edit an expense within a group.
 *
 * Features:
 *  - Title, amount, date, payer selection, optional note
 *  - Single-payer or multi-payer mode toggle
 *  - Contributor checkboxes (multi-select)
 *  - LIVE split preview: Shows who owes how much before saving
 */
export default function ExpenseForm({ group, onClose, editingExpense }) {
  const { addExpense, editExpense, darkMode } = useApp();

  const [title, setTitle] = useState(editingExpense?.title || "");
  const [amount, setAmount] = useState(editingExpense?.amount || "");
  const [paidBy, setPaidBy] = useState(editingExpense?.paidBy || "");
  const [date, setDate] = useState(
    editingExpense?.date
      ? new Date(editingExpense.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState(editingExpense?.note || "");
  // Derive a flat list of member info from the new group.members structure
  const memberList = (group.members || []).map((m) => ({
    username: m.user?.username || m.user,
    name: m.user?.name || m.user?.username || m.user,
  }));
  const memberUsernames = memberList.map((m) => m.username);
  const memberNameMap = {};
  memberList.forEach((m) => { memberNameMap[m.username] = m.name; });

  const [contributors, setContributors] = useState(
    editingExpense?.contributors?.length > 0
      ? editingExpense.contributors
      : [...memberUsernames] // Default: everyone
  );
  const [submitting, setSubmitting] = useState(false);

  // ── Multi-payer state ──
  const [payerMode, setPayerMode] = useState(
    editingExpense?.payerMode || "single"
  );
  const [paidByMultiple, setPaidByMultiple] = useState(() => {
    if (
      editingExpense?.payerMode === "multiple" &&
      editingExpense?.paidByMultiple?.length > 0
    ) {
      return editingExpense.paidByMultiple.map((p) => ({
        member: p.member,
        amount: p.amount,
      }));
    }
    return [{ member: "", amount: "" }];
  });

  // Auto-split equally when switching to multi-payer and amount is set
  const handlePayerModeChange = (mode) => {
    setPayerMode(mode);
    if (mode === "multiple" && parsedAmount > 0) {
      // If there are no rows yet or just one empty, create 2 rows with equal split
      if (
        paidByMultiple.length <= 1 &&
        (!paidByMultiple[0]?.member || !paidByMultiple[0]?.amount)
      ) {
        const firstTwo = memberUsernames.slice(0, 2);
        const perPayer = Math.round((parsedAmount / firstTwo.length) * 100) / 100;
        setPaidByMultiple(
          firstTwo.map((m) => ({ member: m, amount: perPayer }))
        );
      }
    }
  };

  // ── Multi-payer row management ──
  const addPayerRow = () => {
    setPaidByMultiple((prev) => [...prev, { member: "", amount: "" }]);
  };

  const removePayerRow = (index) => {
    setPaidByMultiple((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePayerMember = (index, member) => {
    setPaidByMultiple((prev) =>
      prev.map((p, i) => (i === index ? { ...p, member } : p))
    );
  };

  const updatePayerAmount = (index, amt) => {
    setPaidByMultiple((prev) =>
      prev.map((p, i) => (i === index ? { ...p, amount: amt } : p))
    );
  };

  // Auto-distribute remaining amount to last payer
  const autoFillLast = () => {
    if (paidByMultiple.length < 2 || !parsedAmount) return;
    const othersTotal = paidByMultiple
      .slice(0, -1)
      .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const remaining = Math.round((parsedAmount - othersTotal) * 100) / 100;
    if (remaining >= 0) {
      setPaidByMultiple((prev) =>
        prev.map((p, i) =>
          i === prev.length - 1 ? { ...p, amount: remaining } : p
        )
      );
    }
  };

  // Members already selected in multi-payer, used to filter dropdowns
  const selectedPayers = paidByMultiple.map((p) => p.member).filter(Boolean);

  // Toggle a contributor checkbox
  const toggleContributor = (member) => {
    setContributors((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member]
    );
  };

  // Select/deselect all members
  const toggleAll = () => {
    if (contributors.length === memberUsernames.length) {
      setContributors([]);
    } else {
      setContributors([...memberUsernames]);
    }
  };

  // ── Calculations ──
  const parsedAmount = parseFloat(amount) || 0;
  const splitAmong = contributors.length > 0 ? contributors : memberUsernames;
  const perPersonShare =
    splitAmong.length > 0 ? parsedAmount / splitAmong.length : 0;

  // Multi-payer validation
  const multiPayerTotal = paidByMultiple.reduce(
    (s, p) => s + (parseFloat(p.amount) || 0),
    0
  );
  const multiPayerDiff = Math.abs(multiPayerTotal - parsedAmount);
  const multiPayerValid =
    parsedAmount > 0 && multiPayerDiff <= 0.01 && paidByMultiple.every((p) => p.member);
  const multiPayerHasEntries =
    paidByMultiple.length > 0 && paidByMultiple.some((p) => p.member);

  // Form validity
  const isFormValid = () => {
    if (!title.trim() || !parsedAmount || contributors.length === 0) return false;
    if (payerMode === "single") return !!paidBy;
    if (payerMode === "multiple") return multiPayerValid;
    return false;
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setSubmitting(true);
    try {
      const expenseData = {
        title: title.trim(),
        amount: parsedAmount,
        payerMode,
        contributors,
        groupId: group._id,
        date,
        note: note.trim(),
      };

      if (payerMode === "single") {
        expenseData.paidBy = paidBy;
      } else {
        expenseData.paidByMultiple = paidByMultiple.map((p) => ({
          member: p.member,
          amount: parseFloat(p.amount),
        }));
        expenseData.paidBy = paidByMultiple[0].member; // backward compat
      }

      if (editingExpense) {
        await editExpense(editingExpense._id, expenseData);
      } else {
        await addExpense(expenseData);
      }
      onClose();
    } catch {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = `w-full px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none ${
    darkMode
      ? "bg-surface-700 border-surface-600 text-white placeholder-surface-400 focus:border-primary-500"
      : "bg-white border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 animate-scale-in ${
          darkMode
            ? "bg-surface-800 border border-surface-700"
            : "bg-white shadow-modal"
        }`}
      >
        <h2
          className={`text-lg font-bold mb-4 ${
            darkMode ? "text-white" : "text-surface-800"
          }`}
        >
          {editingExpense ? "Edit Expense" : "Add Expense"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                darkMode ? "text-surface-300" : "text-surface-600"
              }`}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Dinner at Olive Garden"
              className={inputClasses}
              required
            />
          </div>

          {/* Amount + Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  darkMode ? "text-surface-300" : "text-surface-600"
                }`}
              >
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  darkMode ? "text-surface-300" : "text-surface-600"
                }`}
              >
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          {/* ── Payer Mode Toggle ── */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-surface-300" : "text-surface-600"
              }`}
            >
              Paid By
            </label>
            <div
              className={`flex rounded-xl p-1 mb-3 ${
                darkMode
                  ? "bg-surface-700 border border-surface-600"
                  : "bg-surface-100 border border-surface-200"
              }`}
            >
              <button
                type="button"
                onClick={() => handlePayerModeChange("single")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  payerMode === "single"
                    ? darkMode
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-white text-primary-700 shadow-md"
                    : darkMode
                    ? "text-surface-400 hover:text-surface-200"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                Single Payer
              </button>
              <button
                type="button"
                onClick={() => handlePayerModeChange("multiple")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  payerMode === "multiple"
                    ? darkMode
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-white text-primary-700 shadow-md"
                    : darkMode
                    ? "text-surface-400 hover:text-surface-200"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                Multiple Payers
              </button>
            </div>

            {/* ── Single Payer Dropdown ── */}
            {payerMode === "single" && (
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className={inputClasses}
                required
              >
                <option value="">Select who paid</option>
                {memberList.map((m) => (
                  <option key={m.username} value={m.username}>
                    {m.name} (@{m.username})
                  </option>
                ))}
              </select>
            )}

            {/* ── Multiple Payers Section ── */}
            {payerMode === "multiple" && (
              <div className="space-y-2.5">
                {paidByMultiple.map((payer, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 animate-scale-in`}
                  >
                    {/* Member Dropdown */}
                    <select
                      value={payer.member}
                      onChange={(e) =>
                        updatePayerMember(index, e.target.value)
                      }
                      className={`flex-1 px-3 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none ${
                        darkMode
                          ? "bg-surface-700 border-surface-600 text-white focus:border-primary-500"
                          : "bg-white border-surface-200 text-surface-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      }`}
                    >
                      <option value="">Select member</option>
                      {memberList
                        .filter(
                          (m) =>
                            m.username === payer.member || !selectedPayers.includes(m.username)
                        )
                        .map((m) => (
                          <option key={m.username} value={m.username}>
                            {m.name} (@{m.username})
                          </option>
                        ))}
                    </select>

                    {/* Amount Input */}
                    <input
                      type="number"
                      value={payer.amount}
                      onChange={(e) =>
                        updatePayerAmount(index, e.target.value)
                      }
                      placeholder="₹ 0.00"
                      min="0.01"
                      step="0.01"
                      className={`w-28 px-3 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none ${
                        darkMode
                          ? "bg-surface-700 border-surface-600 text-white focus:border-primary-500"
                          : "bg-white border-surface-200 text-surface-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      }`}
                    />

                    {/* Remove Button */}
                    {paidByMultiple.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePayerRow(index)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
                          darkMode
                            ? "text-surface-400 hover:text-red-400 hover:bg-red-900/30"
                            : "text-surface-400 hover:text-red-500 hover:bg-red-50"
                        }`}
                        aria-label="Remove payer"
                      >
                        <HiOutlineXMark className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Payer + Auto-fill buttons */}
                <div className="flex gap-2">
                  {paidByMultiple.length < memberUsernames.length && (
                    <button
                      type="button"
                      onClick={addPayerRow}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        darkMode
                          ? "text-primary-400 hover:bg-primary-900/30 border border-primary-800"
                          : "text-primary-600 hover:bg-primary-50 border border-primary-200"
                      }`}
                    >
                      <HiOutlinePlus className="w-3.5 h-3.5" />
                      Add Payer
                    </button>
                  )}
                  {paidByMultiple.length >= 2 && parsedAmount > 0 && (
                    <button
                      type="button"
                      onClick={autoFillLast}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        darkMode
                          ? "text-surface-400 hover:text-surface-200 hover:bg-surface-600 border border-surface-600"
                          : "text-surface-500 hover:text-surface-700 hover:bg-surface-100 border border-surface-200"
                      }`}
                    >
                      Auto-fill last
                    </button>
                  )}
                </div>

                {/* ── Real-time validation bar ── */}
                {parsedAmount > 0 && multiPayerHasEntries && (
                  <div
                    className={`rounded-xl p-3 border transition-all duration-300 ${
                      multiPayerDiff <= 0.01
                        ? darkMode
                          ? "bg-green-900/20 border-green-800"
                          : "bg-green-50 border-green-200"
                        : darkMode
                        ? "bg-red-900/20 border-red-800"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          multiPayerDiff <= 0.01
                            ? darkMode
                              ? "text-green-400"
                              : "text-green-700"
                            : darkMode
                            ? "text-red-400"
                            : "text-red-700"
                        }`}
                      >
                        Total Contributed: ₹
                        {multiPayerTotal.toFixed(2)} / ₹
                        {parsedAmount.toFixed(2)}
                      </span>
                      {multiPayerDiff <= 0.01 && (
                        <span className="text-xs text-green-500 font-medium">
                          ✓ Matched
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div
                      className={`w-full h-1.5 rounded-full overflow-hidden ${
                        darkMode ? "bg-surface-600" : "bg-surface-200"
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          multiPayerDiff <= 0.01
                            ? "bg-green-500"
                            : multiPayerTotal > parsedAmount
                            ? "bg-red-500"
                            : "bg-amber-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (multiPayerTotal / parsedAmount) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    {multiPayerDiff > 0.01 && (
                      <p
                        className={`text-xs mt-1.5 ${
                          darkMode ? "text-red-400" : "text-red-600"
                        }`}
                      >
                        {multiPayerTotal > parsedAmount
                          ? `Over by ₹${(multiPayerTotal - parsedAmount).toFixed(2)}`
                          : `Remaining: ₹${(parsedAmount - multiPayerTotal).toFixed(2)}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contributors */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className={`text-sm font-medium ${
                  darkMode ? "text-surface-300" : "text-surface-600"
                }`}
              >
                Split Among
              </label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium cursor-pointer"
              >
                {contributors.length === memberUsernames.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {memberList.map((m) => (
                <label
                  key={m.username}
                  className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all text-sm ${
                    contributors.includes(m.username)
                      ? darkMode
                        ? "bg-primary-900/30 border border-primary-700 text-primary-400"
                        : "bg-primary-50 border border-primary-200 text-primary-700"
                      : darkMode
                      ? "bg-surface-700 border border-surface-600 text-surface-300"
                      : "bg-surface-50 border border-surface-200 text-surface-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={contributors.includes(m.username)}
                    onChange={() => toggleContributor(m.username)}
                    className="accent-primary-500 w-4 h-4"
                  />
                  {m.name} <span className="opacity-50">@{m.username}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note (optional) */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                darkMode ? "text-surface-300" : "text-surface-600"
              }`}
            >
              Note{" "}
              <span className={darkMode ? "text-surface-500" : "text-surface-400"}>
                (optional)
              </span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any extra details..."
              rows={2}
              className={inputClasses}
            />
          </div>

          {/* ── LIVE SPLIT PREVIEW ── */}
          {parsedAmount > 0 && contributors.length > 0 && (
            payerMode === "single" ? (
              // Single-payer preview
              paidBy && (
                <div
                  className={`rounded-xl p-4 border animate-scale-in ${
                    darkMode
                      ? "bg-primary-900/20 border-primary-800"
                      : "bg-primary-50 border-primary-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <HiOutlineEye className="w-4 h-4 text-primary-500" />
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        darkMode ? "text-primary-400" : "text-primary-600"
                      }`}
                    >
                      Split Preview
                    </span>
                  </div>
                  <p
                    className={`text-sm mb-1 ${
                      darkMode ? "text-surface-200" : "text-surface-700"
                    }`}
                  >
                    <span className="font-semibold">{paidBy}</span> paid{" "}
                    <span className="font-semibold">₹{parsedAmount.toLocaleString()}</span>
                  </p>
                  <p
                    className={`text-sm mb-2 ${
                      darkMode ? "text-surface-300" : "text-surface-600"
                    }`}
                  >
                    Split among {splitAmong.length} people:
                  </p>
                  <div className="space-y-1">
                    {splitAmong.map((person) => (
                      <div
                        key={person}
                        className={`text-sm flex justify-between ${
                          darkMode ? "text-surface-300" : "text-surface-600"
                        }`}
                      >
                        <span>
                          {person === paidBy ? `${person} (payer)` : person}
                        </span>
                        <span className="font-medium">
                          {person === paidBy
                            ? `gets back ₹${(parsedAmount - perPersonShare).toFixed(2)}`
                            : `owes ₹${perPersonShare.toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              // Multi-payer preview
              multiPayerValid && (
                <div
                  className={`rounded-xl p-4 border animate-scale-in ${
                    darkMode
                      ? "bg-primary-900/20 border-primary-800"
                      : "bg-primary-50 border-primary-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <HiOutlineEye className="w-4 h-4 text-primary-500" />
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        darkMode ? "text-primary-400" : "text-primary-600"
                      }`}
                    >
                      Split Preview
                    </span>
                  </div>
                  <div className="mb-2 space-y-0.5">
                    {paidByMultiple.map((p, i) => (
                      <p
                        key={i}
                        className={`text-sm ${
                          darkMode ? "text-surface-200" : "text-surface-700"
                        }`}
                      >
                        <span className="font-semibold">{p.member}</span> paid{" "}
                        <span className="font-semibold">
                          ₹{parseFloat(p.amount).toLocaleString()}
                        </span>
                      </p>
                    ))}
                  </div>
                  <p
                    className={`text-sm mb-2 ${
                      darkMode ? "text-surface-300" : "text-surface-600"
                    }`}
                  >
                    Split among {splitAmong.length} people:
                  </p>
                  <div className="space-y-1">
                    {splitAmong.map((person) => {
                      const payerEntry = paidByMultiple.find(
                        (p) => p.member === person
                      );
                      const personPaid = payerEntry
                        ? parseFloat(payerEntry.amount) || 0
                        : 0;
                      const netBalance = personPaid - perPersonShare;

                      return (
                        <div
                          key={person}
                          className={`text-sm flex justify-between ${
                            darkMode
                              ? "text-surface-300"
                              : "text-surface-600"
                          }`}
                        >
                          <span>
                            {payerEntry
                              ? `${person} (paid ₹${personPaid.toLocaleString()})`
                              : person}
                          </span>
                          <span
                            className={`font-medium ${
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
              )
            )
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                darkMode
                  ? "bg-surface-700 text-surface-300 hover:bg-surface-600"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting
                ? "Saving..."
                : editingExpense
                ? "Update Expense"
                : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
