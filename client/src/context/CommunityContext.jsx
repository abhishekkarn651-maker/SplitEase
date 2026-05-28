import { createContext, useContext, useReducer, useCallback } from "react";
import toast from "react-hot-toast";
import * as api from "../api/axios";

/**
 * ========================================
 * COMMUNITY CONTEXT — Community State
 * ========================================
 *
 * Manages: community posts, current post, wishlist,
 * pagination, and loading states.
 *
 * Kept separate from AppContext to enforce strict
 * separation between private group data and public
 * community data.
 *
 * Uses useReducer for predictable state updates.
 */

// ── Initial State ──────────────────────────
const initialState = {
  posts: [],
  currentPost: null,
  wishlist: [],
  loading: false,
  page: 1,
  hasMore: true,
  total: 0,
};

// ── Action Types ───────────────────────────
const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_POSTS: "SET_POSTS",
  APPEND_POSTS: "APPEND_POSTS",
  SET_CURRENT_POST: "SET_CURRENT_POST",
  SET_WISHLIST: "SET_WISHLIST",
  ADD_POST: "ADD_POST",
  REMOVE_POST: "REMOVE_POST",
  UPDATE_POST_VOTE: "UPDATE_POST_VOTE",
  UPDATE_POST: "UPDATE_POST",
  SET_PAGE: "SET_PAGE",
  SET_HAS_MORE: "SET_HAS_MORE",
  SET_TOTAL: "SET_TOTAL",
  RESET_FEED: "RESET_FEED",
};

// ── Reducer ────────────────────────────────
function communityReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_POSTS:
      return { ...state, posts: action.payload };

    case ACTIONS.APPEND_POSTS:
      return { ...state, posts: [...state.posts, ...action.payload] };

    case ACTIONS.SET_CURRENT_POST:
      return { ...state, currentPost: action.payload };

    case ACTIONS.SET_WISHLIST:
      return { ...state, wishlist: action.payload };

    case ACTIONS.ADD_POST:
      return { ...state, posts: [action.payload, ...state.posts] };

    case ACTIONS.REMOVE_POST:
      return {
        ...state,
        posts: state.posts.filter((p) => p._id !== action.payload),
        currentPost:
          state.currentPost?._id === action.payload
            ? null
            : state.currentPost,
      };

    case ACTIONS.UPDATE_POST_VOTE: {
      const { postId, field, value, count, countField } = action.payload;
      const updatePost = (post) => {
        if (post._id !== postId) return post;
        return { ...post, [field]: value, [countField]: count };
      };
      return {
        ...state,
        posts: state.posts.map(updatePost),
        currentPost: state.currentPost?._id === postId
          ? updatePost(state.currentPost)
          : state.currentPost,
      };
    }

    case ACTIONS.UPDATE_POST: {
      const updatedPost = action.payload;
      return {
        ...state,
        posts: state.posts.map((post) =>
          post._id === updatedPost._id ? updatedPost : post
        ),
        currentPost:
          state.currentPost?._id === updatedPost._id
            ? updatedPost
            : state.currentPost,
      };
    }

    case ACTIONS.SET_PAGE:
      return { ...state, page: action.payload };

    case ACTIONS.SET_HAS_MORE:
      return { ...state, hasMore: action.payload };

    case ACTIONS.SET_TOTAL:
      return { ...state, total: action.payload };

    case ACTIONS.RESET_FEED:
      return { ...state, posts: [], page: 1, hasMore: true, total: 0 };

    default:
      return state;
  }
}

// ── Create Context ─────────────────────────
const CommunityContext = createContext();

// ── Provider Component ─────────────────────
export function CommunityProvider({ children }) {
  const [state, dispatch] = useReducer(communityReducer, initialState);

  // ── Load community feed (paginated) ──
  const loadPosts = useCallback(async (params = {}, append = false) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const { data } = await api.fetchCommunityPosts(params);
      if (append) {
        dispatch({ type: ACTIONS.APPEND_POSTS, payload: data.data });
      } else {
        dispatch({ type: ACTIONS.SET_POSTS, payload: data.data });
      }
      dispatch({ type: ACTIONS.SET_HAS_MORE, payload: data.pagination.hasMore });
      dispatch({ type: ACTIONS.SET_TOTAL, payload: data.pagination.total });
      dispatch({ type: ACTIONS.SET_PAGE, payload: data.pagination.page });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load community posts");
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // ── Load single post ──
  const loadPost = useCallback(async (id) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const { data } = await api.fetchCommunityPost(id);
      dispatch({ type: ACTIONS.SET_CURRENT_POST, payload: data.data });
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load post");
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // ── Publish a new community post ──
  const publishPost = useCallback(async (formData) => {
    try {
      const { data } = await api.createCommunityPost(formData);
      dispatch({ type: ACTIONS.ADD_POST, payload: data.data });
      toast.success("Post published to community!");
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to publish post";
      toast.error(msg);
      throw err;
    }
  }, []);

  // ── Edit a community post ──
  const editPost = useCallback(async (id, formData) => {
    try {
      const { data } = await api.updateCommunityPost(id, formData);
      dispatch({ type: ACTIONS.UPDATE_POST, payload: data.data });
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update post";
      toast.error(msg);
      throw err;
    }
  }, []);

  // ── Toggle helpful vote ──
  const voteHelpful = useCallback(async (postId) => {
    try {
      const { data } = await api.toggleHelpful(postId);
      dispatch({
        type: ACTIONS.UPDATE_POST_VOTE,
        payload: {
          postId,
          field: "isHelpful",
          value: data.data.isHelpful,
          countField: "helpfulCount",
          count: data.data.helpfulCount,
        },
      });
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update vote");
    }
  }, []);

  // ── Toggle wishlist ──
  const saveToWishlist = useCallback(async (postId) => {
    try {
      const { data } = await api.toggleWishlist(postId);
      dispatch({
        type: ACTIONS.UPDATE_POST_VOTE,
        payload: {
          postId,
          field: "isWishlisted",
          value: data.data.isWishlisted,
          countField: "wishlistCount",
          count: data.data.wishlistCount,
        },
      });
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update wishlist");
    }
  }, []);

  // ── Load user's wishlist ──
  const loadWishlist = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const { data } = await api.fetchMyWishlist();
      dispatch({ type: ACTIONS.SET_WISHLIST, payload: data.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load wishlist");
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // ── Delete own post ──
  const removePost = useCallback(async (postId) => {
    try {
      await api.deleteCommunityPost(postId);
      dispatch({ type: ACTIONS.REMOVE_POST, payload: postId });
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete post");
      throw err;
    }
  }, []);

  // ── Reset feed (used when changing filters) ──
  const resetFeed = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_FEED });
  }, []);

  // ── Context Value ──
  const value = {
    ...state,
    loadPosts,
    loadPost,
    publishPost,
    editPost,
    voteHelpful,
    saveToWishlist,
    loadWishlist,
    removePost,
    resetFeed,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

/**
 * useCommunity() — Custom hook to access the CommunityContext.
 * Must be used inside <CommunityProvider>.
 */
export function useCommunity() {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error("useCommunity must be used within a CommunityProvider");
  }
  return context;
}
