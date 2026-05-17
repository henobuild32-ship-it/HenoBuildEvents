"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarDays, Plus, Search, MapPin, Users, Grid3X3,
  Heart, Diamond, Cake, Droplets, Mic, Crown, Star, Wine,
  Sparkles, GraduationCap, Church, Settings as SettingsIcon,
  CheckCircle2, MoreVertical, Trash2, Edit2, Eye, Share2, Copy,
  Clock, ArrowRight, LayoutGrid, List, ChevronDown
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useStore, type Event } from "@/lib/store"
import { toast } from "sonner"

const typeIcons: Record<string, React.ElementType> = {
  WEDDING: Heart, ENGAGEMENT: Diamond, BIRTHDAY: Cake, BAPTISM: Droplets,
  CONFERENCE: Mic, CEREMONY: Crown, VIP: Star, GALA: Wine, COCKTAIL: Sparkles,
  GRADUATION: GraduationCap, RELIGIOUS: Church, CUSTOM: SettingsIcon,
  PRIVATE_PARTY: Star, FAMILY: Heart, PROFESSIONAL: Mic, MEETING: SettingsIcon,
}

const typeLabels: Record<string, string> = {
  WEDDING: "Mariage", ENGAGEMENT: "Fiançailles", BIRTHDAY: "Anniversaire",
  BAPTISM: "Baptême", CONFERENCE: "Conférence", CEREMONY: "Cérémonie",
  VIP: "Soirée VIP", GALA: "Gala", COCKTAIL: "Cocktail",
  GRADUATION: "Diplômes", RELIGIOUS: "Religieux", CUSTOM: "Personnalisé",
  PRIVATE_PARTY: "Fête privée", FAMILY: "Familial", PROFESSIONAL: "Professionnel",
  MEETING: "Réunion",
}

const typeGradients: Record<string, string> = {
  WEDDING: "from-pink-500/20 via-gold/10 to-rose-500/10",
  ENGAGEMENT: "from-gold/20 via-amber-500/10 to-yellow-500/10",
  BIRTHDAY: "from-purple-500/20 via-pink-500/10 to-gold/10",
  BAPTISM: "from-sky-500/20 via-blue-500/10 to-gold/10",
  CONFERENCE: "from-emerald-500/20 via-teal-500/10 to-gold/10",
  CEREMONY: "from-gold/20 via-amber-500/10 to-orange-500/10",
  VIP: "from-gold/20 via-yellow-500/10 to-amber-500/10",
  GALA: "from-burgundy/20 via-gold/10 to-red-500/10",
  COCKTAIL: "from-orange-500/20 via-gold/10 to-amber-500/10",
  GRADUATION: "from-indigo-500/20 via-blue-500/10 to-gold/10",
  RELIGIOUS: "from-amber-500/20 via-gold/10 to-yellow-500/10",
  CUSTOM: "from-gold/10 via-muted/20 to-muted/10",
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "border-amber-500/30 text-amber-500 bg-amber-500/5" },
  published: { label: "Publié", color: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" },
  cancelled: { label: "Annulé", color: "border-destructive/30 text-destructive bg-destructive/5" },
  completed: { label: "Terminé", color: "border-muted-foreground/30 text-muted-foreground bg-muted/5" },
}

interface EventStats {
  guestCount: number
  confirmedCount: number
  tableCount: number
  invitationCount: number
}

