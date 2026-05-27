import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { HiOutlineXMark } from "react-icons/hi2";

/**
 * EditGroupModal — Modal form to edit an existing group.
 *
 * Allows editing metadata only (name, description, currency, category, icon).
 * Member management is now done through the invitation system.
 */

const ICON_OPTIONS = ["👥", "✈️", "🏠", "❤️", "💼", "🎉", "🍕", "🎮", "🏖️", "🎵", "📚", "⚽"];

const CATEGORY_OPTIONS = [
  { value: "trip", label: "Trip", emoji: "✈️" },
  { value: "home", label: "Home", emoji: "🏠" },
  { value: "couple", label: "Couple", emoji: "❤️" },
  { value: "friends", label: "Friends", emoji: "👥" },
  { value: "work", label: "Work", emoji: "💼" },
  { value: "food", label: "Food", emoji: "🍕" },
  { value: "other", label: "Other", emoji: "📌" },
];

const CURRENCY_OPTIONS = [
  { value: "INR", symbol: "₹", label: "Indian Rupee" },
  { value: "USD", symbol: "$", label: "US Dollar" },
  { value: "EUR", symbol: "€", label: "Euro" },
  { value: "GBP", symbol: "£", label: "British Pound" },
  { value: "JPY", symbol: "¥", label: "Japanese Yen" },
];

export default function EditGroupModal({ group, onClose, onSaved }) {
  const { editGroup, darkMode } = useApp();

  const [icon, setIcon] = useState(group.icon || "👥");
  const [name, setName] = useState(group.name || "");
  const [description, setDescription] = useState(group.description || "");
  const [currency, setCurrency] = useState(group.currency || "INR");
  const [category, setCategory] = useState(group.category || "other");
  const [submitting, setSubmitting] = useState(false);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await editGroup(group._id, {
        name: name.trim(),
        description: description.trim(),
        currency,
        category,
        icon,
      });
      if (onSaved) onSaved();
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
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 animate-scale-in ${
          darkMode
            ? "bg-surface-800 border border-surface-700"
            : "bg-white shadow-modal"
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className={`text-lg font-bold ${
              darkMode ? "text-white" : "text-surface-800"
            }`}
          >
            Edit Group
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              darkMode
                ? "text-surface-400 hover:text-white hover:bg-surface-700"
                : "text-surface-400 hover:text-surface-700 hover:bg-surface-100"
            }`}
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Icon Picker ── */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-surface-300" : "text-surface-600"
              }`}
            >
              Group Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    icon === emoji
                      ? darkMode
                        ? "bg-primary-900/40 border-2 border-primary-500 shadow-md scale-110"
                        : "bg-primary-50 border-2 border-primary-500 shadow-md scale-110"
                      : darkMode
                      ? "bg-surface-700 border border-surface-600 hover:border-surface-500 hover:bg-surface-600"
                      : "bg-surface-50 border border-surface-200 hover:border-surface-300 hover:bg-white"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* ── Group Name ── */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                darkMode ? "text-surface-300" : "text-surface-600"
              }`}
            >
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Goa Trip 2026"
              className={inputClasses}
              required
            />
          </div>

          {/* ── Description ── */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                darkMode ? "text-surface-300" : "text-surface-600"
              }`}
            >
              Description{" "}
              <span className={darkMode ? "text-surface-500" : "text-surface-400"}>
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={2}
              className={inputClasses}
            />
          </div>

          {/* ── Currency + Category Row ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  darkMode ? "text-surface-300" : "text-surface-600"
                }`}
              >
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClasses}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.symbol} {c.value} — {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  darkMode ? "text-surface-300" : "text-surface-600"
                }`}
              >
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClasses}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Category Pills ── */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-surface-300" : "text-surface-600"
              }`}
            >
              Quick Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setCategory(c.value);
                    const catIcon = CATEGORY_OPTIONS.find((x) => x.value === c.value);
                    if (catIcon) setIcon(catIcon.emoji);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    category === c.value
                      ? darkMode
                        ? "bg-primary-900/40 text-primary-400 border border-primary-700"
                        : "bg-primary-50 text-primary-700 border border-primary-300"
                      : darkMode
                      ? "bg-surface-700 text-surface-400 border border-surface-600 hover:border-surface-500"
                      : "bg-surface-50 text-surface-500 border border-surface-200 hover:border-surface-300"
                  }`}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Info ── */}
          <div className={`rounded-xl p-3 text-sm ${
            darkMode ? "bg-surface-700/50 text-surface-400" : "bg-surface-50 text-surface-500"
          }`}>
            💡 Members are managed through the invitation system on the group page.
          </div>

          {/* ── Action Buttons ── */}
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
              disabled={!name.trim() || submitting}
              className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
