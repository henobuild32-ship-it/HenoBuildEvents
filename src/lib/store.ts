import { create } from "zustand"

// Types
export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  photo?: string
  role: string
  avatar?: string
  createdAt: string
}

export interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  coverImage?: string
  organizerId: string
  type?: string
  status: "draft" | "published" | "cancelled" | "completed"
  attendeeCount: number
  maxAttendees?: number
  price: number
  currency: string
  category: string
  createdAt: string
  updatedAt: string
}

export type ViewMode = "landing" | "dashboard"
export type DashboardSection = "accueil" | "evenements" | "invites" | "tables" | "invitations" | "galerie" | "messages" | "parametres" | "creer-evenement"

export interface UIState {
  sidebarOpen: boolean
  activeSection: DashboardSection
  mobileMenuOpen: boolean
  isLoading: boolean
  activeModal: string | null
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

// Store Interface
interface AppState {
  // User state
  user: User | null
  setUser: (user: User | null) => void

  // Event state
  currentEvent: Event | null
  setCurrentEvent: (event: Event | null) => void
  currentEventId: string | null
  setCurrentEventId: (id: string | null) => void
  events: Event[]
  setEvents: (events: Event[]) => void
  addEvent: (event: Event) => void
  removeEvent: (id: string) => void

  // View state
  currentView: ViewMode
  setCurrentView: (view: ViewMode) => void

  // UI state
  ui: UIState
  setSidebarOpen: (open: boolean) => void
  setActiveSection: (section: DashboardSection) => void
  setMobileMenuOpen: (open: boolean) => void
  setIsLoading: (loading: boolean) => void
  setActiveModal: (modal: string | null) => void
  toggleSidebar: () => void

  // Auth state
  auth: AuthState
  setAuth: (auth: AuthState) => void
  login: (user: User, token: string) => void
  logout: () => void
  setToken: (token: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),

  // Event state
  currentEvent: null,
  setCurrentEvent: (currentEvent) => set({ currentEvent }),
  currentEventId: null,
  setCurrentEventId: (currentEventId) => set({ currentEventId }),
  events: [],
  setEvents: (events) => set({ events }),
  addEvent: (event) =>
    set((state) => ({ events: [...state.events, event] })),
  removeEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      currentEvent:
        state.currentEvent?.id === id ? null : state.currentEvent,
    })),

  // View state
  currentView: "landing",
  setCurrentView: (currentView) => set({ currentView }),

  // UI state
  ui: {
    sidebarOpen: false,
    activeSection: "accueil",
    mobileMenuOpen: false,
    isLoading: false,
    activeModal: null,
  },
  setSidebarOpen: (open) =>
    set((state) => ({ ui: { ...state.ui, sidebarOpen: open } })),
  setActiveSection: (section) =>
    set((state) => ({ ui: { ...state.ui, activeSection: section } })),
  setMobileMenuOpen: (open) =>
    set((state) => ({ ui: { ...state.ui, mobileMenuOpen: open } })),
  setIsLoading: (loading) =>
    set((state) => ({ ui: { ...state.ui, isLoading: loading } })),
  setActiveModal: (modal) =>
    set((state) => ({ ui: { ...state.ui, activeModal: modal } })),
  toggleSidebar: () =>
    set((state) => ({ ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen } })),

  // Auth state
  auth: {
    isAuthenticated: false,
    user: null,
    token: null,
  },
  setAuth: (auth) => set({ auth }),
  login: (user, token) =>
    set({
      user,
      currentView: "dashboard",
      auth: {
        isAuthenticated: true,
        user,
        token,
      },
    }),
  logout: () =>
    set({
      user: null,
      currentView: "landing",
      currentEvent: null,
      currentEventId: null,
      events: [],
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
      },
    }),
  setToken: (token) =>
    set((state) => ({ auth: { ...state.auth, token } })),
}))
