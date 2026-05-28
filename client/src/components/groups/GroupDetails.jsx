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
  HiOutlineGlobeAlt,
} from "react-icons/hi2";
import EditGroupModal from "./EditGroupModal";
import CreatePostModal from "../community/CreatePostModal";
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
  const [showCommunityModal, setShowCommunityModal] = useState(false);

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
    <div className="animate-slide-up pb-20 relative">
      {/* Back link */}
      <Link
        to="/groups"
        className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-5 transition-all ${
          darkMode
            ? "text-surface-400 hover:text-white"
            : "text-surface-500 hover:text-surface-800"
        }`}
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Groups
      </Link>

      {/* Group Header Card */}
      <div
        className={`rounded-3xl p-6 sm:p-8 mb-6 transition-all duration-300 ${
          darkMode
            ? "bg-surface-800 border border-surface-700/60"
            : "bg-white border border-surface-200/60 shadow-sm"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5">
          <div className="flex items-start gap-4">
            {/* Group Icon */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                darkMode
                  ? "bg-surface-700 text-primary-400"
                  : "bg-surface-50 text-primary-600"
              } shadow-inner`}
            >
              {currentGroup.icon || "👥"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={`text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight ${
                    darkMode ? "text-white" : "text-surface-900"
                  }`}
                >
                  {currentGroup.name}
                </h1>
                {currentGroup.category && currentGroup.category !== "other" && (
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                      darkMode
                        ? "bg-primary-950/20 text-primary-400 border border-primary-900/30"
                        : "bg-primary-50 text-primary-600 border border-primary-100"
                    }`}
                  >
                    {currentGroup.category}
                  </span>
                )}
              </div>
              {currentGroup.description && (
                <p
                  className={`text-sm mt-1.5 font-medium ${
                    darkMode ? "text-surface-400" : "text-surface-500"
                  }`}
                >
                  {currentGroup.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    darkMode ? "text-surface-400" : "text-surface-500"
                  }`}
                >
                  <HiOutlineUserGroup className="w-4 h-4 text-surface-400" />
                  {currentGroup.members.length} members
                </span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    darkMode ? "text-surface-400" : "text-surface-500"
                  }`}
                >
                  <HiOutlineBanknotes className="w-4 h-4 text-surface-400" />
                  {expenses.length} expenses
                </span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-bold ${
                    darkMode ? "text-primary-450" : "text-primary-650"
                  }`}
                >
                  ₹{totalAmount.toLocaleString()} total
                </span>
              </div>
            </div>
          </div>

          {/* Desktop & Tablet Actions Header */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {isAdmin && (
              <button
                onClick={() => setShowEditModal(true)}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer min-h-[44px] ${
                  darkMode
                    ? "bg-surface-700 text-surface-300 hover:bg-surface-650 border border-surface-650"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200 border border-surface-200"
                }`}
              >
                <HiOutlinePencilSquare className="w-4.5 h-4.5" />
                Edit
              </button>
            )}
            <button
              onClick={handleLeaveGroup}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer min-h-[44px] ${
                darkMode
                  ? "bg-surface-700 text-red-400 hover:text-red-300 hover:bg-surface-650 border border-surface-650"
                  : "bg-surface-100 text-red-650 hover:bg-red-50 hover:text-red-700 border border-surface-200"
              }`}
            >
              <HiOutlineArrowRightOnRectangle className="w-4.5 h-4.5" />
              Leave
            </button>
            <button
              onClick={() => setShowCommunityModal(true)}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer min-h-[44px] ${
                darkMode
                  ? "bg-surface-700 text-surface-300 hover:bg-surface-650 border border-surface-650"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 border border-surface-200"
              }`}
            >
              <HiOutlineGlobeAlt className="w-4.5 h-4.5" />
              Share
            </button>
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary-500 text-white rounded-2xl text-xs font-bold hover:bg-primary-600 transition-all shadow-md hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer min-h-[44px]"
            >
              <HiOutlinePlus className="w-4.5 h-4.5" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Member list chips */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-surface-100 dark:border-surface-700/50">
          {currentGroup.members.map((member) => {
            const memberUser = member.user || {};
            const displayName = memberUser.name || memberUser.username || "Unknown";
            const uname = memberUser.username || "";
            const isMe = (memberUser._id || memberUser) === user?._id;
            return (
              <span
                key={memberUser._id || uname}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold ${
                  darkMode
                    ? "bg-surface-700 text-surface-300"
                    : "bg-surface-50 text-surface-600"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    darkMode
                      ? "bg-primary-900/40 text-primary-400"
                      : "bg-primary-100 text-primary-750"
                  }`}
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
                {displayName}
                {member.role === "admin" && (
                  <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-bold ${
                    darkMode ? "bg-amber-950/40 text-amber-400 border border-amber-900/30" : "bg-amber-50 text-amber-600"
                  }`}>Admin</span>
                )}
                {isAdmin && !isMe && (
                  <button
                    onClick={() => handleRemoveMember(memberUser._id)}
                    className="ml-1 hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer min-w-[20px] min-h-[20px] flex items-center justify-center"
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
          <div className="mt-5 pt-5 border-t border-surface-100 dark:border-surface-700/50 flex gap-2">
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              placeholder="Invite by username..."
              className={`flex-1 px-4 py-2.5 rounded-2xl border text-sm outline-none transition-all duration-200 min-h-[44px] ${
                darkMode
                  ? "bg-surface-700/40 border-surface-600 text-white placeholder-surface-500 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  : "bg-surface-50 border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              }`}
            />
            <button
              onClick={handleInvite}
              disabled={!inviteUsername.trim() || inviting}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-lg min-h-[44px]"
            >
              {inviting ? "Sending..." : "Invite"}
            </button>
          </div>
        )}
      </div>

      {/* Segmented Tab Pill Controller */}
      <div className="inline-flex p-1 bg-surface-100 dark:bg-surface-800 rounded-2xl gap-1 mb-6 border border-surface-200/50 dark:border-surface-700/40 w-full sm:w-auto">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center justify-center gap-1.5 flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer min-h-[40px] ${
            activeTab === "expenses"
              ? "bg-white dark:bg-surface-700 text-primary-500 dark:text-primary-400 shadow-sm"
              : "text-surface-500 hover:text-surface-850 dark:text-surface-400 dark:hover:text-white"
          }`}
        >
          <HiOutlineBanknotes className="w-4 h-4" />
          Expenses
        </button>
        <button
          onClick={() => setActiveTab("settlements")}
          className={`flex items-center justify-center gap-1.5 flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer min-h-[40px] ${
            activeTab === "settlements"
              ? "bg-white dark:bg-surface-700 text-primary-500 dark:text-primary-400 shadow-sm"
              : "text-surface-500 hover:text-surface-850 dark:text-surface-400 dark:hover:text-white"
          }`}
        >
          <HiOutlineScale className="w-4 h-4" />
          Settlements
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "expenses" ? (
        <div
          className={`rounded-3xl p-6 sm:p-8 transition-all duration-300 ${
            darkMode
              ? "bg-surface-800 border border-surface-700/60"
              : "bg-white border border-surface-200/60 shadow-sm"
          }`}
        >
          {/* Search Bar */}
          <div className="mb-5">
            <div className="relative">
              <HiOutlineMagnifyingGlass
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400 dark:text-surface-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expenses by title or payer..."
                className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm outline-none transition-all duration-200 min-h-[44px] ${
                  darkMode
                    ? "bg-surface-700/40 border-surface-650 text-white placeholder-surface-500 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                    : "bg-surface-50 border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                }`}
              />
            </div>
          </div>

          <ExpenseList expenses={filteredExpenses} onEdit={handleEdit} group={currentGroup} />
        </div>
      ) : (
        <div
          className={`rounded-3xl p-6 sm:p-8 transition-all duration-300 ${
            darkMode
              ? "bg-surface-800 border border-surface-700/60"
              : "bg-white border border-surface-200/60 shadow-sm"
          }`}
        >
          <SettlementSummary settlements={settlements} />
        </div>
      )}

      {/* Floating Action Button (FAB) on mobile for extremely premium UX */}
      <button
        onClick={() => {
          setEditingExpense(null);
          setShowForm(true);
        }}
        className="fixed bottom-6 right-6 md:hidden z-40 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 active:scale-95 transition-transform duration-200 cursor-pointer"
        aria-label="Add Expense FAB"
      >
        <HiOutlinePlus className="w-6 h-6" />
      </button>

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

      {/* Share to Community Modal */}
      {showCommunityModal && (
        <CreatePostModal
          group={currentGroup}
          onClose={() => setShowCommunityModal(false)}
        />
      )}
    </div>
  );
}
