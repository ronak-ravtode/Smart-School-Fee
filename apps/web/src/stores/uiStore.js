import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeModule: 'dashboard',
  toastQueue: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveModule: (module) => set({ activeModule: module }),
  addToast: (message, type = 'success') =>
    set((s) => ({
      toastQueue: [...s.toastQueue, { id: Date.now(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),
}));
