import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import * as api from "../../api/axios";
import LoadingSpinner from "../common/LoadingSpinner";
import { HiOutlineTrash, HiOutlineChatBubbleLeftRight, HiPaperAirplane } from "react-icons/hi2";

/**
 * CommentSection — Threaded comments for a community post.
 * 
 * Handles:
 *  - Fetching comments for the current post
 *  - Adding new comments (with validation)
 *  - Deleting owned comments
 *  - Supporting both light and dark modes
 */
export default function CommentSection({ postId, postAuthorId }) {
  const { darkMode } = useApp();
  const { user } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Fetch comments
  const loadComments = useCallback(async () => {
    try {
      const { data } = await api.fetchPostComments(postId);
      setComments(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Relative time helper
  const timeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
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

  // Submit comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await api.createComment(postId, { text: commentText });
      setComments((prev) => [...prev, data.data]);
      setCommentText("");
      toast.success("Comment added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reply
  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await api.createComment(postId, {
        text: replyText,
        parentComment: parentId,
      });
      setComments((prev) => [...prev, data.data]);
      setReplyText("");
      setReplyToId(null);
      toast.success("Reply added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add reply");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;

    try {
      await api.deleteComment(commentId);
      // Remove the deleted comment and all of its replies if it was a parent
      setComments((prev) => prev.filter((c) => c._id !== commentId && c.parentComment !== commentId));
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  // Filter out parent comments and replies
  const parentComments = comments.filter((c) => !c.parentComment);
  const getReplies = (parentId) => comments.filter((c) => c.parentComment === parentId);

  return (
    <div
      id="comments-section"
      className={`rounded-2xl p-5 sm:p-6 mt-6 transition-colors ${
        darkMode
          ? "bg-surface-800 border border-surface-700"
          : "bg-white border border-surface-200 shadow-card"
      }`}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-surface-200 dark:border-surface-700">
        <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-primary-500" />
        <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-surface-800"}`}>
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex items-start gap-3">
          {/* Active User Avatar */}
          <div
            className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
              darkMode
                ? "bg-primary-900/40 text-primary-400 border border-primary-800/30"
                : "bg-primary-100 text-primary-700 border border-primary-200"
            }`}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>

          {/* Text Area Input */}
          <div className="flex-1 relative">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add to the conversation..."
              rows={2}
              className={`w-full pr-12 pl-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none ${
                darkMode
                  ? "bg-surface-700 border-surface-600 text-white placeholder-surface-400 focus:border-primary-500"
                  : "bg-surface-50 border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              }`}
              maxLength={1000}
            />
            {/* Submit Button inside input for a compact modern look */}
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className={`absolute right-3 bottom-3 p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm`}
              title="Post Comment"
            >
              <HiPaperAirplane className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="py-6">
          <LoadingSpinner message="Loading comments..." />
        </div>
      ) : parentComments.length > 0 ? (
        <div className="space-y-6">
          {parentComments.map((comment) => {
            const isCommentOwner = comment.author?._id === user?._id;
            const isCommentAuthorOfPost = comment.author?._id === postAuthorId;
            const replies = getReplies(comment._id);

            return (
              <div key={comment._id} className="space-y-3">
                {/* Parent Comment Card */}
                <div
                  className={`flex gap-3 p-4 rounded-2xl transition-all border ${
                    darkMode
                      ? "bg-surface-700/30 hover:bg-surface-700/50 border-surface-700/60"
                      : "bg-surface-50/50 hover:bg-surface-50 border-surface-100"
                  }`}
                >
                  {/* Commenter Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                      darkMode
                        ? "bg-surface-600 text-surface-200"
                        : "bg-surface-200 text-surface-600"
                    }`}
                  >
                    {comment.author?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    {/* Name and time metadata */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-semibold ${darkMode ? "text-surface-100" : "text-surface-800"}`}>
                          {comment.author?.name || "Deleted User"}
                        </span>
                        {isCommentAuthorOfPost && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-500 text-white animate-pulse`}>
                            Author
                          </span>
                        )}
                        <span className={`text-xs ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                          @{comment.author?.username || "deleted"}
                        </span>
                      </div>
                      <span className={`text-[10px] ${darkMode ? "text-surface-500" : "text-surface-400"}`}>
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>

                    {/* Comment Text */}
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
                      {comment.text}
                    </p>

                    {/* Actions Row */}
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => {
                          setReplyToId(replyToId === comment._id ? null : comment._id);
                          setReplyText("");
                        }}
                        className={`text-xs font-semibold cursor-pointer transition-colors ${
                          replyToId === comment._id
                            ? "text-primary-500"
                            : darkMode
                            ? "text-surface-400 hover:text-white"
                            : "text-surface-500 hover:text-surface-800"
                        }`}
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Delete option for comment author */}
                  {isCommentOwner && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className={`p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer self-start`}
                      title="Delete Comment"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Replies container */}
                <div className="ml-8 sm:ml-12 pl-4 border-l-2 border-surface-200 dark:border-surface-700/60 space-y-3">
                  {/* Nested Replies list */}
                  {replies.map((reply) => {
                    const isReplyOwner = reply.author?._id === user?._id;
                    const isReplyAuthorOfPost = reply.author?._id === postAuthorId;

                    return (
                      <div
                        key={reply._id}
                        className={`flex gap-3 p-3 rounded-xl transition-all border ${
                          darkMode
                            ? "bg-surface-700/20 hover:bg-surface-700/40 border-surface-700/40"
                            : "bg-surface-100/40 hover:bg-surface-100/70 border-surface-200/50"
                        }`}
                      >
                        {/* Replyer Avatar */}
                        <div
                          className={`w-7.5 h-7.5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                            darkMode ? "bg-surface-600 text-surface-200" : "bg-surface-200 text-surface-600"
                          }`}
                        >
                          {reply.author?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>

                        {/* Reply Content */}
                        <div className="flex-1 min-w-0">
                          {/* Name and time */}
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-semibold ${darkMode ? "text-surface-100" : "text-surface-800"}`}>
                                {reply.author?.name || "Deleted User"}
                              </span>
                              {isReplyAuthorOfPost && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary-500 text-white animate-pulse`}>
                                  Author
                                </span>
                              )}
                              <span className={`text-[10px] ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
                                @{reply.author?.username || "deleted"}
                              </span>
                            </div>
                            <span className={`text-[9px] ${darkMode ? "text-surface-500" : "text-surface-400"}`}>
                              {timeAgo(reply.createdAt)}
                            </span>
                          </div>

                          {/* Text */}
                          <p className={`text-xs leading-relaxed whitespace-pre-wrap break-words ${darkMode ? "text-surface-300" : "text-surface-600"}`}>
                            {reply.text}
                          </p>
                        </div>

                        {/* Delete option for reply author */}
                        {isReplyOwner && (
                          <button
                            onClick={() => handleDeleteComment(reply._id)}
                            className={`p-1 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer self-start`}
                            title="Delete Reply"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Inline Reply Form */}
                  {replyToId === comment._id && (
                    <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="mt-3">
                      <div className="flex items-start gap-2">
                        {/* Active User Avatar */}
                        <div
                          className={`w-7.5 h-7.5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                            darkMode
                              ? "bg-primary-900/40 text-primary-400 border border-primary-800/30"
                              : "bg-primary-100 text-primary-700 border border-primary-200"
                          }`}
                        >
                          {user?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to @${comment.author?.username || "user"}...`}
                            className={`w-full pr-10 pl-3 py-1.5 rounded-xl border text-xs outline-none transition-all ${
                              darkMode
                                ? "bg-surface-700 border-surface-600 text-white placeholder-surface-400 focus:border-primary-500"
                                : "bg-surface-50 border-surface-200 text-surface-800 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                            }`}
                            maxLength={1000}
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={!replyText.trim() || submitting}
                            className="absolute right-2 top-1.5 p-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <HiPaperAirplane className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-8">
          <HiOutlineChatBubbleLeftRight className={`w-12 h-12 mx-auto mb-3 ${darkMode ? "text-surface-600" : "text-surface-300"}`} />
          <p className={`text-sm ${darkMode ? "text-surface-400" : "text-surface-500"}`}>
            No comments yet. Share your thoughts above!
          </p>
        </div>
      )}
    </div>
  );
}
