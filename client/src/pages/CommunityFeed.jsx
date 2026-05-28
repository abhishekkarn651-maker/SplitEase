import { useEffect, useState, useCallback, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useCommunity } from "../context/CommunityContext";
import PostCard from "../components/community/PostCard";
import CreatePostModal from "../components/community/CreatePostModal";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  HiOutlineGlobeAlt,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineXMark,
  HiOutlinePlus,
} from "react-icons/hi2";

/**
 * CommunityFeed — Main /community page.
 *
 * Displays a responsive grid of community posts with:
 *  - Hero section with gradient
 *  - Category filter pills
 *  - Sort dropdown (newest / most helpful)
 *  - Search bar
 *  - Infinite scroll pagination
 *  - Skeleton loading cards
 */
export default function CommunityFeed() {
  const { darkMode } = useApp();
  const { posts, loading, hasMore, loadPosts, resetFeed, page } = useCommunity();

  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const categories = [
    { value: "all", label: "All", emoji: "✨" },
    { value: "travel", label: "Travel", emoji: "🧳" },
    { value: "food", label: "Food", emoji: "🍜" },
    { value: "adventure", label: "Adventure", emoji: "🏔️" },
    { value: "culture", label: "Culture", emoji: "🏛️" },
    { value: "nature", label: "Nature", emoji: "🌿" },
  ];

  // Build params from current filters
  const buildParams = useCallback(
    (pageNum = 1) => ({
      page: pageNum,
      limit: 12,
      sort: sortBy,
      category: activeCategory,
      search: searchQuery,
    }),
    [sortBy, activeCategory, searchQuery]
  );

  // Initial load and filter changes
  useEffect(() => {
    resetFeed();
    loadPosts(buildParams(1), false);
  }, [activeCategory, sortBy, searchQuery, loadPosts, resetFeed, buildParams]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts(buildParams(page + 1), true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    observerRef.current = observer;

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [loading, hasMore, page, loadPosts, buildParams]);

  // Debounced search
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(e.target.value.trim());
    }, 400);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  // Skeleton card for loading state
  const SkeletonCard = () => (
    <div
      className={`rounded-2xl overflow-hidden ${
        darkMode
          ? "bg-surface-800 border border-surface-700"
          : "bg-white border border-surface-200"
      }`}
    >
      <div className={`aspect-[4/3] animate-shimmer ${darkMode ? "bg-surface-700" : "bg-surface-200"}`} />
      <div className="p-4 space-y-3">
        <div className={`h-3 w-2/3 rounded-full animate-shimmer ${darkMode ? "bg-surface-700" : "bg-surface-200"}`} />
        <div className={`h-4 w-full rounded-full animate-shimmer ${darkMode ? "bg-surface-700" : "bg-surface-200"}`} />
        <div className={`h-3 w-1/2 rounded-full animate-shimmer ${darkMode ? "bg-surface-700" : "bg-surface-200"}`} />
        <div className="space-y-2">
          <div className={`h-3 w-full rounded-full animate-shimmer ${darkMode ? "bg-surface-700" : "bg-surface-200"}`} />
          <div className={`h-3 w-4/5 rounded-full animate-shimmer ${darkMode ? "bg-surface-700" : "bg-surface-200"}`} />
        </div>
        <div className={`h-8 w-full rounded-lg animate-shimmer ${darkMode ? "bg-surface-700" : "bg-surface-200"}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Hero Section */}
      <div
        className={`relative rounded-2xl p-6 sm:p-8 overflow-hidden ${
          darkMode
            ? "bg-gradient-to-br from-primary-900/40 via-surface-800 to-surface-800 border border-surface-700"
            : "bg-gradient-to-br from-primary-50 via-primary-100/50 to-white border border-primary-100"
        }`}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineGlobeAlt className="w-6 h-6 text-primary-500" />
            <h1
              className={`text-2xl sm:text-3xl font-bold ${
                darkMode ? "text-white" : "text-surface-800"
              }`}
            >
              Discover Travel Experiences
            </h1>
          </div>
          <p
            className={`text-sm sm:text-base max-w-2xl ${
              darkMode ? "text-surface-400" : "text-surface-500"
            }`}
          >
            Explore authentic reviews, hidden gems, and travel tips shared by the SplitEase community.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Share Your Experience
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="space-y-3">
        {/* Search + Sort Row */}
        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                darkMode ? "text-surface-400" : "text-surface-400"
              }`}
            />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search destinations, reviews..."
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                darkMode
                  ? "bg-surface-800 border-surface-700 text-white placeholder-surface-400 focus:border-primary-500"
                  : "bg-white border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              }`}
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full cursor-pointer ${
                  darkMode ? "text-surface-400 hover:text-white" : "text-surface-400 hover:text-surface-700"
                }`}
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`appearance-none pl-9 pr-8 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none cursor-pointer ${
                darkMode
                  ? "bg-surface-800 border-surface-700 text-surface-300 focus:border-primary-500"
                  : "bg-white border-surface-200 text-surface-600 focus:border-primary-500"
              }`}
            >
              <option value="newest">Newest</option>
              <option value="helpful">Most Helpful</option>
            </select>
            <HiOutlineFunnel className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
              darkMode ? "text-surface-400" : "text-surface-400"
            }`} />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeCategory === cat.value
                  ? "bg-primary-500 text-white shadow-sm"
                  : darkMode
                  ? "bg-surface-800 text-surface-300 hover:bg-surface-700 border border-surface-700"
                  : "bg-white text-surface-600 hover:bg-surface-100 border border-surface-200"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}

            {/* Loading skeletons while appending */}
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
          </div>

          {/* Infinite scroll trigger */}
          {hasMore && <div ref={loadMoreRef} className="h-10" />}

          {!hasMore && posts.length > 0 && (
            <p
              className={`text-center text-sm py-6 ${
                darkMode ? "text-surface-500" : "text-surface-400"
              }`}
            >
              You've reached the end ✨
            </p>
          )}
        </>
      ) : loading ? (
        /* Initial loading — show skeleton grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div
          className={`text-center py-16 rounded-2xl ${
            darkMode
              ? "bg-surface-800 border border-surface-700"
              : "bg-white border border-surface-200 shadow-card"
          }`}
        >
          <HiOutlineGlobeAlt className={`w-16 h-16 mx-auto mb-4 ${
            darkMode ? "text-surface-600" : "text-surface-300"
          }`} />
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-surface-800"}`}>
            {searchQuery || activeCategory !== "all"
              ? "No posts found"
              : "No community posts yet"
            }
          </h3>
          <p className={`text-sm ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
            {searchQuery || activeCategory !== "all"
              ? "Try adjusting your search or filters"
              : "Be the first to share a trip experience!"
            }
          </p>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          group={null}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
