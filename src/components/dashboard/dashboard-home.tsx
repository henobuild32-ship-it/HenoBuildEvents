"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  CalendarDays, Users, Grid3X3, BarChart3, Mail,
  Sparkles, ArrowRight, Clock, CheckCircle2,
  AlertCircle, TrendingUp, MapPin, Heart, Diamond,
  Cake, Droplets, Mic, Crown, Star, Wine,
  GraduationCap, Church, Settings as SettingsIcon,
  Timer, UserCheck, UserX, CircleDot
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useStore, type Event } from "@/lib/store"

interface Stats {
  guests: { total: number; confirmed: number; responseRate: number; confirmationRate: number }
  tables: { total: number; totalCapacity: number; totalOccupancy: number; occupancyRate: number }
  invitations: { total: number; sent: number; pending: number }
  overall: { completionScore: number; healthStatus: string }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

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
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  const isPast = new Date(targetDate).getTime() <= new Date().getTime()

  if (isPast) {
    return (
      <div className="flex items-center gap-2 text-emerald-500">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Événement passé</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Timer className="h-4 w-4 text-gold shrink-0" />
      <div className="flex items-center gap-1.5">
        {[
          { value: timeLeft.days, label: "j" },
          { value: timeLeft.hours, label: "h" },
          { value: timeLeft.minutes, label: "m" },
          { value: timeLeft.seconds, label: "s" },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-0.5">
            <span className="text-sm font-bold font-mono tabular-nums text-gold">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted-foreground">{unit.label}</span>
            {i < 3 && <span className="text-muted-foreground/30 mx-0.5">:</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardHome() {
  const { user, auth, currentEventId, currentEvent, setCurrentEventId, setCurrentEvent, setActiveSection, events, setEvents } = useStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  const displayName = user?.firstName || user?.name?.split(" ")[0] || "Utilisateur"

  useEffect(() => {
    if (auth.token) {
      fetchEvents()
    }
  }, [auth.token])

  // Auto-select first event if none selected
  useEffect(() => {
    if (events.length > 0 && !currentEventId) {
      setCurrentEventId(events[0].id)
      setCurrentEvent(events[0])
    }
  }, [events, currentEventId])

  useEffect(() => {
    if (currentEventId && auth.token) {
      fetchStats()
    }
  }, [currentEventId, auth.token])

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/events?organizerId=${user?.id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
    }
  }

  const fetchStats = async () => {
    setIsLoadingStats(true)
    try {
      const res = await fetch(`/api/stats?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const statCards = [
    {
      icon: CalendarDays,
      label: "Total événements",
      value: events.length.toString(),
      color: "text-gold",
      bgColor: "bg-gold/10",
      progress: events.length > 0 ? 100 : 0,
      progressColor: "bg-gold",
    },
    {
      icon: Users,
      label: "Invités confirmés",
      value: stats ? stats.guests.confirmed.toString() : "0",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      progress: stats ? stats.guests.confirmationRate : 0,
      progressColor: "bg-emerald-500",
    },
    {
      icon: Grid3X3,
      label: "Tables organisées",
      value: stats ? stats.tables.total.toString() : "0",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      progress: stats ? stats.tables.occupancyRate : 0,
      progressColor: "bg-amber-500",
    },
    {
      icon: TrendingUp,
      label: "Taux de réponse",
      value: stats ? `${stats.guests.responseRate}%` : "0%",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      progress: stats ? stats.guests.responseRate : 0,
      progressColor: "bg-purple-500",
    },
  ]

  const recentActivities = [
    { icon: CheckCircle2, text: "Nouvel invité confirmé - Sarah M.", time: "Il y a 5 min", color: "text-emerald-500" },
    { icon: CalendarDays, text: "Événement créé - Mariage de Amina", time: "Il y a 30 min", color: "text-gold" },
    { icon: AlertCircle, text: "Rappel : RSVP deadline demain", time: "Il y a 1h", color: "text-amber-500" },
    { icon: Users, text: "3 nouveaux invités ajoutés", time: "Il y a 2h", color: "text-purple-500" },
    { icon: CheckCircle2, text: "Invitation envoyée - Youssef B.", time: "Il y a 3h", color: "text-emerald-500" },
  ]

  const activeEvent = currentEvent || (currentEventId ? events.find((e) => e.id === currentEventId) : null)
  const TypeIcon = activeEvent ? (typeIcons[activeEvent.type || "CUSTOM"] || SettingsIcon) : CalendarDays

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-gold/20 bg-gradient-to-r from-card via-card to-gold/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold">
                  Bonjour, <span className="gradient-gold-text">{displayName}</span> 👋
                </h2>
                <p className="text-muted-foreground mt-1">
                  Voici un aperçu de vos événements aujourd&apos;hui
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setActiveSection("creer-evenement")}
                  className="btn-gold rounded-full text-sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Créer un événement
                </Button>
                <Button
                  onClick={() => setActiveSection("evenements")}
                  variant="outline"
                  className="btn-outline-gold border-gold/30 rounded-full text-sm"
                >
                  Mes événements
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Event Banner Card */}
      {activeEvent && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-gold/30 overflow-hidden card-premium card-premium-glow">
            <div className="relative">
              {/* Background gradient based on event type */}
              <div className="absolute inset-0 gradient-gold opacity-[0.03]" />
              <CardContent className="p-6 relative">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Event info */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center shrink-0">
                      <TypeIcon className="h-7 w-7 text-gold" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading text-xl font-bold">{activeEvent.title}</h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            activeEvent.status === "published"
                              ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
                              : activeEvent.status === "draft"
                              ? "border-amber-500/30 text-amber-500 bg-amber-500/5"
                              : "border-border/50 text-muted-foreground"
                          }`}
                        >
                          {activeEvent.status === "published" ? "Publié" : activeEvent.status === "draft" ? "Brouillon" : activeEvent.status}
                        </Badge>
                        <Badge variant="outline" className="border-gold/30 text-gold bg-gold/10 text-[10px]">
                          {typeLabels[activeEvent.type || "CUSTOM"] || "Événement"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-gold" />
                          {new Date(activeEvent.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        {activeEvent.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gold" />
                            {activeEvent.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Countdown & Quick stats */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <CountdownTimer targetDate={activeEvent.date} />
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => setActiveSection("invites")}
                        variant="outline"
                        size="sm"
                        className="btn-outline-gold border-gold/30 rounded-full text-xs"
                      >
                        <Users className="h-3.5 w-3.5 mr-1" />
                        Invités
                      </Button>
                      <Button
                        onClick={() => setActiveSection("tables")}
                        variant="outline"
                        size="sm"
                        className="btn-outline-gold border-gold/30 rounded-full text-xs"
                      >
                        <Grid3X3 className="h-3.5 w-3.5 mr-1" />
                        Tables
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      )}

      {/* RSVP Progress section */}
      {stats && stats.guests.total > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gold" />
                  Statut RSVP
                </h3>
                <span className="text-xs text-muted-foreground">
                  {stats.guests.total} invité{stats.guests.total !== 1 ? "s" : ""} au total
                </span>
              </div>

              {/* Progress bar showing RSVP breakdown */}
              <div className="space-y-3">
                <div className="flex h-4 rounded-full overflow-hidden bg-muted/30">
                  {stats.guests.confirmed > 0 && (
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(stats.guests.confirmed / stats.guests.total) * 100}%` }}
                    />
                  )}
                  {stats.guests.total - stats.guests.confirmed > 0 && (
                    <div
                      className="bg-amber-500/60 transition-all duration-500"
                      style={{ width: `${((stats.guests.total - stats.guests.confirmed) / stats.guests.total) * 100}%` }}
                    />
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Confirmés</span>
                    <span className="font-semibold">{stats.guests.confirmed}</span>
                    <span className="text-muted-foreground">({stats.guests.confirmationRate}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <span className="text-muted-foreground">En attente</span>
                    <span className="font-semibold">{stats.guests.total - stats.guests.confirmed}</span>
                  </div>
                </div>
              </div>

              {/* Table occupancy */}
              {stats.tables.total > 0 && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Grid3X3 className="h-3.5 w-3.5 text-gold" />
                      Occupation des tables
                    </span>
                    <span className="text-xs font-medium">{stats.tables.occupancyRate}%</span>
                  </div>
                  <Progress value={stats.tables.occupancyRate} className="h-2" />
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                    <span>{stats.tables.totalOccupancy} places occupées</span>
                    <span>{stats.tables.totalCapacity} places totales</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={fadeInUp} transition={{ duration: 0.4 }}>
            <Card className="border-border/50 hover:border-gold/20 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold font-heading">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
                {/* Mini progress indicator */}
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, stat.progress)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${stat.progressColor}`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    {Math.round(stat.progress)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent events */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-heading">Événements récents</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection("evenements")}
                className="text-gold hover:text-gold-light hover:bg-gold/5"
              >
                Voir tout <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Aucun événement pour le moment</p>
                  <Button
                    onClick={() => setActiveSection("creer-evenement")}
                    className="btn-gold rounded-full mt-4 text-sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Créer votre premier événement
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 4).map((event) => {
                    const isSelected = event.id === currentEventId
                    return (
                      <div
                        key={event.id}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? "bg-gold/10 border border-gold/20"
                            : "bg-muted/30 hover:bg-gold/5 border border-transparent hover:border-gold/10"
                        }`}
                        onClick={() => {
                          setCurrentEventId(event.id)
                          setCurrentEvent(event)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isSelected ? "gradient-gold" : "bg-gold/10"
                          }`}>
                            <CalendarDays className={`h-5 w-5 ${isSelected ? "text-black" : "text-gold"}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium flex items-center gap-2">
                              {event.title}
                              {isSelected && (
                                <CircleDot className="h-3 w-3 text-gold" />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            event.status === "published"
                              ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
                              : event.status === "draft"
                              ? "border-amber-500/30 text-amber-500 bg-amber-500/5"
                              : "border-border/50 text-muted-foreground"
                          }`}
                        >
                          {event.status === "published" ? "Publié" : event.status === "draft" ? "Brouillon" : event.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity feed */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Clock className="h-5 w-5 text-gold" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <activity.icon className={`h-4 w-4 mt-0.5 shrink-0 ${activity.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Sparkles, label: "Créer un événement", section: "creer-evenement" as const, color: "text-gold" },
                { icon: Users, label: "Ajouter des invités", section: "invites" as const, color: "text-emerald-500" },
                { icon: Grid3X3, label: "Gérer les tables", section: "tables" as const, color: "text-amber-500" },
                { icon: Mail, label: "Envoyer invitations", section: "invitations" as const, color: "text-purple-500" },
              ].map((action) => (
                <button
                  key={action.section}
                  onClick={() => setActiveSection(action.section)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 hover:bg-gold/5 border border-transparent hover:border-gold/10 transition-all"
                >
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
