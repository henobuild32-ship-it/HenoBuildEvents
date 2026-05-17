"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle, Send, Megaphone, User, Users,
  Search, Plus, Trash2, Check, CheckCheck, Copy,
  X, ChevronDown, Inbox, Sparkles, Eye, MoreHorizontal,
  Hash
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────

interface MessageSender {
  id: string
  name: string
  email: string
  firstName?: string
  lastName?: string
  photo?: string
}

interface MessageRecipient {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  photo?: string
}

interface Message {
  id: string
  subject?: string | null
  content: string
  isAnnouncement: boolean
  isRead: boolean
  readAt?: string | null
  status: string
  createdAt: string
  senderId: string
  recipientId?: string | null
  sender: MessageSender
  recipient?: MessageRecipient | null
}

interface Guest {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  photo?: string
}

type FilterTab = "all" | "announcements" | "direct" | "unread"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFrenchDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`

  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `Il y a ${diffDays}j`

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function formatFullFrenchDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(firstName?: string, lastName?: string, name?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  if (name) return name.slice(0, 2).toUpperCase()
  return "??"
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

function AnnouncementSkeleton() {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

function EmptyState({ filter, onCompose }: { filter: FilterTab; onCompose: () => void }) {
  const config: Record<FilterTab, { icon: React.ElementType; title: string; desc: string }> = {
    all: {
      icon: MessageCircle,
      title: "Aucun message",
      desc: "Commencez une conversation avec vos invités",
    },
    announcements: {
      icon: Megaphone,
      title: "Aucune annonce",
      desc: "Publiez une annonce pour informer tous vos invités",
    },
    direct: {
      icon: User,
      title: "Aucun message direct",
      desc: "Envoyez un message privé à un invité",
    },
    unread: {
      icon: Inbox,
      title: "Tout est lu",
      desc: "Aucun message non lu pour le moment",
    },
  }

  const { icon: Icon, title, desc } = config[filter]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-6"
      >
        <div className="h-20 w-20 rounded-2xl bg-gold/10 flex items-center justify-center">
          <Icon className="h-10 w-10 text-gold/60" />
        </div>
        <div className="absolute -inset-2 rounded-2xl border border-gold/10 animate-pulse-gold" />
      </motion.div>
      <h3 className="font-heading text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">{desc}</p>
      {filter !== "unread" && (
        <Button onClick={onCompose} className="btn-gold rounded-full">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau message
        </Button>
      )}
    </motion.div>
  )
}

function NoEventState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-6"
      >
        <div className="h-20 w-20 rounded-2xl bg-gold/10 flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-gold/60" />
        </div>
        <div className="absolute -inset-2 rounded-2xl border border-gold/10 animate-pulse-gold" />
      </motion.div>
      <h3 className="font-heading text-xl font-semibold mb-2">Sélectionnez un événement</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Choisissez un événement pour accéder à la messagerie
      </p>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function MessagingSection() {
  const { auth, currentEventId, events, user } = useStore()
  const currentEvent = events.find((e) => e.id === currentEventId)

  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("")
  const [recipientSearch, setRecipientSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [messageSearch, setMessageSearch] = useState("")
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)

  const recipientDropdownRef = useRef<HTMLDivElement>(null)

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    if (!currentEventId || !auth.token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/messages?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      } else {
        toast.error("Erreur lors du chargement des messages")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsLoading(false)
    }
  }, [currentEventId, auth.token])

  const fetchGuests = useCallback(async () => {
    if (!currentEventId || !auth.token) return
    try {
      const res = await fetch(`/api/guests?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGuests(data.guests || [])
      }
    } catch {
      // Silent fail for guests — not critical
    }
  }, [currentEventId, auth.token])

  useEffect(() => {
    if (currentEventId) {
      fetchMessages()
      fetchGuests()
    } else {
      setMessages([])
      setGuests([])
    }
  }, [currentEventId, fetchMessages, fetchGuests])

  // Close recipient dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (recipientDropdownRef.current && !recipientDropdownRef.current.contains(e.target as Node)) {
        setShowRecipientDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!currentEventId || !auth.token) return
    if (!content.trim()) {
      toast.error("Le message ne peut pas être vide")
      return
    }
    if (!isAnnouncement && !selectedRecipientId) {
      toast.error("Veuillez sélectionner un destinataire")
      return
    }

    setIsSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          eventId: currentEventId,
          content: content.trim(),
          subject: subject.trim() || undefined,
          isAnnouncement,
          recipientId: isAnnouncement ? null : selectedRecipientId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [data.message, ...prev])
        toast.success(isAnnouncement ? "Annonce envoyée à tous les invités" : "Message envoyé")
        setIsComposing(false)
        setContent("")
        setSubject("")
        setIsAnnouncement(false)
        setSelectedRecipientId("")
        setRecipientSearch("")
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors de l'envoi")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsSending(false)
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m))
        )
        toast.success("Marqué comme lu")
      }
    } catch {
      toast.error("Erreur lors du marquage")
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
        toast.success("Message supprimé")
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    }
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Texte copié dans le presse-papiers")
    }).catch(() => {
      toast.error("Impossible de copier le texte")
    })
  }

  // ─── Filtering & Search ──────────────────────────────────────────────────

  const filteredMessages = messages.filter((m) => {
    // Tab filter
    if (activeFilter === "announcements" && !m.isAnnouncement) return false
    if (activeFilter === "direct" && m.isAnnouncement) return false
    if (activeFilter === "unread" && m.isRead) return false

    // Search filter
    if (messageSearch.trim()) {
      const q = messageSearch.toLowerCase()
      const matchesContent = m.content.toLowerCase().includes(q)
      const matchesSubject = (m.subject || "").toLowerCase().includes(q)
      const matchesSender = `${m.sender?.firstName || ""} ${m.sender?.lastName || ""}`.toLowerCase().includes(q)
      const matchesRecipient = m.recipient
        ? `${m.recipient.firstName} ${m.recipient.lastName}`.toLowerCase().includes(q)
        : false
      return matchesContent || matchesSubject || matchesSender || matchesRecipient
    }

    return true
  })

  const filteredGuests = guests.filter((g) => {
    if (!recipientSearch.trim()) return true
    const q = recipientSearch.toLowerCase()
    return (
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
      (g.email || "").toLowerCase().includes(q)
    )
  })

  const unreadCount = messages.filter((m) => !m.isRead).length
  const announcementCount = messages.filter((m) => m.isAnnouncement).length
  const directCount = messages.filter((m) => !m.isAnnouncement).length

  const selectedRecipient = guests.find((g) => g.id === selectedRecipientId)

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-gold" />
            Messages
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentEvent ? currentEvent.title : "Communiquez avec vos invités"}
          </p>
        </div>
        <Button
          onClick={() => setIsComposing(!isComposing)}
          className="btn-gold rounded-full"
          disabled={!currentEventId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau message
        </Button>
      </div>

      {/* No event selected */}
      {!currentEventId ? (
        <NoEventState />
      ) : (
        <>
          {/* Compose Dialog */}
          <Dialog open={isComposing} onOpenChange={setIsComposing}>
            <DialogContent className="sm:max-w-lg glass-dark border-gold/20">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 gradient-gold-text font-heading">
                  {isAnnouncement ? (
                    <Megaphone className="h-5 w-5 text-gold" />
                  ) : (
                    <MessageCircle className="h-5 w-5 text-gold" />
                  )}
                  {isAnnouncement ? "Nouvelle annonce" : "Nouveau message"}
                </DialogTitle>
                <DialogDescription>
                  {isAnnouncement
                    ? "Envoyez une annonce à tous les invités de l'événement"
                    : "Envoyez un message privé à un invité"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Announcement toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gold/5 border border-gold/10">
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="h-4 w-4 text-gold" />
                    <Label htmlFor="announcement-toggle" className="text-sm cursor-pointer font-medium">
                      Mode annonce (envoyer à tous)
                    </Label>
                  </div>
                  <Switch
                    id="announcement-toggle"
                    checked={isAnnouncement}
                    onCheckedChange={(checked) => {
                      setIsAnnouncement(checked)
                      if (checked) {
                        setSelectedRecipientId("")
                        setRecipientSearch("")
                      }
                    }}
                  />
                </div>

                {/* Recipient selector (non-announcement mode) */}
                {!isAnnouncement && (
                  <div className="space-y-2" ref={recipientDropdownRef}>
                    <Label>Destinataire *</Label>
                    <div className="relative">
                      {selectedRecipient ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-gold/20 bg-gold/5">
                          <div className="h-8 w-8 rounded-full gradient-gold flex items-center justify-center text-xs font-bold text-black shrink-0">
                            {getInitials(selectedRecipient.firstName, selectedRecipient.lastName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {selectedRecipient.firstName} {selectedRecipient.lastName}
                            </p>
                            {selectedRecipient.email && (
                              <p className="text-xs text-muted-foreground truncate">{selectedRecipient.email}</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedRecipientId("")
                              setRecipientSearch("")
                              setShowRecipientDropdown(true)
                            }}
                            className="p-1 rounded-full hover:bg-gold/10 transition-colors"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Rechercher un invité..."
                              value={recipientSearch}
                              onChange={(e) => {
                                setRecipientSearch(e.target.value)
                                setShowRecipientDropdown(true)
                              }}
                              onFocus={() => setShowRecipientDropdown(true)}
                              className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                            />
                          </div>
                          <AnimatePresence>
                            {showRecipientDropdown && filteredGuests.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-gold/20 bg-card shadow-lg"
                              >
                                {filteredGuests.map((guest) => (
                                  <button
                                    key={guest.id}
                                    onClick={() => {
                                      setSelectedRecipientId(guest.id)
                                      setRecipientSearch("")
                                      setShowRecipientDropdown(false)
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gold/5 transition-colors"
                                  >
                                    <div className="h-7 w-7 rounded-full bg-gold/10 flex items-center justify-center text-[10px] font-bold text-gold shrink-0">
                                      {getInitials(guest.firstName, guest.lastName)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {guest.firstName} {guest.lastName}
                                      </p>
                                      {guest.email && (
                                        <p className="text-xs text-muted-foreground truncate">{guest.email}</p>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {showRecipientDropdown && filteredGuests.length === 0 && recipientSearch && (
                            <div className="absolute z-50 w-full mt-1 rounded-xl border border-gold/20 bg-card shadow-lg p-4 text-center">
                              <p className="text-sm text-muted-foreground">Aucun invité trouvé</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Announcement recipients hint */}
                {isAnnouncement && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gold/5 border border-gold/10">
                    <Users className="h-4 w-4 text-gold shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Cette annonce sera envoyée à <span className="font-semibold text-gold">{guests.length} invité{guests.length !== 1 ? "s" : ""}</span>
                    </p>
                  </div>
                )}

                {/* Subject */}
                <div className="space-y-2">
                  <Label>Sujet</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Sujet du message (optionnel)"
                    className="bg-background/50 border-gold/20 focus:border-gold/50"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="bg-background/50 border-gold/20 focus:border-gold/50 min-h-[140px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {content.length} caractère{content.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <Button onClick={handleSend} className="btn-gold rounded-full flex-1" disabled={isSending || !content.trim()}>
                    {isSending ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {isAnnouncement ? "Envoyer l'annonce" : "Envoyer le message"}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsComposing(false)
                      setContent("")
                      setSubject("")
                      setSelectedRecipientId("")
                      setRecipientSearch("")
                    }}
                    className="text-muted-foreground"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les messages..."
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
              className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
            />
            {messageSearch && (
              <button
                onClick={() => setMessageSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterTab)}>
            <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
              <TabsTrigger
                value="all"
                className="rounded-lg data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-xs px-3"
              >
                <Hash className="h-3.5 w-3.5 mr-1" />
                Tous
                <span className="ml-1.5 text-[10px] bg-muted/50 px-1.5 py-0.5 rounded-full">
                  {messages.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="announcements"
                className="rounded-lg data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-xs px-3"
              >
                <Megaphone className="h-3.5 w-3.5 mr-1" />
                Annonces
                {announcementCount > 0 && (
                  <span className="ml-1.5 text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded-full">
                    {announcementCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="direct"
                className="rounded-lg data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-xs px-3"
              >
                <User className="h-3.5 w-3.5 mr-1" />
                Directs
                {directCount > 0 && (
                  <span className="ml-1.5 text-[10px] bg-muted/50 px-1.5 py-0.5 rounded-full">
                    {directCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="rounded-lg data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-xs px-3"
              >
                <Inbox className="h-3.5 w-3.5 mr-1" />
                Non lus
                {unreadCount > 0 && (
                  <span className="ml-1.5 text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeFilter} className="mt-4">
              {/* Loading state */}
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Card key={i} className="border-gold/10 overflow-hidden">
                      {i === 1 ? <AnnouncementSkeleton /> : <MessageSkeleton />}
                    </Card>
                  ))}
                  {[3, 4, 5].map((i) => (
                    <Card key={i} className="border-border/50 overflow-hidden">
                      <MessageSkeleton />
                    </Card>
                  ))}
                </div>
              ) : filteredMessages.length === 0 ? (
                <EmptyState filter={activeFilter} onCompose={() => setIsComposing(true)} />
              ) : (
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {filteredMessages.map((message, index) => {
                      const isOwn = message.senderId === user?.id
                      const isExpanded = expandedMessageId === message.id

                      return (
                        <motion.div
                          key={message.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -8 }}
                          transition={{ duration: 0.25, delay: index * 0.03 }}
                        >
                          {message.isAnnouncement ? (
                            /* ─── Announcement Card ─── */
                            <Card className="border-gold/20 overflow-hidden card-premium-glow group">
                              <div className="relative">
                                {/* Gold banner gradient top */}
                                <div className="h-1 gradient-gold" />
                                <CardContent className="p-4 pt-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      {/* Icon */}
                                      <div className="h-10 w-10 rounded-xl gradient-gold flex items-center justify-center shrink-0 shadow-lg shadow-gold/20">
                                        <Megaphone className="h-5 w-5 text-black" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-heading font-semibold text-sm">
                                            {message.subject || "Annonce"}
                                          </span>
                                          <Badge className="gradient-gold text-black text-[10px] border-0 font-semibold px-2">
                                            ANNONCE
                                          </Badge>
                                          {!message.isRead && (
                                            <span className="h-2 w-2 rounded-full bg-gold animate-pulse-gold" />
                                          )}
                                        </div>
                                        <p className={`text-sm mt-1.5 whitespace-pre-wrap ${!isExpanded ? "line-clamp-2" : ""}`}>
                                          {message.content}
                                        </p>
                                        {message.content.length > 150 && (
                                          <button
                                            onClick={() => setExpandedMessageId(isExpanded ? null : message.id)}
                                            className="text-xs text-gold hover:underline mt-1"
                                          >
                                            {isExpanded ? "Voir moins" : "Voir plus"}
                                          </button>
                                        )}
                                        <div className="flex items-center gap-3 mt-2">
                                          <span className="text-xs text-muted-foreground">
                                            {formatFrenchDate(message.createdAt)}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground" title={formatFullFrenchDate(message.createdAt)}>
                                            {isOwn ? "Vous" : `${message.sender?.firstName || ""} ${message.sender?.lastName || ""}`}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors opacity-0 group-hover:opacity-100">
                                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        {!message.isRead && (
                                          <DropdownMenuItem onClick={() => handleMarkAsRead(message.id)}>
                                            <Eye className="h-3.5 w-3.5 mr-2" />
                                            Marquer comme lu
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleCopyText(message.content)}>
                                          <Copy className="h-3.5 w-3.5 mr-2" />
                                          Copier le texte
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(message.id)}
                                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                                          Supprimer
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </CardContent>
                              </div>
                            </Card>
                          ) : (
                            /* ─── Direct Message Card ─── */
                            <Card className={`border-border/50 overflow-hidden group transition-all hover:border-gold/10 ${
                              !message.isRead ? "bg-gold/[0.02] dark:bg-gold/[0.03]" : ""
                            }`}>
                              <CardContent className="p-4">
                                <div className="flex gap-3">
                                  {/* Avatar */}
                                  <div className="shrink-0">
                                    {isOwn ? (
                                      <div className="h-10 w-10 rounded-full gradient-gold flex items-center justify-center text-xs font-bold text-black shadow-md shadow-gold/10">
                                        {getInitials(user?.firstName, user?.lastName, user?.name)}
                                      </div>
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">
                                        {message.sender
                                          ? getInitials(message.sender.firstName, message.sender.lastName, message.sender.name)
                                          : "??"}
                                      </div>
                                    )}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm font-semibold truncate">
                                          {isOwn
                                            ? "Vous"
                                            : `${message.sender?.firstName || ""} ${message.sender?.lastName || ""}`}
                                        </span>
                                        {message.recipient && (
                                          <>
                                            <ChevronDown className="h-3 w-3 text-muted-foreground rotate-90 shrink-0" />
                                            <span className="text-xs text-muted-foreground truncate">
                                              {message.recipient.firstName} {message.recipient.lastName}
                                            </span>
                                          </>
                                        )}
                                        {!message.isRead && (
                                          <span className="h-2 w-2 rounded-full bg-gold animate-pulse-gold shrink-0" />
                                        )}
                                      </div>
                                      <span className="text-[11px] text-muted-foreground shrink-0" title={formatFullFrenchDate(message.createdAt)}>
                                        {formatFrenchDate(message.createdAt)}
                                      </span>
                                    </div>

                                    {message.subject && (
                                      <p className="text-xs font-medium text-gold mt-0.5 truncate">
                                        {message.subject}
                                      </p>
                                    )}

                                    {/* Chat bubble */}
                                    <div className={`mt-2 rounded-2xl px-3.5 py-2.5 inline-block max-w-full ${
                                      isOwn
                                        ? "bg-gold/10 border border-gold/15 rounded-br-md"
                                        : "bg-muted/40 border border-border/30 rounded-bl-md"
                                    }`}>
                                      <p className={`text-sm whitespace-pre-wrap break-words ${!isExpanded ? "line-clamp-3" : ""}`}>
                                        {message.content}
                                      </p>
                                    </div>
                                    {message.content.length > 200 && (
                                      <button
                                        onClick={() => setExpandedMessageId(isExpanded ? null : message.id)}
                                        className="text-xs text-gold hover:underline mt-1 block"
                                      >
                                        {isExpanded ? "Voir moins" : "Voir plus"}
                                      </button>
                                    )}

                                    {/* Read indicator */}
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      {isOwn && (
                                        message.isRead ? (
                                          <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                                            <CheckCheck className="h-3 w-3" />
                                            Lu
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Check className="h-3 w-3" />
                                            Envoyé
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="shrink-0">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors opacity-0 group-hover:opacity-100">
                                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        {!message.isRead && (
                                          <DropdownMenuItem onClick={() => handleMarkAsRead(message.id)}>
                                            <Eye className="h-3.5 w-3.5 mr-2" />
                                            Marquer comme lu
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleCopyText(message.content)}>
                                          <Copy className="h-3.5 w-3.5 mr-2" />
                                          Copier le texte
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(message.id)}
                                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                                          Supprimer
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
