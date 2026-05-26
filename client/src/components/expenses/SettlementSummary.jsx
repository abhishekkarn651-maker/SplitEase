import { useApp } from "../../context/AppContext";
import { HiOutlineArrowRight } from "react-icons/hi2";

/**
 * SettlementSummary — Shows the simplified debt settlements.
 *
 * Displays:
 *  - Each member's net balance (positive = owed, negative = owes)
 *  - The minimal list of "who pays whom" to settle all debts
 */
export default function SettlementSummary({ settlements }) {
  const { darkMode } = useApp();

  if (!settlements) return null;

  const { balances, settlements: debts, members } = settlements;

  return (
    <div className="space-y-4">
      {/* Per-member Balances */}
      <div>
        <h3
          className={`text-sm font-semibold mb-3 ${
            darkMode ? "text-surface-200" : "text-surface-700"
          }`}
        >
          Member Balances
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {members.map((member) => {
            const balance = balances[member] || 0;
            const isPositive = balance > 0;
            const isZero = Math.abs(balance) < 0.01;

            return (
              <div
                key={member}
                className={`rounded-xl p-3 text-center transition-colors ${
                  darkMode
                    ? "bg-surface-700/50 border border-surface-600"
                    : "bg-surface-50 border border-surface-200"
                }`}
              >
                <p
                  className={`text-sm font-medium truncate ${
                    darkMode ? "text-surface-200" : "text-surface-700"
                  }`}
                >
                  {member}
                </p>
                <p
                  className={`text-sm font-bold mt-0.5 ${
                    isZero
                      ? darkMode
                        ? "text-surface-400"
                        : "text-surface-500"
                      : isPositive
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {isZero
                    ? "Settled ✓"
                    : isPositive
                    ? `+₹${balance.toFixed(2)}`
                    : `-₹${Math.abs(balance).toFixed(2)}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simplified Settlements */}
      <div>
        <h3
          className={`text-sm font-semibold mb-3 ${
            darkMode ? "text-surface-200" : "text-surface-700"
          }`}
        >
          Settlements
        </h3>

        {debts.length === 0 ? (
          <div
            className={`rounded-xl p-4 text-center ${
              darkMode
                ? "bg-green-900/20 border border-green-800"
                : "bg-green-50 border border-green-100"
            }`}
          >
            <p className="text-sm text-green-600 font-medium">
              🎉 All settled! No pending debts.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {debts.map((debt, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl p-3.5 transition-colors ${
                  darkMode
                    ? "bg-surface-700/50 border border-surface-600"
                    : "bg-white border border-surface-200 shadow-card"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* From */}
                  <span
                    className={`text-sm font-semibold ${
                      darkMode ? "text-red-400" : "text-red-500"
                    }`}
                  >
                    {debt.from}
                  </span>
                  <HiOutlineArrowRight
                    className={`w-4 h-4 shrink-0 ${
                      darkMode ? "text-surface-500" : "text-surface-400"
                    }`}
                  />
                  {/* To */}
                  <span
                    className={`text-sm font-semibold ${
                      darkMode ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {debt.to}
                  </span>
                </div>
                <span
                  className={`text-sm font-bold shrink-0 ml-3 ${
                    darkMode ? "text-white" : "text-surface-800"
                  }`}
                >
                  ₹{debt.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
