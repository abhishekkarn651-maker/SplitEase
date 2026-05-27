import { createContext, useContext, useReducer, useCallback } from "react";
import toast from "react-hot-toast";
import * as api from "../api/axios";

/**
 * ========================================
 * APP CONTEXT — Global State Management
 * ========================================
 *
 * Manages: groups, expenses, dashboard stats, dark mode,
 * loading states, and the currently selected group.
 *
 * Uses useReducer for predictable state updates.
 */

// ── Initial State ──────────────────────────
const initialState = {
  groups: [],
  currentGroup: null,
  expenses: [],
  settlements: null,
  dashboardStats: null,
  pendingInvitations: [],
  pendingCount: 0,
  loading: false,
  darkMode: localStorage.getItem("splitease-dark") === "true",
};

// ── Action Types ───────────────────────────
const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_GROUPS: "SET_GROUPS",
  SET_CURRENT_GROUP: "SET_CURRENT_GROUP",
  ADD_GROUP: "ADD_GROUP",
  UPDATE_GROUP: "UPDATE_GROUP",
  REMOVE_GROUP: "REMOVE_GROUP",
  SET_EXPENSES: "SET_EXPENSES",
  ADD_EXPENSE: "ADD_EXPENSE",
  UPDATE_EXPENSE: "UPDATE_EXPENSE",
  REMOVE_EXPENSE: "REMOVE_EXPENSE",
  SET_SETTLEMENTS: "SET_SETTLEMENTS",
  SET_DASHBOARD_STATS: "SET_DASHBOARD_STATS",
  SET_PENDING_INVITATIONS: "SET_PENDING_INVITATIONS",
  SET_PENDING_COUNT: "SET_PENDING_COUNT",
  TOGGLE_DARK_MODE: "TOGGLE_DARK_MODE",
};

// ── Reducer ────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_GROUPS:
      return { ...state, groups: action.payload };

    case ACTIONS.SET_CURRENT_GROUP:
      return { ...state, currentGroup: action.payload };

    case ACTIONS.ADD_GROUP:
      return { ...state, groups: [action.payload, ...state.groups] };

    case ACTIONS.UPDATE_GROUP:
      return {
        ...state,
        groups: state.groups.map((g) =>
          g._id === action.payload._id ? action.payload : g
        ),
        currentGroup:
          state.currentGroup?._id === action.payload._id
            ? action.payload
            : state.currentGroup,
      };

    case ACTIONS.REMOVE_GROUP:
      return {
        ...state,
        groups: state.groups.filter((g) => g._id !== action.payload),
        currentGroup:
          state.currentGroup?._id === action.payload
            ? null
            : state.currentGroup,
      };

    case ACTIONS.SET_EXPENSES:
      return { ...state, expenses: action.payload };

    case ACTIONS.ADD_EXPENSE:
      return { ...state, expenses: [action.payload, ...state.expenses] };

    case ACTIONS.UPDATE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e._id === action.payload._id ? action.payload : e
        ),
      };

    case ACTIONS.REMOVE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.filter((e) => e._id !== action.payload),
      };

    case ACTIONS.SET_SETTLEMENTS:
      return { ...state, settlements: action.payload };

    case ACTIONS.SET_DASHBOARD_STATS:
      return { ...state, dashboardStats: action.payload };

    case ACTIONS.SET_PENDING_INVITATIONS:
      return { ...state, pendingInvitations: action.payload };

    case ACTIONS.SET_PENDING_COUNT:
      return { ...state, pendingCount: action.payload };

    case ACTIONS.TOGGLE_DARK_MODE:
      return { ...state, darkMode: !state.darkMode };

    default:
      return state;
  }
}

// ── Create Context ─────────────────────────
const AppContext = createContext();

