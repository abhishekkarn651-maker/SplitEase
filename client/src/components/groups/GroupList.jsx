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
  };

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-surface-800"
            }`}
          >
            Groups
          </h1>
          <p
            className={`text-sm mt-1 ${
              darkMode ? "text-surface-400" : "text-surface-500"
            }`}
          >
            {groups.length} group{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/groups/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          + New Group
        </Link>
      </div>

      {/* Group Cards */}
      {groups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No groups yet"
          description="Create your first group to start splitting expenses with friends."
          action={
            <Link
              to="/groups/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-all"
            >
              Create a Group
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Link
              key={group._id}
              to={`/groups/${group._id}`}
              className={`group rounded-2xl p-5 transition-all duration-200 hover:shadow-card-hover ${
                darkMode
                  ? "bg-surface-800 border border-surface-700 hover:border-primary-700"
                  : "bg-white border border-surface-200 shadow-card hover:border-primary-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                      darkMode
                        ? "bg-primary-900/30"
                        : "bg-primary-50"
                    }`}
                  >
                    {group.icon || "👥"}
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${
                        darkMode ? "text-white" : "text-surface-800"
                      }`}
                    >
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p
                        className={`text-xs ${
                          darkMode ? "text-surface-400" : "text-surface-500"
                        }`}
                      >
                        {group.members.length} members
                      </p>
                      {group.category && group.category !== "other" && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            darkMode
                              ? "bg-primary-900/30 text-primary-400"
                              : "bg-primary-50 text-primary-600"
                          }`}
                        >
                          {group.category.charAt(0).toUpperCase() + group.category.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, group._id, group.name)}
                  className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${
                    darkMode
                      ? "hover:bg-red-900/30 text-surface-400 hover:text-red-400"
                      : "hover:bg-red-50 text-surface-400 hover:text-red-500"
                  }`}
                  aria-label={`Delete ${group.name}`}
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>

              {/* Member avatars (first letters) */}
              <div className="flex items-center mt-4 -space-x-2">
                {group.members.slice(0, 5).map((member, i) => {
                const memberUser = member.user || {};
                const displayName = memberUser.name || memberUser.username || "?";
                return (
                  <div
                    key={memberUser._id || i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                      darkMode
                        ? "border-surface-800 bg-surface-700 text-surface-300"
                        : "border-white bg-surface-100 text-surface-600"
                    }`}
                    title={displayName}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                );
              })}
                {group.members.length > 5 && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                      darkMode
                        ? "border-surface-800 bg-surface-600 text-surface-300"
                        : "border-white bg-surface-200 text-surface-500"
                    }`}
                  >
                    +{group.members.length - 5}
                  </div>
                )}

                <div className="flex-1"></div>
                <HiOutlineArrowRight
                  className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                    darkMode ? "text-surface-400" : "text-surface-400"
                  }`}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
