import { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useCommunity } from "../../context/CommunityContext";
import {
  HiOutlineXMark,
  HiOutlineGlobeAlt,
  HiOutlinePhoto,
  HiOutlineStar,
  HiStar,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
} from "react-icons/hi2";

/**
 * CreatePostModal — Modal for creating a community post.
 *
 * Can be opened from:
 *  1. Group Details page → group prop is provided (skip selection)
 *  2. Community Feed page → group prop is null (show group selector)
 *
 * Privacy: Only explicitly entered text and selected photos
 * are published. No group data (expenses, members) is shared.
 */
export default function CreatePostModal({ group: initialGroup, onClose }) {
  const { darkMode, groups, loadGroups } = useApp();
  const { publishPost } = useCommunity();

  const [selectedGroup, setSelectedGroup] = useState(initialGroup || null);
  const [formData, setFormData] = useState({
    destination: "",
    city: "",
    state: "",
    country: "India",
    title: "",
    review: "",
    category: "travel",
    rating: 0,
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Load user's groups if not already loaded (for group selector)
  useEffect(() => {
    if (!initialGroup && groups.length === 0) {
      loadGroups();
    }
  }, [initialGroup, groups.length, loadGroups]);

  const categories = [
    { value: "travel", label: "🧳 Travel" },
    { value: "food", label: "🍜 Food" },
    { value: "adventure", label: "🏔️ Adventure" },
    { value: "culture", label: "🏛️ Culture" },
    { value: "nature", label: "🌿 Nature" },
    { value: "other", label: "📝 Other" },
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRating = (star) => {
    setFormData((prev) => ({ ...prev, rating: star }));
  };

  const handleGroupSelect = (e) => {
    const groupId = e.target.value;
    const found = groups.find((g) => g._id === groupId);
    setSelectedGroup(found || null);
  };

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files).slice(0, 5 - selectedFiles.length);

    // Validate file types
    const validFiles = fileArray.filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );

    setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 5));

    // Generate previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedGroup || !formData.destination || !formData.city || !formData.title || !formData.review || !formData.rating) {
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("groupId", selectedGroup._id);
      data.append("destination", formData.destination);
      data.append("city", formData.city);
      data.append("state", formData.state);
      data.append("country", formData.country);
      data.append("title", formData.title);
      data.append("review", formData.review);
      data.append("category", formData.category);
      data.append("rating", formData.rating);

      selectedFiles.forEach((file) => {
        data.append("photos", file);
      });

      await publishPost(data);
      onClose();
    } catch {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const isValid =
    selectedGroup &&
    formData.destination.trim() &&
    formData.city.trim() &&
    formData.title.trim() &&
    formData.review.trim() &&
    formData.rating > 0;

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    darkMode
      ? "bg-surface-700 border-surface-600 text-white placeholder-surface-400 focus:border-primary-500"
      : "bg-surface-50 border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 px-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border shadow-modal animate-scale-in ${
          darkMode
            ? "bg-surface-800 border-surface-700"
            : "bg-white border-surface-200"
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md ${
          darkMode
            ? "bg-surface-800/95 border-surface-700"
            : "bg-white/95 border-surface-200"
        }`}>
          <div className="flex items-center gap-2">
            <HiOutlineGlobeAlt className="w-5 h-5 text-primary-500" />
            <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-surface-800"}`}>
              Share to Community
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              darkMode
                ? "hover:bg-surface-700 text-surface-400"
                : "hover:bg-surface-100 text-surface-500"
            }`}
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Privacy Notice */}
          <div className={`flex items-start gap-3 p-3.5 rounded-xl ${
            darkMode ? "bg-primary-900/20 border border-primary-800/30" : "bg-primary-50 border border-primary-100"
          }`}>
            <HiOutlineShieldCheck className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
            <p className={`text-xs leading-relaxed ${darkMode ? "text-primary-300" : "text-primary-700"}`}>
              Only the text and photos you share here will be visible publicly.
              Your group's expenses, members, and private data will <strong>NOT</strong> be shared.
            </p>
          </div>

          {/* Group Selection — either read-only (from GroupDetails) or dropdown (from CommunityFeed) */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
              Sharing from Group <span className="text-red-400">*</span>
            </label>
            {initialGroup ? (
              /* Read-only when opened from GroupDetails */
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm ${
                darkMode
                  ? "bg-surface-700/50 border-surface-600 text-surface-300"
                  : "bg-surface-100 border-surface-200 text-surface-600"
              }`}>
                <span className="text-lg">{initialGroup.icon || "👥"}</span>
                <span className="font-medium">{initialGroup.name}</span>
              </div>
            ) : (
              /* Dropdown when opened from CommunityFeed */
              <>
                <div className="relative">
                  <HiOutlineUserGroup className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                    darkMode ? "text-surface-400" : "text-surface-400"
                  }`} />
                  <select
                    value={selectedGroup?._id || ""}
                    onChange={handleGroupSelect}
                    className={`${inputClass} pl-10`}
                  >
                    <option value="">Select a group...</option>
                    {groups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.icon || "👥"} {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                {groups.length === 0 && (
                  <p className={`text-xs mt-1.5 ${darkMode ? "text-surface-500" : "text-surface-400"}`}>
                    You need to be part of a group to share to community.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Title */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
              Post Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., A Spiritual Journey to Mayapur"
              className={inputClass}
              maxLength={200}
            />
          </div>

          {/* Destination */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
              Destination / Place <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g., Mayapur Temple, ISKCON"
              className={inputClass}
              maxLength={200}
            />
          </div>

          {/* Location: City, State, Country */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mayapur"
                className={inputClass}
                maxLength={100}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="West Bengal"
                className={inputClass}
                maxLength={100}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="India"
                className={inputClass}
                maxLength={100}
              />
            </div>
          </div>

          {/* Category & Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
                Category <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={inputClass}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
                Rating <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-1 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRating(star)}
                    className="cursor-pointer transition-transform hover:scale-110"
                  >
                    {star <= formData.rating ? (
                      <HiStar className="w-7 h-7 text-amber-400" />
                    ) : (
                      <HiOutlineStar className="w-7 h-7 text-amber-300/50 hover:text-amber-300" />
                    )}
                  </button>
                ))}
                {formData.rating > 0 && (
                  <span className={`text-xs ml-2 ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                    {formData.rating}/5
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Review */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
              Your Review <span className="text-red-400">*</span>
            </label>
            <textarea
              name="review"
              value={formData.review}
              onChange={handleChange}
              placeholder="Share your experience, tips, and recommendations..."
              rows={5}
              className={`${inputClass} resize-none`}
              maxLength={5000}
            />
            <p className={`text-[10px] mt-1 text-right ${darkMode ? "text-surface-500" : "text-surface-400"}`}>
              {formData.review.length}/5000
            </p>
          </div>

          {/* Photo Upload */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
              Photos (max 5)
            </label>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => selectedFiles.length < 5 && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/20"
                  : darkMode
                  ? "border-surface-600 hover:border-surface-500 bg-surface-700/30"
                  : "border-surface-300 hover:border-primary-400 bg-surface-50"
              } ${selectedFiles.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <HiOutlinePhoto className={`w-8 h-8 mx-auto mb-2 ${darkMode ? "text-surface-500" : "text-surface-400"}`} />
              <p className={`text-sm ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                {selectedFiles.length >= 5
                  ? "Maximum photos reached"
                  : "Drag & drop photos or click to browse"
                }
              </p>
              <p className={`text-[10px] mt-1 ${darkMode ? "text-surface-500" : "text-surface-400"}`}>
                JPEG, PNG, or WebP • Max 5MB each
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            {/* Preview grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <HiOutlineXMark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                darkMode
                  ? "bg-surface-700 text-surface-300 hover:bg-surface-600"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
            >
              <HiOutlineGlobeAlt className="w-4 h-4" />
              {submitting ? "Publishing..." : "Publish to Community"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