// ── Provider Component ─────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ── Dark Mode Toggle ──
  const toggleDarkMode = useCallback(() => {
    dispatch({ type: ACTIONS.TOGGLE_DARK_MODE });
    const newMode = !state.darkMode;
    localStorage.setItem("splitease-dark", newMode);
    document.body.classList.toggle("dark", newMode);
  }, [state.darkMode]);

  // ── Group Actions ──

  const loadGroups = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const { data } = await api.fetchGroups();
      dispatch({ type: ACTIONS.SET_GROUPS, payload: data.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load groups");
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  const loadGroupById = useCallback(async (id) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const { data } = await api.fetchGroupById(id);
      dispatch({ type: ACTIONS.SET_CURRENT_GROUP, payload: data.data });
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load group");
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  const addGroup = useCallback(async (groupData) => {
    try {
      const { data } = await api.createGroup(groupData);
      dispatch({ type: ACTIONS.ADD_GROUP, payload: data.data });
      toast.success("Group created!");
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
      throw err;
    }
  }, []);

  const editGroup = useCallback(async (id, groupData) => {
    try {
      const { data } = await api.updateGroup(id, groupData);
      dispatch({ type: ACTIONS.UPDATE_GROUP, payload: data.data });
      toast.success("Group updated!");
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update group");
      throw err;
    }
  }, []);

  const removeGroup = useCallback(async (id) => {
    try {
      await api.deleteGroup(id);
      dispatch({ type: ACTIONS.REMOVE_GROUP, payload: id });
      toast.success("Group deleted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete group");
      throw err;
    }
  }, []);

  // ── Expense Actions ──

  const loadExpenses = useCallback(async (groupId, params = {}) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const { data } = await api.fetchExpensesByGroup(groupId, params);
      dispatch({ type: ACTIONS.SET_EXPENSES, payload: data.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load expenses");
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  const addExpense = useCallback(async (expenseData) => {
    try {
      const { data } = await api.createExpense(expenseData);
      dispatch({ type: ACTIONS.ADD_EXPENSE, payload: data.data });
      toast.success("Expense added!");
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add expense");
      throw err;
    }
  }, []);

  const editExpense = useCallback(async (id, expenseData) => {
    try {
      const { data } = await api.updateExpense(id, expenseData);
      dispatch({ type: ACTIONS.UPDATE_EXPENSE, payload: data.data });
      toast.success("Expense updated!");
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update expense");
      throw err;
    }
  }, []);

  const removeExpense = useCallback(async (id) => {
    try {
      await api.deleteExpense(id);
      dispatch({ type: ACTIONS.REMOVE_EXPENSE, payload: id });
      toast.success("Expense deleted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete expense");
      throw err;
    }
  }, []);

  // ── Settlements ──

  const loadSettlements = useCallback(async (groupId) => {
    try {
      const { data } = await api.fetchSettlements(groupId);
      dispatch({ type: ACTIONS.SET_SETTLEMENTS, payload: data.data });
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load settlements");
    }
  }, []);

  // ── Dashboard Stats ──

  const loadDashboardStats = useCallback(async () => {
    try {
      const { data } = await api.fetchDashboardStats();
      dispatch({ type: ACTIONS.SET_DASHBOARD_STATS, payload: data.data });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load dashboard stats"
      );
    }
  }, []);

  // ── Invitation Actions ──

  const loadPendingInvitations = useCallback(async () => {
    try {
      const { data } = await api.fetchPendingInvitations();
      dispatch({ type: ACTIONS.SET_PENDING_INVITATIONS, payload: data.data });
      dispatch({ type: ACTIONS.SET_PENDING_COUNT, payload: data.count });
    } catch (err) {
      // Silently fail — notification polling shouldn't show errors
    }
  }, []);

  const loadPendingCount = useCallback(async () => {
    try {
      const { data } = await api.fetchPendingCount();
      dispatch({ type: ACTIONS.SET_PENDING_COUNT, payload: data.data.count });
    } catch {
      // Silently fail
    }
  }, []);

  const sendInvite = useCallback(async (groupId, username) => {
    try {
      const { data } = await api.sendInvitation({ groupId, username });
      toast.success(`Invitation sent to @${username}`);
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
      throw err;
    }
  }, []);

  const acceptInvite = useCallback(async (invitationId) => {
    try {
      const { data } = await api.acceptInvitation(invitationId);
      toast.success(`Joined group "${data.data.group.name}"!`);
      // Refresh invitations and groups
      dispatch({ type: ACTIONS.SET_PENDING_COUNT, payload: Math.max(0, state.pendingCount - 1) });
      return data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept invitation");
      throw err;
    }
  }, [state.pendingCount]);

  const declineInvite = useCallback(async (invitationId) => {
    try {
      await api.declineInvitation(invitationId);
      toast.success("Invitation declined");
      dispatch({ type: ACTIONS.SET_PENDING_COUNT, payload: Math.max(0, state.pendingCount - 1) });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline invitation");
      throw err;
    }
  }, [state.pendingCount]);

  // ── Context Value ──
  const value = {
    ...state,
    toggleDarkMode,
    loadGroups,
    loadGroupById,
    addGroup,
    editGroup,
    removeGroup,
    loadExpenses,
    addExpense,
    editExpense,
    removeExpense,
    loadSettlements,
    loadDashboardStats,
    // Invitation actions
    loadPendingInvitations,
    loadPendingCount,
    sendInvite,
    acceptInvite,
    declineInvite,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * useApp() — Custom hook to access the AppContext.
 * Must be used inside <AppProvider>.
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
