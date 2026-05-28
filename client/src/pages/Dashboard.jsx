import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  HiOutlineUserGroup,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowRight,
} from "react-icons/hi2";

/**
 * Dashboard — Main landing page.
 * Shows stats cards (total groups, expenses, amount, pending)
 * and a recent activity feed.
 */
export default function Dashboard() {
  const { dashboardStats, loading, loadDashboardStats, darkMode } = useApp();

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  if (loading && !dashboardStats) return <LoadingSpinner message="Loading dashboard..." />;

  const stats = dashboardStats || {
    totalGroups: 0,
    totalExpenses: 0,
    totalAmount: 0,
    totalPendingBalance: 0,
    recentActivity: [],
  };

  // Stats card configuration
  const statCards = [
    {
      label: "Total Groups",
      value: stats.totalGroups,
      icon: HiOutlineUserGroup,
      color: "bg-primary-50 text-primary-600",
      darkColor: "bg-primary-900/20 text-primary-400",
      link: "/groups",
    },
    {
      label: "Total Expenses",
      value: stats.totalExpenses,
      icon: HiOutlineBanknotes,
      color: "bg-blue-50 text-blue-600",
      darkColor: "bg-blue-900/20 text-blue-400",
    },
    {
      label: "Total Spent",
      value: `₹${stats.totalAmount.toLocaleString()}`,
      icon: HiOutlineArrowTrendingUp,
      color: "bg-amber-50 text-amber-600",
      darkColor: "bg-amber-900/20 text-amber-400",
    },
    {
      label: "Pending Balance",
      value: `₹${stats.totalPendingBalance.toLocaleString()}`,
      icon: HiOutlineClock,
      color: "bg-rose-50 text-rose-600",
      darkColor: "bg-rose-900/20 text-rose-400",
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-surface-800"
            }`}
          >
            Dashboard
          </h1>
          <p
            className={`text-sm mt-1 ${
              darkMode ? "text-surface-400" : "text-surface-500"
            }`}
          >
            Overview of your expense groups
          </p>
        </div>
        <Link
          to="/groups/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          + New Group
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const CardContent = (
            <>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  darkMode ? card.darkColor : card.color
                }`}
              >
                <card.icon className="w-5 h-5" />
              </div>
              <p
                className={`text-xs font-medium uppercase tracking-wide ${
                  darkMode ? "text-surface-400" : "text-surface-500"
                }`}
              >
                {card.label}
              </p>
              <p
                className={`text-xl sm:text-2xl font-bold mt-0.5 ${
                  darkMode ? "text-white" : "text-surface-800"
                }`}
              >
                {card.value}
              </p>
            </>
          );

          const cardClass = `rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:shadow-card-hover ${
            darkMode
              ? "bg-surface-800 border border-surface-700 hover:border-surface-600"
              : "bg-white border border-surface-200 shadow-card hover:border-primary-200"
          }`;

          if (card.link) {
            return (
              <Link
                key={card.label}
                to={card.link}
                className={`${cardClass} block cursor-pointer`}
              >
                {CardContent}
              </Link>
            );
          }

          return (
            <div key={card.label} className={cardClass}>
              {CardContent}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div
        className={`rounded-2xl p-5 sm:p-6 transition-colors ${
          darkMode
            ? "bg-surface-800 border border-surface-700"
            : "bg-white border border-surface-200 shadow-card"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-lg font-semibold ${
              darkMode ? "text-white" : "text-surface-800"
            }`}
          >
            Recent Activity
          </h2>
          <Link
            to="/groups"
            className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
          >
            View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentActivity?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity._id}
                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                  darkMode
                    ? "bg-surface-700/50 hover:bg-surface-700"
                    : "bg-surface-50 hover:bg-surface-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      darkMode
                        ? "bg-primary-900/30 text-primary-400"
                        : "bg-primary-50 text-primary-600"
                    }`}
                  >
                    <HiOutlineBanknotes className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        darkMode ? "text-surface-200" : "text-surface-700"
                      }`}
                    >
                      {activity.title}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        darkMode ? "text-surface-400" : "text-surface-500"
                      }`}
                    >
                      {activity.paidBy} paid • {activity.groupName}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold shrink-0 ml-3 ${
                    darkMode ? "text-white" : "text-surface-800"
                  }`}
                >
                  ₹{activity.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p
            className={`text-sm text-center py-8 ${
              darkMode ? "text-surface-400" : "text-surface-500"
            }`}
          >
            No expenses yet. Create a group and add your first expense!
          </p>
        )}
      </div>
    </div>
  );
}
