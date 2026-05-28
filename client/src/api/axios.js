import axios from "axios";

/**
 * Axios Instance
 * --------------
 * Pre-configured Axios instance for making API calls to the backend.
 *
 * In development, Vite's proxy handles forwarding /api requests
 * to http://localhost:5000. In production, you'd set the baseURL
 * to your actual backend domain.
 */
// const API = axios.create({
//   baseURL: "/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// ========================================
// AXIOS INTERCEPTORS
// ========================================

/**
 * Request Interceptor:
 * Automatically attaches the JWT token from localStorage
 * to every outgoing request as an Authorization header.
 */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("splitease-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * Catches 401 Unauthorized responses (expired/invalid token),
 * clears the stored token, and redirects to login.
 */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("splitease-token");
      // Only redirect if not already on login/signup page
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/signup") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ========================================
// AUTH API CALLS
// ========================================

/** Register a new user */
export const signupUser = (data) => API.post("/auth/signup", data);

/** Login and get token */
export const loginUser = (data) => API.post("/auth/login", data);

/** Get current authenticated user */
export const getMe = () => API.get("/auth/me");

/** Update user profile */
export const updateProfile = (data) => API.put("/auth/profile", data);

// ========================================
// GROUP API CALLS
// ========================================

/** Get dashboard statistics */
export const fetchDashboardStats = () => API.get("/groups/dashboard/stats");

/** Get all groups */
export const fetchGroups = () => API.get("/groups");

/** Get a single group by ID */
export const fetchGroupById = (id) => API.get(`/groups/${id}`);

/** Create a new group */
export const createGroup = (data) => API.post("/groups", data);

/** Update a group */
export const updateGroup = (id, data) => API.put(`/groups/${id}`, data);

/** Delete a group */
export const deleteGroup = (id) => API.delete(`/groups/${id}`);

/** Get settlement summary for a group */
export const fetchSettlements = (groupId) =>
  API.get(`/groups/${groupId}/settlements`);

/** Leave a group */
export const leaveGroup = (id) => API.put(`/groups/${id}/leave`);

/** Remove a member from a group */
export const removeMemberFromGroup = (groupId, userId) =>
  API.delete(`/groups/${groupId}/members/${userId}`);

// ========================================
// EXPENSE API CALLS
// ========================================

/** Get all expenses for a group (supports query params for search/filter) */
export const fetchExpensesByGroup = (groupId, params = {}) =>
  API.get(`/expenses/group/${groupId}`, { params });

/** Create a new expense */
export const createExpense = (data) => API.post("/expenses", data);

/** Update an expense */
export const updateExpense = (id, data) => API.put(`/expenses/${id}`, data);

/** Delete an expense */
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);

// ========================================
// INVITATION API CALLS
// ========================================

/** Send an invitation to a user by username */
export const sendInvitation = (data) => API.post("/invitations", data);

/** Get all pending invitations for current user */
export const fetchPendingInvitations = () => API.get("/invitations/pending");

/** Get count of pending invitations (for notification badge) */
export const fetchPendingCount = () => API.get("/invitations/pending/count");

/** Accept a pending invitation */
export const acceptInvitation = (id) => API.put(`/invitations/${id}/accept`);

/** Decline a pending invitation */
export const declineInvitation = (id) => API.put(`/invitations/${id}/decline`);

// ========================================
// COMMUNITY API CALLS
// ========================================

/** Get paginated community feed */
export const fetchCommunityPosts = (params = {}) =>
  API.get("/community", { params });

/** Get single community post */
export const fetchCommunityPost = (id) => API.get(`/community/${id}`);

/** Create a community post (multipart form data for photos) */
export const createCommunityPost = (formData) =>
  API.post("/community", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/** Toggle helpful vote on a post */
export const toggleHelpful = (id) => API.put(`/community/${id}/helpful`);

/** Toggle wishlist on a post */
export const toggleWishlist = (id) => API.put(`/community/${id}/wishlist`);

/** Get user's wishlisted posts */
export const fetchMyWishlist = () => API.get("/community/wishlist");

/** Delete own community post */
export const deleteCommunityPost = (id) => API.delete(`/community/${id}`);

export default API;
