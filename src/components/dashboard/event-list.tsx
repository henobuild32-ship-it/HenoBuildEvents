"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  CalendarDays, Plus, Search, MapPin, Users, Clock, Filter,
  Heart, Diamond, Cake, Droplets, Mic, Crown, Star, Wine,
  Sparkles, GraduationCap, Church, Settings as SettingsIcon,
  CheckCircle2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useStore, type Event } from "@/lib/store"

const typeIcons: Record<string, React.ElementType> = {
  WEDDING: Heart, ENGAGEMENT: Diamond, BIRTHDAY: Cake, BAPTISM: Droplets,
  CONFERENCE: Mic, CEREMONY: Crown, VIP: Star, GALA: Wine, COCKTAIL: Sparkles,
  GRADUATION: GraduationCap, RELIGIOUS: Church, CUSTOM: SettingsIcon,
}

const typeLabels: Record<string, string> = {
  WEDDING: "Mariage", ENGAGEMENT: "Fiançailles", BIRTHDAY: "Anniversaire",
  BAPTISM: "Baptême", CONFERENCE: "Conférence", CEREMONY: "Cérémonie",
  VIP: "Soirée VIP", GALA: "Gala", COCKTAIL: "Cocktail",
  GRADUATION: "Diplômes", RELIGIOUS: "Religieux", CUSTOM: "Personnalisé",
  PRIVATE_PARTY: "Fête privée", FAMILY: "Familial", PROFESSIONAL: "Professionnel",
  MEETING: "Réunion",
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "border-amber-500/30 text-amber-500 bg-amber-500/5" },
  published: { label: "Publié", color: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" },
  cancelled: { label: "Annulé", color: "border-destructive/30 text-destructive bg-destructive/5" },
  completed: { label: "Terminé", color: "border-muted-foreground/30 text-muted-foreground bg-muted/5" },
}

export function EventList() {
  const { auth, user, events, setEvents, setActiveSection, setCurrentEventId, setCurrentEvent, currentEventId } = useStore()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)

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
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setIsLoading(false)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Mes événements</h2>
          <p className="text-sm text-muted-foreground">{events.length} événement{events.length !== 1 ? "s" : ""}</p>
        </div>
        <Button
          onClick={() => setActiveSection("creer-evenement")}
          className="btn-gold rounded-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un événement
        </Button>
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
        <div className="flex gap-2">
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
              <div className="h-32 bg-muted/30 rounded-t-lg" />
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((event) => {
            const TypeIcon = typeIcons[event.type || "CUSTOM"] || SettingsIcon
            const status = statusLabels[event.status] || statusLabels.draft
            const isSelected = event.id === currentEventId

            return (
              <motion.div
                key={event.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <Card
                  className={`cursor-pointer transition-all group overflow-hidden ${
                    isSelected
                      ? "border-gold/50 ring-2 ring-gold/30 shadow-lg shadow-gold/10"
                      : "border-border/50 hover:border-gold/20"
                  }`}
                  onClick={() => selectEvent(event)}
                >
                  {/* Cover */}
                  <div className="h-32 bg-gradient-to-br from-gold/10 to-muted/30 flex items-center justify-center relative">
                    <TypeIcon className="h-10 w-10 text-gold/40" />
                    <Badge
                      variant="outline"
                      className={`absolute top-3 right-3 text-[10px] ${status.color}`}
                    >
                      {status.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="absolute top-3 left-3 text-[10px] border-gold/30 text-gold bg-gold/10"
                    >
                      {typeLabels[event.type || "CUSTOM"] || "Événement"}
                    </Badge>
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute bottom-2 right-2">
                        <div className="w-7 h-7 rounded-full gradient-gold flex items-center justify-center shadow-md">
                          <CheckCircle2 className="h-4 w-4 text-black" />
                        </div>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-heading font-semibold group-hover:text-gold transition-colors line-clamp-1">
                      {event.title}
                    </h3>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
                        {new Date(event.date).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-gold shrink-0" />
                        {(event as Event & { guestCount?: number }).guestCount || 0} invité{((event as Event & { guestCount?: number }).guestCount || 0) !== 1 ? "s" : ""}
                      </div>
                    </div>

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
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
