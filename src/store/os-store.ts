import { create } from 'zustand';

export interface AppWindow {
  id: string;
  appId: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  props?: any;
}

interface OSState {
  windows: AppWindow[];
  activeWindowId: string | null;
  highestZIndex: number;
  openWindow: (appId: string, title: string, props?: any) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  closeAllWindows: () => void;
}

export const useOSStore = create<OSState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  highestZIndex: 10,
  openWindow: (appId, title, props) => {
    const existing = get().windows.find((w) => w.appId === appId);
    if (existing) {
      get().focusWindow(existing.id);
      if (existing.isMinimized) get().restoreWindow(existing.id);
      return;
    }

    const id = `${appId}-${Date.now()}`;
    const newZIndex = get().highestZIndex + 1;
    set((state) => ({
      windows: [
        ...state.windows,
        { id, appId, title, isMinimized: false, isMaximized: false, zIndex: newZIndex, props },
      ],
      activeWindowId: id,
      highestZIndex: newZIndex,
    }));
  },
  closeWindow: (id) => {
    set((state) => {
      const newWindows = state.windows.filter((w) => w.id !== id);
      const newActive = newWindows.length > 0 
        ? [...newWindows].sort((a, b) => b.zIndex - a.zIndex)[0].id 
        : null;
      return { windows: newWindows, activeWindowId: newActive };
    });
  },
  minimizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
    }));
  },
  maximizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMaximized: true } : w)),
    }));
  },
  restoreWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: false, isMinimized: false } : w
      ),
    }));
    get().focusWindow(id);
  },
  focusWindow: (id) => {
    if (get().activeWindowId === id) return;
    const newZIndex = get().highestZIndex + 1;
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, zIndex: newZIndex } : w)),
      activeWindowId: id,
      highestZIndex: newZIndex,
    }));
  },
  closeAllWindows: () => {
    set({ windows: [], activeWindowId: null, highestZIndex: 10 });
  }
}));
