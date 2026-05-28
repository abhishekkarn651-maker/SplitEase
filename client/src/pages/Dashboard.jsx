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
    <div className="space-y-8 animate-slide-up pb-10">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-3xl font-extrabold tracking-tight ${
              darkMode ? "text-white" : "text-surface-900"
            }`}
          >
            Dashboard
          </h1>
          <p
            className={`text-sm mt-1 font-medium ${
              darkMode ? "text-surface-400" : "text-surface-500"
            }`}
          >
            Manage trip spending, settle balances, and share travel spotlights.
          </p>
        </div>
        <Link
          to="/groups/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer transform active:scale-95 self-start sm:self-auto min-h-[44px]"
        >
          <span className="text-base font-bold">+</span> New Group
        </Link>
      </div>

      {/* Modern Fintech Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const CardContent = (
            <div className="flex flex-col justify-between h-full space-y-4">
              <div className="flex items-start justify-between">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    darkMode ? card.darkColor : card.color
                  } shadow-inner`}
                >
                  <card.icon className="w-5 h-5" />
                </div>
                {card.link && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    darkMode ? "bg-surface-700 text-surface-300" : "bg-surface-100 text-surface-600"
                  }`}>
                    Open
                  </span>
                )}
              </div>
              <div>
                <p
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    darkMode ? "text-surface-450" : "text-surface-400"
                  }`}
                >
                  {card.label}
                </p>
                <p
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 ${
                    darkMode ? "text-white" : "text-surface-900"
                  }`}
                >
                  {card.value}
                </p>
              </div>
            </div>
          );

          const cardClass = `rounded-3xl p-5 sm:p-6 transition-all duration-300 min-h-[144px] cursor-pointer ${
            darkMode
              ? "bg-surface-800 border border-surface-700/60 hover:bg-surface-700/40 hover:border-surface-600/80"
              : "bg-white border border-surface-200/60 shadow-sm hover:shadow-md hover:border-primary-300/40"
          } transform hover:-translate-y-0.5 active:scale-[0.99]`;

          if (card.link) {
            return (
              <Link
                key={card.label}
                to={card.link}
                className={`${cardClass} block`}
              >
                {CardContent}
              </Link>
            );
          }

          return (
            <div key={card.label} className={`${cardClass} cursor-default transform-none hover:translate-y-0 hover:shadow-sm`}>
              {CardContent}
            </div>
          );
        })}
      </div>

      {/* Premium Content Rows */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Activity Card */}
        <div
          className={`rounded-3xl p-6 sm:p-8 transition-all duration-300 ${
            darkMode
              ? "bg-surface-800 border border-surface-700/60"
              : "bg-white border border-surface-200/60 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className={`text-lg font-bold tracking-tight ${
                  darkMode ? "text-white" : "text-surface-800"
                }`}
              >
                Recent Activity
              </h2>
              <p className={`text-xs mt-0.5 ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                Latest expenses logged across all travel groups.
              </p>
            </div>
            <Link
              to="/groups"
              className="text-xs text-primary-500 hover:text-primary-600 font-bold flex items-center gap-1 transition-colors uppercase tracking-wider min-h-[44px] px-3"
            >
              View Groups <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {stats.recentActivity?.length > 0 ? (
            <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        darkMode
                          ? "bg-surface-700 text-primary-400 group-hover:bg-primary-950/20 group-hover:text-primary-300"
                          : "bg-surface-50 text-primary-600 group-hover:bg-primary-50 group-hover:text-primary-700"
                      }`}
                    >
                      <HiOutlineBanknotes className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold truncate transition-colors ${
                          darkMode ? "text-surface-150 group-hover:text-white" : "text-surface-800 group-hover:text-primary-600"
                        }`}
                      >
                        {activity.title}
                      </p>
                      <p
                        className={`text-xs mt-0.5 truncate ${
                          darkMode ? "text-surface-400" : "text-surface-550"
                        }`}
                      >
                        <span className="font-semibold text-surface-650 dark:text-surface-300">{activity.paidBy}</span> paid • {activity.groupName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-base font-extrabold shrink-0 ml-3 tracking-tight ${
                      darkMode ? "text-white" : "text-surface-900"
                    }`}
                  >
                    ₹{activity.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <HiOutlineBanknotes className={`w-12 h-12 mx-auto mb-3 opacity-30 ${darkMode ? "text-white" : "text-surface-800"}`} />
              <p
                className={`text-sm font-medium ${
                  darkMode ? "text-surface-400" : "text-surface-500"
                }`}
              >
                No expenses recorded. Create a trip group to log your first shared bill!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
