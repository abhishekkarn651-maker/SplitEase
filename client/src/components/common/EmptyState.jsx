import { useApp } from "../../context/AppContext";

/**
 * EmptyState — Shown when a list has no items.
 * Displays an icon, title, description, and optional action button.
 */
export default function EmptyState({ icon, title, description, action }) {
  const { darkMode } = useApp();

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {icon && (
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            darkMode ? "bg-surface-800" : "bg-surface-100"
          }`}
        >
          <span className="text-3xl">{icon}</span>
        </div>
      )}
      <h3
        className={`text-lg font-semibold mb-1 ${
          darkMode ? "text-surface-200" : "text-surface-700"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-sm mb-4 max-w-sm text-center ${
          darkMode ? "text-surface-400" : "text-surface-500"
        }`}
      >
        {description}
      </p>
      {action && action}
    </div>
  );
}
