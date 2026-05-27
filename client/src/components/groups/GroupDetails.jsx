import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import ExpenseForm from "../expenses/ExpenseForm";
import ExpenseList from "../expenses/ExpenseList";
import SettlementSummary from "../expenses/SettlementSummary";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowLeft,
  HiOutlineUserGroup,
  HiOutlineBanknotes,
  HiOutlineScale,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import EditGroupModal from "./EditGroupModal";
import { useAuth } from "../../context/AuthContext";

/**
 * GroupDetails — Main view for a single group.
 *
 * Shows:
 *  - Group name, members
 *  - Tab toggle: Expenses | Settlements
 *  - Search/filter bar for expenses
 *  - Expense list with edit/delete
 *  - Settlement summary with balances & simplified debts
 *  - Floating "Add Expense" button
 */
export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentGroup,
    expenses,
    settlements,
    loading,
    loadGroupById,
    loadExpenses,
    loadSettlements,
    darkMode,
    sendInvite,
    leaveGroup,
    removeMemberFromGroup,
  } = useApp();
  const { user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [activeTab, setActiveTab] = useState("expenses");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviting, setInviting] = useState(false);

  // Determine if current user is admin of this group
  const isAdmin = currentGroup?.members?.some(
    (m) => (m.user?._id || m.user) === user?._id && m.role === "admin"
  );

  // Load group, expenses, and settlements on mount
  useEffect(() => {
    loadGroupById(id);
    loadExpenses(id);
    loadSettlements(id);
  }, [id, loadGroupById, loadExpenses, loadSettlements]);

  // Reload data after expense form closes (add/edit)
  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingExpense(null);
    loadExpenses(id);
    loadSettlements(id);
    // Also refresh dashboard stats when we return
  }, [id, loadExpenses, loadSettlements]);

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  // After edit group modal saves
  const handleGroupSaved = useCallback(() => {
    loadGroupById(id);
    loadExpenses(id);
    loadSettlements(id);
  }, [id, loadGroupById, loadExpenses, loadSettlements]);

  // Handle invite
  const handleInvite = async () => {
    if (!inviteUsername.trim()) return;
    setInviting(true);
    try {
      await sendInvite(id, inviteUsername.trim());
      setInviteUsername("");
    } catch {
      // Error handled in context
    } finally {
      setInviting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      try {
        await leaveGroup(id);
        navigate("/groups");
      } catch (err) {
        // Handled in context
      }
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member from the group?")) {
      try {
        await removeMemberFromGroup(id, memberId);
        await loadSettlements(id);
      } catch (err) {
        // Handled in context
      }
    }
  };

  // Search expenses (client-side filter for instant feedback)
  const filteredExpenses = expenses.filter((exp) => {
    const titleMatch = exp.title.toLowerCase().includes(searchQuery.toLowerCase());
    const paidByStr = exp.paidBy?.name || exp.paidBy?.username || exp.paidBy || "";
    const paidByMatch = paidByStr.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || paidByMatch;
  });

  // Calculate total expenses amount
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading && !currentGroup) return <LoadingSpinner message="Loading group..." />;
  if (!currentGroup) return null;

  return (
    <div className="animate-slide-up">
      {/* Back link */}
      <Link
        to="/groups"
        className={`inline-flex items-center gap-1 text-sm mb-4 transition-colors ${
          darkMode
            ? "text-surface-400 hover:text-white"
            : "text-surface-500 hover:text-surface-800"
        }`}
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Groups
      </Link>

      {/* Group Header */}
      <div
        className={`rounded-2xl p-5 sm:p-6 mb-6 ${
          darkMode
            ? "bg-surface-800 border border-surface-700"
            : "bg-white border border-surface-200 shadow-card"
        }`}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            {/* Group Icon */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                darkMode
                  ? "bg-primary-900/30"
                  : "bg-primary-50"
              }`}
            >
              {currentGroup.icon || "👥"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={`text-xl sm:text-2xl font-bold ${
                    darkMode ? "text-white" : "text-surface-800"
                  }`}
                >
                  {currentGroup.name}
                </h1>
                {currentGroup.category && currentGroup.category !== "other" && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      darkMode
                        ? "bg-primary-900/30 text-primary-400"
                        : "bg-primary-50 text-primary-700"
                    }`}
                  >
                    {currentGroup.category.charAt(0).toUpperCase() + currentGroup.category.slice(1)}
                  </span>
                )}
              </div>
              {currentGroup.description && (
                <p
                  className={`text-sm mt-1 ${
                    darkMode ? "text-surface-400" : "text-surface-500"
                  }`}
                >
                  {currentGroup.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span
                  className={`flex items-center gap-1 text-sm ${
                    darkMode ? "text-surface-400" : "text-surface-500"
                  }`}
                >
                  <HiOutlineUserGroup className="w-4 h-4" />
                  {currentGroup.members.length} members
                </span>
                <span
                  className={`flex items-center gap-1 text-sm ${
                    darkMode ? "text-surface-400" : "text-surface-500"
                  }`}
                >
                  <HiOutlineBanknotes className="w-4 h-4" />
                  {expenses.length} expenses
                </span>
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${
                    darkMode ? "text-primary-400" : "text-primary-600"
                  }`}
                >
                  ₹{totalAmount.toLocaleString()} total
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowEditModal(true)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md cursor-pointer ${
                  darkMode
                    ? "bg-surface-700 text-surface-300 hover:bg-surface-600 border border-surface-600"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200 border border-surface-200"
                }`}
              >
                <HiOutlinePencilSquare className="w-4 h-4" />
                Edit Group
              </button>
            )}
            <button
              onClick={handleLeaveGroup}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md cursor-pointer ${
                darkMode
                  ? "bg-surface-700 text-red-400 hover:text-red-300 hover:bg-surface-600 border border-surface-600"
                  : "bg-surface-100 text-red-600 hover:bg-red-50 hover:text-red-700 border border-surface-200"
              }`}
            >
              <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
              Leave Group
            </button>
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Member chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {currentGroup.members.map((member) => {
            const memberUser = member.user || {};
            const displayName = memberUser.name || memberUser.username || "Unknown";
            const uname = memberUser.username || "";
            const isMe = (memberUser._id || memberUser) === user?._id;
            return (
              <span
                key={memberUser._id || uname}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${
                  darkMode
                    ? "bg-surface-700 text-surface-300"
                    : "bg-surface-100 text-surface-600"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    darkMode
                      ? "bg-primary-900/40 text-primary-400"
                      : "bg-primary-100 text-primary-700"
                  }`}
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
                {displayName}
                {member.role === "admin" && (
                  <span className={`text-[10px] px-1 py-0.5 rounded font-semibold ${
                    darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600"
                  }`}>Admin</span>
                )}
                {isAdmin && !isMe && (
                  <button
                    onClick={() => handleRemoveMember(memberUser._id)}
                    className="ml-1 hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer"
                    title={`Remove ${displayName}`}
                  >
                    <HiOutlineXMark className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            );
          })}
        </div>

        {/* Invite Member (admin only) */}
        {isAdmin && (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              placeholder="Invite by username..."
              className={`flex-1 px-4 py-2 rounded-xl border text-sm outline-none transition-all ${
                darkMode
                  ? "bg-surface-700 border-surface-600 text-white placeholder-surface-400 focus:border-primary-500"
                  : "bg-surface-50 border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              }`}
            />
            <button
              onClick={handleInvite}
              disabled={!inviteUsername.trim() || inviting}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {inviting ? "Sending..." : "Invite"}
            </button>
          </div>
        )}
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-1 mb-5">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === "expenses"
              ? "bg-primary-500 text-white shadow-sm"
              : darkMode
              ? "bg-surface-800 text-surface-300 hover:bg-surface-700"
              : "bg-white text-surface-500 hover:bg-surface-100 border border-surface-200"
          }`}
        >
          <HiOutlineBanknotes className="w-4 h-4" />
          Expenses
        </button>
        <button
          onClick={() => setActiveTab("settlements")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === "settlements"
              ? "bg-primary-500 text-white shadow-sm"
              : darkMode
              ? "bg-surface-800 text-surface-300 hover:bg-surface-700"
              : "bg-white text-surface-500 hover:bg-surface-100 border border-surface-200"
          }`}
        >
          <HiOutlineScale className="w-4 h-4" />
          Settlements
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "expenses" ? (
        <div
          className={`rounded-2xl p-5 sm:p-6 ${
            darkMode
              ? "bg-surface-800 border border-surface-700"
              : "bg-white border border-surface-200 shadow-card"
          }`}
        >
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <HiOutlineMagnifyingGlass
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  darkMode ? "text-surface-400" : "text-surface-400"
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expenses by title or payer..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                  darkMode
                    ? "bg-surface-700 border-surface-600 text-white placeholder-surface-400 focus:border-primary-500"
                    : "bg-surface-50 border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                }`}
              />
            </div>
          </div>

          <ExpenseList expenses={filteredExpenses} onEdit={handleEdit} group={currentGroup} />
        </div>
      ) : (
        <div
          className={`rounded-2xl p-5 sm:p-6 ${
            darkMode
              ? "bg-surface-800 border border-surface-700"
              : "bg-white border border-surface-200 shadow-card"
          }`}
        >
          <SettlementSummary settlements={settlements} />
        </div>
      )}

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseForm
          group={currentGroup}
          onClose={handleFormClose}
          editingExpense={editingExpense}
        />
      )}

      {/* Edit Group Modal */}
      {showEditModal && (
        <EditGroupModal
          group={currentGroup}
          onClose={() => setShowEditModal(false)}
          onSaved={handleGroupSaved}
        />
      )}
    </div>
  );
}
