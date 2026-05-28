import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useCommunity } from "../context/CommunityContext";
import { useAuth } from "../context/AuthContext";
import PhotoGallery from "../components/community/PhotoGallery";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineGlobeAlt,
  HiOutlineCalendar,
  HiOutlineUserCircle,
  HiOutlineHandThumbUp,
  HiHandThumbUp,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineTrash,
  HiOutlineStar,
  HiStar,
} from "react-icons/hi2";

/**
 * PostDetails — Full view of a single community post.
 *
 * Shows: photo gallery, full review, location info, author,
 * helpful/wishlist buttons, and delete option for author.
 */
export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useApp();
  const { currentPost, loading, loadPost, voteHelpful, saveToWishlist, removePost } = useCommunity();
  const { user } = useAuth();

  useEffect(() => {
    loadPost(id);
  }, [id, loadPost]);

  // Relative time
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) =>
      i < rating ? (
        <HiStar key={i} className="w-5 h-5 text-amber-400" />
      ) : (
        <HiOutlineStar key={i} className="w-5 h-5 text-amber-300/40" />
      )
    );
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await removePost(id);
        navigate("/community");
      } catch {
        // Error handled in context
      }
    }
  };

  const isAuthor = currentPost?.author?._id === user?._id;

  // Category config
  const categoryConfig = {
    travel: { emoji: "🧳", label: "Travel", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    food: { emoji: "🍜", label: "Food", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    adventure: { emoji: "🏔️", label: "Adventure", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    culture: { emoji: "🏛️", label: "Culture", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    nature: { emoji: "🌿", label: "Nature", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    other: { emoji: "📝", label: "Other", color: "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400" },
  };

  if (loading && !currentPost) return <LoadingSpinner message="Loading post..." />;
  if (!currentPost) return null;

  const cat = categoryConfig[currentPost.category] || categoryConfig.other;

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      {/* Back link */}
      <Link
        to="/community"
        className={`inline-flex items-center gap-1 text-sm mb-5 transition-colors ${
          darkMode
            ? "text-surface-400 hover:text-white"
            : "text-surface-500 hover:text-surface-800"
        }`}
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Community
      </Link>

      {/* Main Card */}
      <div
        className={`rounded-2xl overflow-hidden ${
          darkMode
            ? "bg-surface-800 border border-surface-700"
            : "bg-white border border-surface-200 shadow-card"
        }`}
      >
        {/* Photo Gallery */}
        {currentPost.photos && currentPost.photos.length > 0 && (
          <div className="p-4 pb-0">
            <PhotoGallery photos={currentPost.photos} />
          </div>
        )}

        {/* Content */}
        <div className="p-5 sm:p-6">
          {/* Category + Rating row */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
                darkMode
                  ? cat.color.split("dark:").pop()
                  : cat.color.split(" dark:")[0]
              }`}
            >
              {cat.emoji} {cat.label}
            </span>

            <div className="flex items-center gap-1">
              {renderStars(currentPost.rating)}
              <span className={`text-sm font-medium ml-1 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
                {currentPost.rating}/5
              </span>
            </div>
          </div>

          {/* Title */}
          <h1
            className={`text-xl sm:text-2xl font-bold leading-snug mb-3 ${
              darkMode ? "text-white" : "text-surface-800"
            }`}
          >
            {currentPost.title}
          </h1>

          {/* Destination */}
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineMapPin className="w-4.5 h-4.5 text-primary-500 shrink-0" />
            <span className={`text-sm font-medium ${darkMode ? "text-primary-400" : "text-primary-600"}`}>
              {currentPost.destination}
            </span>
          </div>

          {/* Meta info row */}
          <div className={`flex flex-wrap items-center gap-4 pb-4 mb-5 border-b ${
            darkMode ? "border-surface-700" : "border-surface-100"
          }`}>
            {/* Author */}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  darkMode
                    ? "bg-primary-900/40 text-primary-400"
                    : "bg-primary-100 text-primary-700"
                }`}
              >
                {currentPost.author?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? "text-surface-200" : "text-surface-700"}`}>
                  {currentPost.author?.name || "Anonymous"}
                </p>
                <p className={`text-[10px] ${darkMode ? "text-surface-500" : "text-surface-400"}`}>
                  @{currentPost.author?.username}
                </p>
              </div>
            </div>

            {/* Separator */}
            <div className={`w-px h-6 ${darkMode ? "bg-surface-700" : "bg-surface-200"}`} />

            {/* Group name */}
            <div className="flex items-center gap-1.5">
              <HiOutlineUserCircle className={`w-4 h-4 ${darkMode ? "text-surface-400" : "text-surface-500"}`} />
              <span className={`text-sm ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                {currentPost.groupName}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5">
              <HiOutlineCalendar className={`w-4 h-4 ${darkMode ? "text-surface-400" : "text-surface-500"}`} />
              <span className={`text-sm ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                {formatDate(currentPost.createdAt)}
              </span>
              <span className={`text-xs ${darkMode ? "text-surface-500" : "text-surface-400"}`}>
                ({timeAgo(currentPost.createdAt)})
              </span>
            </div>
          </div>

          {/* Review text */}
          <div className="mb-6">
            <p
              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                darkMode ? "text-surface-300" : "text-surface-600"
              }`}
            >
              {currentPost.review}
            </p>
          </div>

          {/* Location card */}
          {currentPost.location && (
            <div
              className={`rounded-xl p-4 mb-6 ${
                darkMode
                  ? "bg-surface-700/50 border border-surface-600"
                  : "bg-surface-50 border border-surface-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineGlobeAlt className={`w-4 h-4 ${darkMode ? "text-surface-400" : "text-surface-500"}`} />
                <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                  Location
                </span>
              </div>
              <p className={`text-sm font-medium ${darkMode ? "text-surface-200" : "text-surface-700"}`}>
                {[currentPost.location.city, currentPost.location.state, currentPost.location.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className={`flex items-center justify-between pt-4 border-t ${
            darkMode ? "border-surface-700" : "border-surface-100"
          }`}>
            <div className="flex items-center gap-3">
              {/* Helpful */}
              <button
                onClick={() => voteHelpful(currentPost._id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  currentPost.isHelpful
                    ? "bg-primary-500 text-white shadow-sm"
                    : darkMode
                    ? "bg-surface-700 text-surface-300 hover:bg-surface-600 border border-surface-600"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200 border border-surface-200"
                }`}
              >
                {currentPost.isHelpful ? (
                  <HiHandThumbUp className="w-4.5 h-4.5" />
                ) : (
                  <HiOutlineHandThumbUp className="w-4.5 h-4.5" />
                )}
                {currentPost.helpfulCount || 0} Helpful
              </button>

              {/* Wishlist */}
              <button
                onClick={() => saveToWishlist(currentPost._id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  currentPost.isWishlisted
                    ? "bg-amber-500 text-white shadow-sm"
                    : darkMode
                    ? "bg-surface-700 text-surface-300 hover:bg-surface-600 border border-surface-600"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200 border border-surface-200"
                }`}
              >
                {currentPost.isWishlisted ? (
                  <HiBookmark className="w-4.5 h-4.5" />
                ) : (
                  <HiOutlineBookmark className="w-4.5 h-4.5" />
                )}
                {currentPost.isWishlisted ? "Wishlisted" : "Save to Wishlist"}
              </button>
            </div>

            {/* Delete (author only) */}
            {isAuthor && (
              <button
                onClick={handleDelete}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  darkMode
                    ? "bg-surface-700 text-red-400 hover:text-red-300 hover:bg-surface-600 border border-surface-600"
                    : "bg-surface-100 text-red-600 hover:bg-red-50 hover:text-red-700 border border-surface-200"
                }`}
              >
                <HiOutlineTrash className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
