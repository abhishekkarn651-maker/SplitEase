import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import {
  HiOutlineUserGroup,
  HiOutlineArrowRight,
  HiOutlineTrash,
} from "react-icons/hi2";

/**
 * GroupList — Displays all groups as cards.
 * Each card shows the group name, member count, and a link to view details.
 */
export default function GroupList() {
  const { groups, loading, loadGroups, removeGroup, darkMode } = useApp();

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  if (loading && groups.length === 0) return <LoadingSpinner message="Loading groups..." />;

  // Handle delete with confirmation
  const handleDelete = async (e, id, name) => {
    e.preventDefault(); // Prevent navigating to the group
    e.stopPropagation();
    if (window.confirm(`Delete "${name}" and all its expenses?`)) {
      await removeGroup(id);
    }
  };  return (
    <div className="animate-slide-up pb-10">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1
            className={`text-3xl font-extrabold tracking-tight ${
              darkMode ? "text-white" : "text-surface-900"
            }`}
          >
            Groups
          </h1>
          <p
            className={`text-sm mt-1 font-semibold ${
              darkMode ? "text-surface-400" : "text-surface-500"
            }`}
          >
            {groups.length} active trip group{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/groups/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer transform active:scale-95 self-start sm:self-auto min-h-[44px]"
        >
          <span className="text-base font-bold">+</span> New Group
        </Link>
      </div>

      {/* Group Cards Grid */}
      {groups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No groups yet"
          description="Create your first group to start splitting expenses with friends."
          action={
            <Link
              to="/groups/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 text-white rounded-2xl text-sm font-semibold hover:bg-primary-600 transition-all cursor-pointer shadow-md hover:shadow-lg"
            >
              Create a Group
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {groups.map((group) => (
            <Link
              key={group._id}
              to={`/groups/${group._id}`}
              className={`group rounded-3xl p-6 transition-all duration-300 ${
                darkMode
                  ? "bg-surface-800 border border-surface-700/60 hover:bg-surface-700/40 hover:border-surface-650"
                  : "bg-white border border-surface-200/60 shadow-sm hover:shadow-md hover:border-primary-300/40"
              } transform hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                      darkMode
                        ? "bg-surface-700 text-primary-400"
                        : "bg-surface-50 text-primary-600"
                    } shadow-inner`}
                  >
                    {group.icon || "👥"}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={`font-bold text-base truncate ${
                        darkMode ? "text-white" : "text-surface-850"
                      }`}
                    >
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <p
                        className={`text-xs font-semibold ${
                          darkMode ? "text-surface-400" : "text-surface-500"
                        }`}
                      >
                        {group.members.length} members
                      </p>
                      {group.category && group.category !== "other" && (
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            darkMode
                              ? "bg-primary-950/20 text-primary-400 border border-primary-900/30"
                              : "bg-primary-50 text-primary-600 border border-primary-100"
                          }`}
                        >
                          {group.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, group._id, group.name)}
                  className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shrink-0 min-h-[38px] ${
                    darkMode
                      ? "hover:bg-red-950/30 text-surface-400 hover:text-red-400"
                      : "hover:bg-red-50 text-surface-450 hover:text-red-500"
                  }`}
                  aria-label={`Delete ${group.name}`}
                  title="Delete Group"
                >
                  <HiOutlineTrash className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Member avatars (first letters) */}
              <div className="flex items-center mt-5">
                <div className="flex items-center -space-x-2">
                  {group.members.slice(0, 5).map((member, i) => {
                    const memberUser = member.user || {};
                    const displayName = memberUser.name || memberUser.username || "?";
                    return (
                      <div
                        key={memberUser._id || i}
                        className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                          darkMode
                            ? "border-surface-800 bg-surface-700 text-surface-300"
                            : "border-white bg-surface-100 text-surface-650"
                        }`}
                        title={displayName}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    );
                  })}
                  {group.members.length > 5 && (
                    <div
                      className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                        darkMode
                          ? "border-surface-800 bg-surface-600 text-surface-300"
                          : "border-white bg-surface-200 text-surface-500"
                      }`}
                    >
                      +{group.members.length - 5}
                    </div>
                  )}
                </div>

                <div className="flex-1"></div>
                <div className={`p-1.5 rounded-xl ${
                  darkMode ? "bg-surface-700/50 text-surface-400 group-hover:text-white" : "bg-surface-50 text-surface-400 group-hover:text-primary-500"
                } transition-colors`}>
                  <HiOutlineArrowRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
