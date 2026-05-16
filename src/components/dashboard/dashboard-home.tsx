"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  CalendarDays, Users, Grid3X3, BarChart3,
  Sparkles, ArrowRight, Clock, CheckCircle2,
  AlertCircle, TrendingUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"

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

export function DashboardHome() {
  const { user, auth, currentEventId, setActiveSection, events, setEvents } = useStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  const displayName = user?.firstName || user?.name?.split(" ")[0] || "Utilisateur"

  useEffect(() => {
    if (auth.token) {
      fetchEvents()
    }
  }, [auth.token])

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
    },
    {
      icon: Users,
      label: "Invités confirmés",
      value: stats ? stats.guests.confirmed.toString() : "0",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Grid3X3,
      label: "Tables organisées",
      value: stats ? stats.tables.total.toString() : "0",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: TrendingUp,
      label: "Taux de réponse",
      value: stats ? `${stats.guests.responseRate}%` : "0%",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  const recentActivities = [
    { icon: CheckCircle2, text: "Nouvel invité confirmé - Sarah M.", time: "Il y a 5 min", color: "text-emerald-500" },
    { icon: CalendarDays, text: "Événement créé - Mariage de Amina", time: "Il y a 30 min", color: "text-gold" },
    { icon: AlertCircle, text: "Rappel : RSVP deadline demain", time: "Il y a 1h", color: "text-amber-500" },
    { icon: Users, text: "3 nouveaux invités ajoutés", time: "Il y a 2h", color: "text-purple-500" },
    { icon: CheckCircle2, text: "Invitation envoyée - Youssef B.", time: "Il y a 3h", color: "text-emerald-500" },
  ]

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
                  {events.slice(0, 4).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-gold/5 border border-transparent hover:border-gold/10 transition-all cursor-pointer"
                      onClick={() => {
                        useStore.setState({ currentEventId: event.id, currentEvent: event })
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                          <CalendarDays className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{event.title}</p>
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
                  ))}
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
