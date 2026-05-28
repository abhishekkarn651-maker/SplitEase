import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useCommunity } from "../../context/CommunityContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  HiOutlineMapPin,
  HiOutlineHandThumbUp,
  HiHandThumbUp,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineStar,
  HiStar,
  HiOutlineShare,
} from "react-icons/hi2";

/**
 * PostCard — A single community post card for the feed grid.
 *
 * Shows: thumbnail photo, destination, rating, review preview,
 * author/group info, helpful & wishlist buttons, relative time.
 */
export default function PostCard({ post }) {
  const { darkMode } = useApp();
  const { voteHelpful, saveToWishlist } = useCommunity();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Relative time helper
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

  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) =>
      i < rating ? (
        <HiStar key={i} className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <HiOutlineStar key={i} className="w-3.5 h-3.5 text-amber-300/50" />
      )
    );
  };

  const handleHelpful = async (e) => {
    e.stopPropagation();
    await voteHelpful(post._id);
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    await saveToWishlist(post._id);
  };

  const handleShare = async (e) => {
    e.stopPropagation(); // Prevent card navigation
    const postUrl = `${window.location.origin}/community/${post._id}`;
    const shareData = {
      title: post.title,
      text: `Check out this travel experience at ${post.destination}!`,
      url: postUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard! 📋");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  // Category badge colors
  const categoryColors = {
    travel: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    food: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    adventure: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    culture: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    nature: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    other: "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400",
  };

  return (
    <div
      onClick={() => navigate(`/community/${post._id}`)}
      className={`group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${
        darkMode
          ? "bg-surface-800 border border-surface-700 hover:border-surface-600"
          : "bg-white border border-surface-200 shadow-card hover:border-primary-200"
      }`}
    >
      {/* Photo Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/20 dark:to-surface-800">
        {post.photos && post.photos.length > 0 ? (
          <img
            src={post.photos[0]}
            alt={post.destination}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiOutlineMapPin className={`w-12 h-12 ${darkMode ? "text-surface-600" : "text-primary-200"}`} />
          </div>
        )}

        {/* Category badge */}
        <span
          className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm ${
            darkMode
              ? categoryColors[post.category]?.split("dark:").pop() || "bg-surface-700 text-surface-400"
              : categoryColors[post.category]?.split(" dark:")[0] || "bg-surface-100 text-surface-600"
          }`}
        >
          {post.category}
        </span>

        {/* Photo count badge */}
        {post.photos && post.photos.length > 1 && (
          <span className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm">
            📷 {post.photos.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Destination */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <HiOutlineMapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
          <span className={`text-xs font-medium truncate ${darkMode ? "text-primary-400" : "text-primary-600"}`}>
            {post.destination}
          </span>
        </div>

        {/* Title */}
        <h3
          className={`text-sm font-semibold leading-snug mb-1.5 line-clamp-2 ${
            darkMode ? "text-white" : "text-surface-800"
          }`}
        >
          {post.title}
        </h3>

        {/* Star rating */}
        <div className="flex items-center gap-0.5 mb-2">
          {renderStars(post.rating)}
        </div>

        {/* Review preview */}
        <p
          className={`text-xs leading-relaxed line-clamp-3 mb-3 ${
            darkMode ? "text-surface-400" : "text-surface-500"
          }`}
        >
          {post.review}
        </p>

        {/* Author & Group */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              darkMode
                ? "bg-primary-900/40 text-primary-400"
                : "bg-primary-100 text-primary-700"
            }`}
          >
            {post.author?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-medium truncate ${darkMode ? "text-surface-300" : "text-surface-700"}`}>
              {post.author?.name || "Anonymous"}
            </p>
            <p className={`text-[10px] truncate ${darkMode ? "text-surface-500" : "text-surface-400"}`}>
              {post.groupName ? `${post.groupName} • ` : ""}{timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-between pt-3 border-t ${darkMode ? "border-surface-700" : "border-surface-100"}`}>
          <button
            onClick={handleHelpful}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              post.isHelpful
                ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                : darkMode
                ? "text-surface-400 hover:text-primary-400 hover:bg-surface-700"
                : "text-surface-500 hover:text-primary-600 hover:bg-primary-50"
            }`}
          >
            {post.isHelpful ? (
              <HiHandThumbUp className="w-3.5 h-3.5" />
            ) : (
              <HiOutlineHandThumbUp className="w-3.5 h-3.5" />
            )}
            {post.helpfulCount || 0} Helpful
          </button>

          <button
            onClick={handleWishlist}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              post.isWishlisted
                ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                : darkMode
                ? "text-surface-400 hover:text-amber-400 hover:bg-surface-700"
                : "text-surface-500 hover:text-amber-600 hover:bg-amber-50"
            }`}
          >
            {post.isWishlisted ? (
              <HiBookmark className="w-3.5 h-3.5" />
            ) : (
              <HiOutlineBookmark className="w-3.5 h-3.5" />
            )}
            Save
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              darkMode
                ? "text-surface-400 hover:text-primary-400 hover:bg-surface-700"
                : "text-surface-500 hover:text-primary-600 hover:bg-primary-50"
            }`}
          >
            <HiOutlineShare className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
