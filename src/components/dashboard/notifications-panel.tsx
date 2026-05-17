"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, CheckCheck, X, Mail, Users, Calendar,
  AlertCircle, Info, Sparkles, Trash2, Clock,
  AlertTriangle, MessageCircle, Ban, PartyPopper
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

// ── Types ────────────────────────────────────────────────────────

interface NotificationEvent {
  id: string
  title: string
}

interface NotificationGuest {
  id: string
  firstName: string
  lastName: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  readAt: string | null
  link: string | null
  createdAt: string
  updatedAt: string
  userId: string
  eventId: string | null
  guestId: string | null
  event: NotificationEvent | null
  guest: NotificationGuest | null
}

interface NotificationCount {
  unreadCount: number
  totalCount: number
}

// ── Notification type config ─────────────────────────────────────

const typeConfig: Record<string, {
  icon: React.ElementType
  color: string
  bgColor: string
  label: string
}> = {
  INVITATION_SENT: {
    icon: Mail,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    label: "Invitation envoyée",
  },
  RSVP_CONFIRMED: {
    icon: CheckCheck,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    label: "RSVP confirmé",
  },
  RSVP_DECLINED: {
    icon: Ban,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "RSVP refusé",
  },
  EVENT_REMINDER: {
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    label: "Rappel événement",
  },
  EVENT_UPDATED: {
    icon: AlertCircle,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    label: "Événement modifié",
  },
  EVENT_CANCELLED: {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Événement annulé",
  },
  GUEST_ARRIVED: {
    icon: PartyPopper,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    label: "Invité arrivé",
  },
  TABLE_ASSIGNED: {
    icon: Sparkles,
    color: "text-gold",
    bgColor: "bg-gold/10",
    label: "Table assignée",
  },
  MESSAGE_RECEIVED: {
    icon: MessageCircle,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    label: "Nouveau message",
  },
  GENERAL: {
    icon: Bell,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    label: "Notification",
  },
}

// ── Time ago helper (French) ─────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now.getTime() - then.getTime()

  if (diffMs < 0) return "À l'instant"

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)

  if (seconds < 60) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days === 1) return "Hier"
  if (days < 7) return `Il y a ${days}j`
  if (weeks < 4) return `Il y a ${weeks} sem.`
  return then.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

// ── Date grouping helper ─────────────────────────────────────────

type DateGroup = "Aujourd'hui" | "Hier" | "Cette semaine" | "Plus ancien"

function getDateGroup(dateStr: string): DateGroup {
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  // Same calendar day
  if (
    then.getDate() === now.getDate() &&
    then.getMonth() === now.getMonth() &&
    then.getFullYear() === now.getFullYear()
  ) {
    return "Aujourd'hui"
  }

  // Yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (
    then.getDate() === yesterday.getDate() &&
    then.getMonth() === yesterday.getMonth() &&
    then.getFullYear() === yesterday.getFullYear()
  ) {
    return "Hier"
  }

  // This week (within 7 days)
  if (diffDays < 7) {
    return "Cette semaine"
  }

  return "Plus ancien"
}

function groupNotificationsByDate(
  notifications: Notification[]
): { label: DateGroup; items: Notification[] }[] {
  const groups: Record<DateGroup, Notification[]> = {
    "Aujourd'hui": [],
    "Hier": [],
    "Cette semaine": [],
    "Plus ancien": [],
  }

  for (const n of notifications) {
    const group = getDateGroup(n.createdAt)
    groups[group].push(n)
  }

  const result: { label: DateGroup; items: Notification[] }[] = []
  const order: DateGroup[] = ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"]

  for (const key of order) {
    if (groups[key].length > 0) {
      result.push({ label: key, items: groups[key] })
    }
  }

  return result
}

// ── Navigation helper ────────────────────────────────────────────

function getNotificationLink(notification: Notification): string | null {
  if (notification.link) return notification.link

  // Derive link from notification type
  switch (notification.type) {
    case "INVITATION_SENT":
    case "RSVP_CONFIRMED":
    case "RSVP_DECLINED":
      return "invitations"
    case "EVENT_REMINDER":
    case "EVENT_UPDATED":
    case "EVENT_CANCELLED":
      return "evenements"
    case "GUEST_ARRIVED":
      return "invites"
    case "TABLE_ASSIGNED":
      return "tables"
    case "MESSAGE_RECEIVED":
      return "messages"
    default:
      return null
  }
}

