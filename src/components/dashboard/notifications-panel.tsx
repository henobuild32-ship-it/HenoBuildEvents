"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, Check, CheckCheck, X, Mail, Users, Calendar,
  AlertCircle, Info, Sparkles, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
  event?: {
    id: string
    title: string
  }
  guest?: {
    id: string
    firstName: string
    lastName: string
  }
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  INVITATION_SENT: { icon: Mail, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  RSVP_CONFIRMED: { icon: CheckCheck, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  RSVP_DECLINED: { icon: X, color: "text-red-500", bgColor: "bg-red-500/10" },
  EVENT_REMINDER: { icon: Calendar, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  EVENT_UPDATED: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  GUEST_ARRIVED: { icon: Users, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  TABLE_ASSIGNED: { icon: Sparkles, color: "text-gold", bgColor: "bg-gold/10" },
  MESSAGE_RECEIVED: { icon: Mail, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  GENERAL: { icon: Bell, color: "text-muted-foreground", bgColor: "bg-muted/30" },
}

export function NotificationsPanel() {
  const { auth } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(() => [
    {
      id: "1",
      type: "EVENT_REMINDER",
      title: "Rappel d'événement",
      message: "Votre événement \"Mariage de Sarah & Karim\" est dans 3 jours",
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      event: { id: "1", title: "Mariage de Sarah & Karim" },
    },
    {
      id: "2",
      type: "RSVP_CONFIRMED",
      title: "Confirmation RSVP",
      message: "Amina K. a confirmé sa présence",
      isRead: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      guest: { id: "1", firstName: "Amina", lastName: "K." },
    },
    {
      id: "3",
      type: "TABLE_ASSIGNED",
      title: "Table assignée",
      message: "Youssef B. a été assigné à la Table 3",
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "4",
      type: "GENERAL",
      title: "Bienvenue sur HenoBuild Event",
      message: "Commencez par créer votre premier événement !",
      isRead: true,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ])

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast.success("Toutes les notifications marquées comme lues")
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins}min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return then.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-gold hover:bg-gold/5 transition-all"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 glass-dark border-gold/10" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gold" />
            <h3 className="font-heading font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="gradient-gold text-black text-[10px] border-0 px-2 py-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-gold h-7"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout lire
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-12 h-12 rounded-full bg-gold/5 flex items-center justify-center">
                <Bell className="h-6 w-6 text-gold/30" />
              </div>
              <p className="text-sm text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              <AnimatePresence>
                {notifications.map((notification) => {
                  const config = typeConfig[notification.type] || typeConfig.GENERAL
                  const Icon = config.icon

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`flex items-start gap-3 p-3 hover:bg-gold/[0.03] transition-colors cursor-pointer group ${
                        !notification.isRead ? "bg-gold/[0.02]" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-medium ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 shrink-0"
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
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border/30 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30">
              Created by HenoBuild
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
