import { useApp } from "../../context/AppContext";

/**
 * LoadingSpinner — A simple, animated loading spinner.
 * Shows a pulsing green circle with a "Loading..." label.
 */
export default function LoadingSpinner({ message = "Loading..." }) {
  const { darkMode } = useApp();

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative w-12 h-12 mb-4">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900"></div>
        {/* Spinning arc */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin"></div>
      </div>
      <p
        className={`text-sm font-medium ${
          darkMode ? "text-surface-400" : "text-surface-500"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
