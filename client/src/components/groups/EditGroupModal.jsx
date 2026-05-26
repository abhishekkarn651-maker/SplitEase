import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { HiOutlineXMark, HiOutlinePlus } from "react-icons/hi2";

/**
 * EditGroupModal — Modal form to edit an existing group.
 *
 * Allows editing:
 *  - Group icon (emoji picker)
 *  - Group name
 *  - Description
 *  - Currency
 *  - Category
 *  - Members (add / remove with confirmation)
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
  const [members, setMembers] = useState([...group.members]);
  const [memberInput, setMemberInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removingMember, setRemovingMember] = useState(null); // member name for confirmation

  // Add a member
  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed) return;
    if (members.some((m) => m.toLowerCase() === trimmed.toLowerCase())) return;
    setMembers([...members, trimmed]);
    setMemberInput("");
  };

  const handleMemberKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMember();
    }
  };

  // Remove a member (with confirmation)
  const confirmRemoveMember = (member) => {
    setRemovingMember(member);
  };

  const executeRemoveMember = () => {
    if (removingMember) {
      setMembers(members.filter((m) => m !== removingMember));
      setRemovingMember(null);
    }
  };

  const cancelRemoveMember = () => {
    setRemovingMember(null);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || members.length < 2) return;

    setSubmitting(true);
    try {
      await editGroup(group._id, {
        name: name.trim(),
        description: description.trim(),
        currency,
        category,
        icon,
        members,
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
            {/* Currency */}
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

            {/* Category */}
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

          {/* ── Category Pills (visual selector) ── */}
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
                    // Auto-set icon to match category
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

          {/* ── Members Section ── */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-surface-300" : "text-surface-600"
              }`}
            >
              Members{" "}
              <span className={darkMode ? "text-surface-500" : "text-surface-400"}>
                ({members.length})
              </span>
            </label>

            {/* Current members as chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {members.map((member) => (
                <span
                  key={member}
                  className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg text-sm font-medium animate-scale-in ${
                    darkMode
                      ? "bg-surface-700 text-surface-300 border border-surface-600"
                      : "bg-surface-50 text-surface-700 border border-surface-200"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      darkMode
                        ? "bg-primary-900/40 text-primary-400"
                        : "bg-primary-100 text-primary-700"
                    }`}
                  >
                    {member.charAt(0).toUpperCase()}
                  </span>
                  {member}
                  <button
                    type="button"
                    onClick={() => confirmRemoveMember(member)}
                    disabled={members.length <= 2}
                    className={`p-0.5 rounded-md transition-colors cursor-pointer ${
                      members.length <= 2
                        ? "opacity-30 cursor-not-allowed"
                        : darkMode
                        ? "hover:text-red-400 hover:bg-red-900/30"
                        : "hover:text-red-500 hover:bg-red-50"
                    }`}
                    title={
                      members.length <= 2
                        ? "Minimum 2 members required"
                        : `Remove ${member}`
                    }
                  >
                    <HiOutlineXMark className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add member input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={handleMemberKeyDown}
                placeholder="Add a new member..."
                className={inputClasses}
              />
              <button
                type="button"
                onClick={handleAddMember}
                disabled={!memberInput.trim()}
                className="px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <HiOutlinePlus className="w-5 h-5" />
              </button>
            </div>

            {members.length > 0 && members.length < 2 && (
              <p className="text-xs text-amber-500 mt-1.5">
                A group needs at least 2 members
              </p>
            )}
          </div>

          {/* ── Remove Member Confirmation Dialog ── */}
          {removingMember && (
            <div
              className={`rounded-xl p-4 border animate-scale-in ${
                darkMode
                  ? "bg-red-900/20 border-red-800"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p
                className={`text-sm font-medium mb-1 ${
                  darkMode ? "text-red-400" : "text-red-700"
                }`}
              >
                Remove "{removingMember}"?
              </p>
              <p
                className={`text-xs mb-3 ${
                  darkMode ? "text-red-400/70" : "text-red-600/70"
                }`}
              >
                Their existing expenses will still be counted in settlements.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={executeRemoveMember}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Yes, Remove
                </button>
                <button
                  type="button"
                  onClick={cancelRemoveMember}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    darkMode
                      ? "bg-surface-700 text-surface-300 hover:bg-surface-600"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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
              disabled={!name.trim() || members.length < 2 || submitting}
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