// ── Main Component ───────────────────────────────────────────────

export function NotificationsPanel() {
  const { auth, setActiveSection } = useStore()
  const userId = auth.user?.id
  const token = auth.token

  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [count, setCount] = useState<NotificationCount>({ unreadCount: 0, totalCount: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ── Fetch notifications ──────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!userId || !token) return

    try {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch(`/api/notifications?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })

      if (!res.ok) return

      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      console.error("Fetch notifications error:", err)
    }
  }, [userId, token])

  // ── Fetch unread count ───────────────────────────────────────

  const fetchCount = useCallback(async () => {
    if (!userId || !token) return

    try {
      const res = await fetch(`/api/notifications/count?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) return

      const data = await res.json()
      setCount({
        unreadCount: data.unreadCount ?? 0,
        totalCount: data.totalCount ?? 0,
      })
    } catch {
      // silent fail — count is non-critical
    }
  }, [userId, token])

  // ── Combined refresh ─────────────────────────────────────────

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchCount()])
  }, [fetchNotifications, fetchCount])

  // ── Mark as read ─────────────────────────────────────────────

  const markAsRead = useCallback(
    async (id: string) => {
      if (!token) return

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setCount((prev) => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }))

      try {
        const res = await fetch(`/api/notifications/${id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          // Revert on failure
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
          )
          setCount((prev) => ({
            ...prev,
            unreadCount: prev.unreadCount + 1,
          }))
        }
      } catch {
        // Revert on error
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
        )
        setCount((prev) => ({
          ...prev,
          unreadCount: prev.unreadCount + 1,
        }))
      }
    },
    [token]
  )

  // ── Mark all as read ─────────────────────────────────────────

  const markAllAsRead = useCallback(async () => {
    if (!userId || !token) return

    // Optimistic update
    const previousNotifications = notifications
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setCount((prev) => ({ ...prev, unreadCount: 0 }))

    try {
      const res = await fetch(`/api/notifications/read-all?userId=${userId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || "Toutes les notifications marquées comme lues")
      } else {
        // Revert
        setNotifications(previousNotifications)
        fetchCount()
      }
    } catch {
      setNotifications(previousNotifications)
      fetchCount()
    }
  }, [userId, token, notifications, fetchCount])

  // ── Delete notification ──────────────────────────────────────

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!token) return

      const target = notifications.find((n) => n.id === id)
      if (!target) return

      // Optimistic
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setCount((prev) => ({
        unreadCount: target.isRead ? prev.unreadCount : Math.max(0, prev.unreadCount - 1),
        totalCount: Math.max(0, prev.totalCount - 1),
      }))
      setDeletingIds((prev) => new Set(prev).add(id))

      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          // Revert
          setNotifications((prev) => {
            const restored = [...prev, target].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            return restored
          })
          fetchCount()
          toast.error("Erreur lors de la suppression")
        } else {
          toast.success("Notification supprimée")
        }
      } catch {
        setNotifications((prev) => {
          const restored = [...prev, target].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          return restored
        })
        fetchCount()
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [token, notifications, fetchCount]
  )

  // ── Handle notification click ────────────────────────────────

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Mark as read
      if (!notification.isRead) {
        markAsRead(notification.id)
      }

      // Navigate if there's a link
      const link = getNotificationLink(notification)
      if (link) {
        setActiveSection(link as "accueil" | "evenements" | "invites" | "tables" | "invitations" | "galerie" | "messages" | "parametres" | "creer-evenement")
        setIsOpen(false)
      }
    },
    [markAsRead, setActiveSection]
  )

  // ── Initial load + auto-refresh every 30s ────────────────────

  useEffect(() => {
    if (!userId || !token) {
      setNotifications([])
      setCount({ unreadCount: 0, totalCount: 0 })
      return
    }

    // Initial fetch
    refresh()

    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      refresh()
    }, 30000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      abortRef.current?.abort()
    }
  }, [userId, token, refresh])

  // ── Fetch count on mount even when panel is closed ───────────

  useEffect(() => {
    if (userId && token) {
      fetchCount()
    }
  }, [userId, token, fetchCount])

  // ── Fetch full list when panel opens ─────────────────────────

  useEffect(() => {
    if (isOpen && userId && token) {
      setIsLoading(true)
      fetchNotifications().finally(() => setIsLoading(false))
    }
  }, [isOpen, userId, token, fetchNotifications])

  // ── Render ───────────────────────────────────────────────────

  const unreadCount = count.unreadCount
  const grouped = groupNotificationsByDate(notifications)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-gold hover:bg-gold/5 transition-all"
          aria-label="Notifications"
        >
          <Bell className={`h-5 w-5 transition-transform ${unreadCount > 0 ? "animate-[swing_0.5s_ease-in-out]" : ""}`} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full gradient-gold text-[10px] font-bold text-black px-1"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 sm:w-96 p-0 glass-dark border-gold/10 shadow-2xl shadow-gold/5"
        align="end"
        sideOffset={8}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* ── Header ─────────────────────────────────── */}
              <div className="flex items-center justify-between p-4 border-b border-gold/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Bell className="h-3.5 w-3.5 text-gold" />
                  </div>
                  <h3 className="font-heading font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge className="gradient-gold text-black text-[10px] border-0 px-2 py-0 font-bold">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-muted-foreground hover:text-gold h-7 px-2"
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      Tout lire
                    </Button>
                  )}
                </div>
              </div>

              {/* ── Notification List ──────────────────────── */}
              <ScrollArea className="max-h-[420px]">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center animate-pulse">
                      <Bell className="h-5 w-5 text-gold/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">Chargement…</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex flex-col items-center gap-4 py-10 px-4"
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-16 h-16 rounded-2xl bg-gold/5 flex items-center justify-center"
                    >
                      <Bell className="h-8 w-8 text-gold/20" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground/80">Aucune notification</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vos notifications apparaîtront ici
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div>
                    {grouped.map((group, groupIdx) => (
                      <div key={group.label}>
                        {/* Date group header */}
                        <div className="px-4 pt-3 pb-1.5">
                          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-gold/60">
                            {group.label}
                          </p>
                        </div>

                        {/* Notifications in this group */}
                        <div className="divide-y divide-border/10">
                          <AnimatePresence mode="popLayout">
                            {group.items.map((notification) => {
                              const config = typeConfig[notification.type] || typeConfig.GENERAL
                              const Icon = config.icon
                              const isDeleting = deletingIds.has(notification.id)

                              return (
                                <motion.div
                                  key={notification.id}
                                  layout
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: isDeleting ? 0.4 : 1, x: 0 }}
                                  exit={{ opacity: 0, x: 8, height: 0 }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                  className={`relative flex items-start gap-3 px-4 py-3 hover:bg-gold/[0.04] transition-colors cursor-pointer group ${
                                    !notification.isRead ? "bg-gold/[0.03]" : ""
                                  }`}
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  {/* Icon */}
                                  <div
                                    className={`w-9 h-9 rounded-xl ${config.bgColor} flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105`}
                                  >
                                    <Icon className={`h-4 w-4 ${config.color}`} />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <p
                                          className={`text-xs font-medium truncate ${
                                            !notification.isRead
                                              ? "text-foreground"
                                              : "text-muted-foreground"
                                          }`}
                                        >
                                          {notification.title}
                                        </p>
                                        {!notification.isRead && (
                                          <span className="w-2 h-2 rounded-full bg-gold shrink-0 animate-pulse" />
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-2 leading-relaxed">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-[10px] text-muted-foreground/50">
                                        {formatTimeAgo(notification.createdAt)}
                                      </span>
                                      <span className="text-[10px] text-gold/40 font-medium">
                                        {config.label}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Delete button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 shrink-0 transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </motion.div>
                              )
                            })}
                          </AnimatePresence>
                        </div>

                        {/* Separator between groups */}
                        {groupIdx < grouped.length - 1 && (
                          <Separator className="bg-gold/5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* ── Footer ─────────────────────────────────── */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gold/10">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground/40">
                      {count.totalCount} notification{count.totalCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/25">
                      Created by HenoBuild
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  )
}
