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

  const inputClasses = `w-full px-4 py-3 rounded-2xl border text-sm transition-all duration-200 outline-none ${
    darkMode
      ? "bg-surface-700/40 border-surface-600 text-white placeholder-surface-550 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
      : "bg-surface-50/50 border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
  }`;

  return (
    <div className="max-w-lg mx-auto animate-slide-up pb-10">
      <h1
        className={`text-3xl font-extrabold tracking-tight mb-6 ${
          darkMode ? "text-white" : "text-surface-900"
        }`}
      >
        Create a Group
      </h1>

      <form
        onSubmit={handleSubmit}
        className={`rounded-3xl p-6 sm:p-8 space-y-6 ${
          darkMode
            ? "bg-surface-800 border border-surface-700/60"
            : "bg-white border border-surface-200/60 shadow-sm"
        }`}
      >
        {/* ── Icon Picker ── */}
        <div className="space-y-2">
          <label
            className={`block text-xs font-bold uppercase tracking-wider ${
              darkMode ? "text-surface-400" : "text-surface-500"
            }`}
          >
            Group Icon
          </label>
          <div className="grid grid-cols-6 gap-2">
            {ICON_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`w-11 h-11 rounded-2xl text-lg flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  icon === emoji
                    ? darkMode
                      ? "bg-primary-900/40 border-2 border-primary-500 shadow-md scale-105"
                      : "bg-primary-50 border-2 border-primary-500 shadow-md scale-105 text-primary-600"
                    : darkMode
                    ? "bg-surface-700 border border-surface-650 hover:border-surface-500 hover:bg-surface-650"
                    : "bg-surface-50 border border-surface-200 hover:border-surface-300 hover:bg-white"
                } transform active:scale-95`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Group Name */}
        <div className="space-y-1.5">
          <label
            className={`block text-xs font-bold uppercase tracking-wider ${
              darkMode ? "text-surface-400" : "text-surface-500"
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
        <div className="space-y-1.5">
          <label
            className={`block text-xs font-bold uppercase tracking-wider ${
              darkMode ? "text-surface-400" : "text-surface-500"
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
            className={`${inputClasses} resize-none`}
          />
        </div>

        {/* ── Category Pills ── */}
        <div className="space-y-2">
          <label
            className={`block text-xs font-bold uppercase tracking-wider ${
              darkMode ? "text-surface-400" : "text-surface-500"
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
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer min-h-[44px] ${
                  category === c.value
                    ? darkMode
                      ? "bg-primary-900/40 text-primary-400 border-2 border-primary-500"
                      : "bg-primary-50 text-primary-700 border-2 border-primary-500 shadow-sm"
                    : darkMode
                    ? "bg-surface-700 text-surface-400 border border-surface-650 hover:border-surface-500"
                    : "bg-surface-50 text-surface-500 border border-surface-200 hover:border-surface-300 hover:bg-white"
                } transform active:scale-95`}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <label
            className={`block text-xs font-bold uppercase tracking-wider ${
              darkMode ? "text-surface-400" : "text-surface-500"
            }`}
          >
            Currency
          </label>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`${inputClasses} appearance-none pr-10`}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.symbol} {c.value} — {c.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-surface-450">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className={`rounded-2xl p-4 text-xs font-semibold leading-relaxed flex items-center gap-2 ${
          darkMode ? "bg-surface-700/40 text-surface-400" : "bg-surface-50 text-surface-500"
        }`}>
          <span>💡</span>
          <span>You'll be added as admin. Invite members after creating the group.</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-lg hover:shadow-primary-500/10 transform active:scale-[0.98]"
        >
          {submitting ? "Creating..." : "Create Group"}
        </button>
      </form>
    </div>
  );
}

