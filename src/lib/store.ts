import { create } from "zustand";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  repo: string;
  timestamp: string;
  read: boolean;
}

interface DashboardState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  selectedRepo: string | null;
  setSelectedRepo: (repo: string | null) => void;
  cmdkOpen: boolean;
  setCmdkOpen: (open: boolean) => void;
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "read" | "timestamp">) => void;
  markAllAsRead: () => void;
  mobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  selectedRepo: null,
  setSelectedRepo: (repo) => set({ selectedRepo: repo }),
  cmdkOpen: false,
  setCmdkOpen: (open) => set({ cmdkOpen: open }),
  notifications: [],
  unreadCount: 0,
  addNotification: (n) => set((state) => {
    const newNotification: Notification = {
      ...n,
      id: Math.random().toString(36).substring(7),
      read: false,
      timestamp: "Just now",
    };
    const updated = [newNotification, ...state.notifications];
    return {
      notifications: updated,
      unreadCount: updated.filter((x) => !x.read).length,
    };
  }),
  markAllAsRead: () => set((state) => {
    const updated = state.notifications.map((n) => ({ ...n, read: true }));
    return {
      notifications: updated,
      unreadCount: 0,
    };
  }),
  mobileSidebarOpen: false,
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  selectedNodeId: null,
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
}));

export const useActiveRepo = () => {
  const selectedRepo = useDashboardStore((state) => state.selectedRepo);
  const setSelectedRepo = useDashboardStore((state) => state.setSelectedRepo);
  return [selectedRepo, setSelectedRepo] as const;
};
