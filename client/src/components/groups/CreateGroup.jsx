import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { HiOutlineXMark, HiOutlinePlus } from "react-icons/hi2";

/**
 * CreateGroup — Form to create a new group.
 * Users type a group name, select an icon/category/currency,
 * add an optional description, and add members one by one.
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

export default function CreateGroup() {
  const { addGroup, darkMode } = useApp();
  const navigate = useNavigate();

  const [icon, setIcon] = useState("👥");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [category, setCategory] = useState("other");
  const [submitting, setSubmitting] = useState(false);

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const group = await addGroup({
        name: name.trim(),
        description: description.trim(),
        currency,
        category,
        icon,
      });
      navigate(`/groups/${group._id}`);
    } catch {
      // Error toast is already handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = `w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none ${
    darkMode
      ? "bg-surface-800 border-surface-600 text-white placeholder-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
      : "bg-white border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
  }`;

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <h1
        className={`text-2xl font-bold mb-6 ${
          darkMode ? "text-white" : "text-surface-800"
        }`}
      >
        Create a Group
      </h1>

      <form
        onSubmit={handleSubmit}
        className={`rounded-2xl p-6 space-y-5 ${
          darkMode
            ? "bg-surface-800 border border-surface-700"
            : "bg-white border border-surface-200 shadow-card"
        }`}
      >
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

        {/* Group Name */}
        <div>
          <label
            className={`block text-sm font-medium mb-1.5 ${
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

        {/* Description */}
        <div>
          <label
            className={`block text-sm font-medium mb-1.5 ${
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

        {/* ── Category Pills ── */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              darkMode ? "text-surface-300" : "text-surface-600"
            }`}
          >
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCategory(c.value);
                  setIcon(c.emoji);
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

        {/* Currency */}
        <div>
          <label
            className={`block text-sm font-medium mb-1.5 ${
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

        {/* Info about inviting members */}
        <div className={`rounded-xl p-3 text-sm ${
          darkMode ? "bg-surface-700/50 text-surface-400" : "bg-surface-50 text-surface-500"
        }`}>
          💡 You'll be added as admin. Invite members after creating the group.
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Creating..." : "Create Group"}
        </button>
      </form>
    </div>
  );
}