export function EventList() {
  const { auth, user, events, setEvents, setActiveSection, setCurrentEventId, setCurrentEvent, currentEventId, setEventToEdit } = useStore()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [eventStats, setEventStats] = useState<Record<string, EventStats>>({})
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid")

  useEffect(() => {
    fetchEvents()
  }, [auth.token])

  const fetchEvents = async () => {
    if (!user?.id || !auth.token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/events?organizerId=${user.id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
        // Fetch stats for each event
        for (const event of data.events || []) {
          fetchEventStats(event.id)
        }
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEventStats = async (eventId: string) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/stats?eventId=${eventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEventStats((prev) => ({
          ...prev,
          [eventId]: {
            guestCount: data.stats?.guests?.total || 0,
            confirmedCount: data.stats?.guests?.confirmed || 0,
            tableCount: data.stats?.tables?.total || 0,
            invitationCount: data.stats?.invitations?.total || 0,
          },
        }))
      }
    } catch {
      // Silent fail for stats
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        toast.success("Événement supprimé")
        fetchEvents()
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
  }

  const duplicateEvent = async (eventId: string) => {
    if (!auth.token) return
    try {
      toast.loading("Duplication en cours...", { id: "duplicate" })
      const res = await fetch(`/api/events/${eventId}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        toast.success("Événement dupliqué avec succès", { id: "duplicate" })
        fetchEvents()
      } else {
        toast.error("Erreur lors de la duplication", { id: "duplicate" })
      }
    } catch {
      toast.error("Erreur de connexion", { id: "duplicate" })
    }
  }

  const filtered = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      (event.location || "").toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || event.status === filter
    return matchesSearch && matchesFilter
  })

  const selectEvent = (event: Event) => {
    setCurrentEventId(event.id)
    setCurrentEvent(event)
    setActiveSection("accueil")
  }

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-gold" />
            Mes événements
          </h2>
          <p className="text-sm text-muted-foreground">
            {events.length} événement{events.length !== 1 ? "s" : ""} •{" "}
            {events.filter((e) => e.status === "published").length} publié{events.filter((e) => e.status === "published").length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setActiveSection("creer-evenement")}
          className="btn-gold rounded-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un événement
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: events.length, color: "text-foreground" },
          { label: "Publiés", value: events.filter((e) => e.status === "published").length, color: "text-emerald-500" },
          { label: "Brouillons", value: events.filter((e) => e.status === "draft").length, color: "text-amber-500" },
          { label: "Terminés", value: events.filter((e) => e.status === "completed").length, color: "text-muted-foreground" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un événement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* View toggle */}
          <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-gold"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`p-2 transition-colors ${viewMode === "timeline" ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-gold"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          {["all", "draft", "published", "completed"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={`rounded-full text-xs ${
                filter === f ? "btn-gold" : "btn-outline-gold border-gold/30"
              }`}
            >
              {f === "all" ? "Tous" : statusLabels[f]?.label || f}
            </Button>
          ))}
        </div>
      </div>

      {/* Events grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/50 animate-pulse">
              <div className="h-40 bg-muted/30 rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-5 bg-muted/30 rounded w-3/4" />
                <div className="h-4 bg-muted/30 rounded w-1/2" />
                <div className="h-4 bg-muted/30 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">Aucun événement</h3>
          <p className="text-muted-foreground mb-6">
            {search ? "Aucun résultat pour votre recherche" : "Créez votre premier événement pour commencer"}
          </p>
          {!search && (
            <Button
              onClick={() => setActiveSection("creer-evenement")}
              className="btn-gold rounded-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un événement
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className={viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
          }
        >
          <AnimatePresence>
            {filtered.map((event) => {
              const TypeIcon = typeIcons[event.type || "CUSTOM"] || SettingsIcon
              const status = statusLabels[event.status] || statusLabels.draft
              const isSelected = event.id === currentEventId
              const stats = eventStats[event.id]
              const daysUntil = getDaysUntil(event.date)
              const gradient = typeGradients[event.type || "CUSTOM"] || typeGradients.CUSTOM

              return (
                <motion.div
                  key={event.id}
                  variants={{ hidden: { opacity: 0, y: 20, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                {viewMode === "grid" ? (
                  <Card
                    className={`cursor-pointer transition-all group overflow-hidden hover-glow-gold ${
                      isSelected
                        ? "border-gold/50 ring-2 ring-gold/30 shadow-lg shadow-gold/10"
                        : "border-border/50 hover:border-gold/20 hover:shadow-lg"
                    }`}
                    onClick={() => selectEvent(event)}
                  >
                    {/* Cover with gradient or image */}
                    <div className={`h-40 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                      {event.coverImage ? (
                        <img
                          src={event.coverImage}
                          alt={event.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <TypeIcon className="h-12 w-12 text-gold/30" />
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                      {/* Badges */}
                      <Badge
                        variant="outline"
                        className={`absolute top-3 right-3 text-[10px] ${status.color}`}
                      >
                        {status.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="absolute top-3 left-3 text-[10px] border-gold/30 text-gold bg-black/30 backdrop-blur-sm"
                      >
                        {typeLabels[event.type || "CUSTOM"] || "Événement"}
                      </Badge>

                      {/* Countdown or date */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-white/80" />
                        <span className="text-xs text-white/90 font-medium">
                          {daysUntil > 0
                            ? `Dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""}`
                            : daysUntil === 0
                            ? "Aujourd'hui !"
                            : `Il y a ${Math.abs(daysUntil)} jour${Math.abs(daysUntil) > 1 ? "s" : ""}`}
                        </span>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute bottom-3 right-3">
                          <div className="w-7 h-7 rounded-full gradient-gold flex items-center justify-center shadow-md">
                            <CheckCircle2 className="h-4 w-4 text-black" />
                          </div>
                        </div>
                      )}

                      {/* Actions menu */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => selectEvent(event)}>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setCurrentEventId(event.id); setCurrentEvent(event); setActiveSection("invites") }}>
                              <Users className="h-3.5 w-3.5 mr-2" />
                              Gérer les invités
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEventToEdit(event); setActiveSection("creer-evenement") }}>
                              <Edit2 className="h-3.5 w-3.5 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateEvent(event.id)}>
                              <Copy className="h-3.5 w-3.5 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteEvent(event.id)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-heading font-semibold group-hover:text-gold transition-colors line-clamp-1">
                        {event.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
                          {new Date(event.date).toLocaleDateString("fr-FR", {
                            weekday: "short", day: "numeric", month: "long", year: "numeric",
                          })}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Animated hover expansion - shows on hover */}
                      <motion.div
                        initial={false}
                        animate={{ height: "auto", opacity: 1 }}
                        className="overflow-hidden"
                      >
                        {stats && (
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                            <span>{stats.guestCount} invités</span>
                            <span className="text-border">•</span>
                            <span>{stats.confirmedCount} confirmés</span>
                            <span className="text-border">•</span>
                            <span>{stats.tableCount} tables</span>
                          </div>
                        )}
                      </motion.div>

                      {/* Stats row with gradient progress bar */}
                      {stats && (
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3 text-gold" />
                            <span>{stats.guestCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <span>{stats.confirmedCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Grid3X3 className="h-3 w-3 text-amber-500" />
                            <span>{stats.tableCount}</span>
                          </div>
                          {stats.guestCount > 0 && (
                            <div className="flex-1">
                              <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-all duration-500"
                                  style={{ width: `${(stats.confirmedCount / stats.guestCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Select button */}
                      <Button
                        size="sm"
                        className={`w-full rounded-full text-xs ${
                          isSelected
                            ? "btn-gold"
                            : "btn-outline-gold border-gold/30"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          selectEvent(event)
                        }}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Événement actif
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            Sélectionner
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  /* Timeline View */
                  <div
                    className={`flex gap-4 p-4 rounded-xl cursor-pointer transition-all group hover-glow-gold ${
                      isSelected
                        ? "bg-gold/10 border border-gold/20 shadow-md shadow-gold/10"
                        : "bg-card/60 border border-border/50 hover:border-gold/20 hover:bg-gold/5"
                    }`}
                    onClick={() => selectEvent(event)}
                  >
                    {/* Timeline line & dot */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? "gradient-gold" : "bg-gold/10"}`}>
                        <TypeIcon className={`h-5 w-5 ${isSelected ? "text-black" : "text-gold"}`} />
                      </div>
                      <div className="w-px flex-1 bg-gradient-to-b from-gold/30 to-transparent mt-2" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-semibold group-hover:text-gold transition-colors">{event.title}</h3>
                        <Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                        <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">{typeLabels[event.type || "CUSTOM"] || "Événement"}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3 w-3 text-gold" />
                          {new Date(event.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-gold" />
                            {event.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-gold" />
                          {daysUntil > 0 ? `Dans ${daysUntil}j` : daysUntil === 0 ? "Aujourd'hui" : "Passé"}
                        </span>
                      </div>
                      {stats && stats.guestCount > 0 && (
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-xs text-muted-foreground">{stats.confirmedCount}/{stats.guestCount} confirmés</span>
                          <div className="flex-1 max-w-xs">
                            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light"
                                style={{ width: `${(stats.confirmedCount / stats.guestCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
