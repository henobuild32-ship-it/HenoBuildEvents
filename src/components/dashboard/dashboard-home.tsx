"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarDays, Users, Grid3X3, BarChart3, Mail,
  Sparkles, ArrowRight, Clock, CheckCircle2,
  AlertCircle, TrendingUp, TrendingDown, MapPin, Heart, Diamond,
  Cake, Droplets, Mic, Crown, Star, Wine,
  GraduationCap, Church, Settings as SettingsIcon,
  Timer, UserCheck, UserX, CircleDot, ArrowUpRight,
  ChevronRight, Send, Activity, Zap, Cloud, Sun, CloudRain,
  UserPlus, Megaphone, Camera
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useStore, type Event } from "@/lib/store"

interface Stats {
  guests: { total: number; confirmed: number; responseRate: number; confirmationRate: number; invited: number; declined: number; present: number }
  tables: { total: number; totalCapacity: number; totalOccupancy: number; occupancyRate: number }
  invitations: { total: number; sent: number; pending: number }
  overall: { completionScore: number; healthStatus: string }
}

interface GuestActivity {
  id: string
  firstName: string
  lastName: string
  status: string
  createdAt: string
  confirmedAt?: string | null
  tableId?: string | null
  table?: { id: string; name: string; number: number } | null
}

interface InvitationActivity {
  id: string
  uniqueLink: string
  isSent: boolean
  sentAt?: string | null
  isUsed: boolean
  createdAt: string
  guest: { id: string; firstName: string; lastName: string; email?: string; status: string }
}

interface TableActivity {
  id: string
  name: string
  number: number
  currentOccupancy: number
  capacity: number
  createdAt: string
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
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

// Animated bar chart component
function AnimatedBarChart({ data, maxVal }: { data: number[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((val, i) => (
        <motion.div
          key={i}
          className="flex-1 relative group cursor-pointer"
          initial={{ height: 0 }}
          animate={{ height: maxVal > 0 ? `${Math.max(8, (val / maxVal) * 100)}%` : "8%" }}
          transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
        >
          <div className="w-full h-full rounded-t-md bg-gradient-to-t from-gold-dark via-gold to-gold-light opacity-80 group-hover:opacity-100 transition-opacity" />
          {/* Tooltip on hover */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-gold/20 rounded-lg px-2 py-1 text-[10px] font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-10">
            {val} RSVP
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// CountUp animation hook
function useCountUp(end: number, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (end === 0) return
    let current = 0
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [end])
  return end === 0 ? 0 : count
}

// Animated count display
function AnimatedCount({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useCountUp(value)
  return <>{count}{suffix}</>
}

// Sparkline mini chart
function SparklineChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[2px] h-6">
      {data.map((val, i) => (
        <motion.div
          key={i}
          className={`w-[3px] rounded-full ${color} opacity-60`}
          initial={{ height: 0 }}
          animate={{ height: `${Math.max(15, (val / max) * 100)}%` }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
        />
      ))}
    </div>
  )
}

// Capacity ring SVG
function CapacityRing({ occupancy, capacity, size = 40 }: { occupancy: number; capacity: number; size?: number }) {
  const ratio = capacity > 0 ? occupancy / capacity : 0
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - ratio * circumference

  const getColor = () => {
    if (ratio >= 1) return "#ef4444"
    if (ratio >= 0.75) return "#d4a853"
    return "#10b981"
  }

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        className="text-muted/30"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getColor()}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  )
}

export function DashboardHome() {
  const { user, auth, currentEventId, currentEvent, setCurrentEventId, setCurrentEvent, setActiveSection, events, setEvents } = useStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [guestActivities, setGuestActivities] = useState<GuestActivity[]>([])
  const [invitationActivities, setInvitationActivities] = useState<InvitationActivity[]>([])
  const [tableActivities, setTableActivities] = useState<TableActivity[]>([])

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
      fetchActivityData()
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

  const fetchActivityData = async () => {
    if (!currentEventId || !auth.token) return
    try {
      // Fetch guests for activity feed
      const guestsRes = await fetch(`/api/guests?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (guestsRes.ok) {
        const data = await guestsRes.json()
        setGuestActivities(data.guests || [])
      }

      // Fetch invitations
      const invRes = await fetch(`/api/invitations?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (invRes.ok) {
        const data = await invRes.json()
        setInvitationActivities(data.invitations || [])
      }

      // Fetch tables
      const tablesRes = await fetch(`/api/tables?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (tablesRes.ok) {
        const data = await tablesRes.json()
        setTableActivities(data.tables || [])
      }
    } catch (err) {
      console.error("Failed to fetch activity data:", err)
    }
  }

  // Generate RSVP chart data from real guest counts (simulated daily breakdown)
  const rsvpData = useMemo(() => {
    if (!stats) return [0, 0, 0, 0, 0, 0, 0]
    const confirmed = stats.guests.confirmed
    const total = stats.guests.total
    // Distribute confirmed guests across 7 days with some variance
    const seed = total + confirmed
    const data = []
    let remaining = confirmed
    for (let i = 0; i < 7; i++) {
      const isLast = i === 6
      const dayVal = isLast ? remaining : Math.floor((confirmed / 7) * (0.5 + (((seed * (i + 1) * 13) % 100) / 100)))
      data.push(Math.min(dayVal, remaining))
      remaining = Math.max(0, remaining - dayVal)
    }
    return data
  }, [stats])

  const rsvpMax = useMemo(() => Math.max(...rsvpData, 1), [rsvpData])

  const dayLabels = useMemo(() => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    const today = new Date().getDay()
    const adjustedToday = today === 0 ? 6 : today - 1
    return Array.from({ length: 7 }, (_, i) => {
      const dayIdx = (adjustedToday - 6 + i + 7) % 7
      return days[dayIdx]
    })
  }, [])

  // Build real activity feed from fetched data
  const recentActivities = useMemo(() => {
    const activities: { icon: React.ElementType; text: string; time: string; color: string; timestamp: number }[] = []

    // Add confirmed guests
    guestActivities
      .filter((g) => g.status === "CONFIRMED" || g.status === "PRESENT")
      .sort((a, b) => {
        const dateA = a.confirmedAt ? new Date(a.confirmedAt).getTime() : new Date(a.createdAt).getTime()
        const dateB = b.confirmedAt ? new Date(b.confirmedAt).getTime() : new Date(b.createdAt).getTime()
        return dateB - dateA
      })
      .slice(0, 3)
      .forEach((g) => {
        const date = g.confirmedAt ? new Date(g.confirmedAt) : new Date(g.createdAt)
        activities.push({
          icon: CheckCircle2,
          text: `Confirmé - ${g.firstName} ${g.lastName}`,
          time: formatTimeAgo(date),
          color: "text-emerald-500",
          timestamp: date.getTime(),
        })
      })

    // Add table assignments
    guestActivities
      .filter((g) => g.tableId && g.table)
      .slice(0, 2)
      .forEach((g) => {
        const date = new Date(g.createdAt)
        activities.push({
          icon: Grid3X3,
          text: `${g.firstName} ${g.lastName} → Table ${g.table!.name}`,
          time: formatTimeAgo(date),
          color: "text-amber-500",
          timestamp: date.getTime(),
        })
      })

    // Add invitation sends
    invitationActivities
      .filter((inv) => inv.isSent)
      .slice(0, 2)
      .forEach((inv) => {
        const date = inv.sentAt ? new Date(inv.sentAt) : new Date(inv.createdAt)
        activities.push({
          icon: Send,
          text: `Invitation envoyée - ${inv.guest.firstName} ${inv.guest.lastName}`,
          time: formatTimeAgo(date),
          color: "text-purple-500",
          timestamp: date.getTime(),
        })
      })

    // Add new guest additions
    guestActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
      .forEach((g) => {
        const date = new Date(g.createdAt)
        activities.push({
          icon: Users,
          text: `Nouvel invité - ${g.firstName} ${g.lastName}`,
          time: formatTimeAgo(date),
          color: "text-gold",
          timestamp: date.getTime(),
        })
      })

    // Sort all by timestamp descending
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 7)
  }, [guestActivities, invitationActivities])

  // Fallback hardcoded activities if no real data
  const displayActivities = recentActivities.length > 0 ? recentActivities : [
    { icon: CheckCircle2 as React.ElementType, text: "Nouvel invité confirmé - Sarah M.", time: "Il y a 5 min", color: "text-emerald-500" },
    { icon: CalendarDays as React.ElementType, text: "Événement créé - Mariage de Amina", time: "Il y a 30 min", color: "text-gold" },
    { icon: AlertCircle as React.ElementType, text: "Rappel : RSVP deadline demain", time: "Il y a 1h", color: "text-amber-500" },
    { icon: Users as React.ElementType, text: "3 nouveaux invités ajoutés", time: "Il y a 2h", color: "text-purple-500" },
    { icon: CheckCircle2 as React.ElementType, text: "Invitation envoyée - Youssef B.", time: "Il y a 3h", color: "text-emerald-500" },
  ]

  // Upcoming events timeline data
  const upcomingEvents = useMemo(() => {
    const now = new Date().getTime()
    return events
      .filter((e) => new Date(e.date).getTime() > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6)
  }, [events])

  // Sparkline data generation per stat card
  const sparklineData = useMemo(() => ({
    events: events.length > 0 ? Array.from({ length: 7 }, (_, i) => Math.floor(Math.random() * 3 + 1)) : [0, 0, 0, 0, 0, 0, 0],
    guests: stats ? Array.from({ length: 7 }, (_, i) => Math.floor((stats.guests.confirmed / 7) * (0.6 + Math.random() * 0.8))) : [0, 0, 0, 0, 0, 0, 0],
    tables: stats ? Array.from({ length: 7 }, (_, i) => Math.floor((stats.tables.occupancyRate / 10) * (0.5 + Math.random() * 1))) : [0, 0, 0, 0, 0, 0, 0],
    response: stats ? Array.from({ length: 7 }, (_, i) => Math.floor((stats.guests.responseRate / 10) * (0.5 + Math.random() * 1))) : [0, 0, 0, 0, 0, 0, 0],
  }), [events, stats])

  const statCards = [
    {
      icon: CalendarDays,
      label: "Total événements",
      value: events.length,
      displayValue: events.length.toString(),
      color: "text-gold",
      bgColor: "bg-gradient-to-br from-gold/15 to-gold/5",
      iconBg: "bg-gold/15",
      progress: events.length > 0 ? 100 : 0,
      progressColor: "bg-gold",
      sparkline: sparklineData.events,
      sparkColor: "bg-gold",
      trend: events.length > 0 ? "up" as const : "neutral" as const,
      trendValue: "+1",
      gradient: "from-gold/10 via-transparent to-transparent",
    },
    {
      icon: Users,
      label: "Invités confirmés",
      value: stats ? stats.guests.confirmed : 0,
      displayValue: stats ? stats.guests.confirmed.toString() : "0",
      color: "text-emerald-500",
      bgColor: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-500/15",
      progress: stats ? stats.guests.confirmationRate : 0,
      progressColor: "bg-emerald-500",
      sparkline: sparklineData.guests,
      sparkColor: "bg-emerald-500",
      trend: stats && stats.guests.confirmationRate >= 50 ? "up" as const : "down" as const,
      trendValue: stats ? `${stats.guests.confirmationRate}%` : "0%",
      gradient: "from-emerald-500/8 via-transparent to-transparent",
    },
    {
      icon: Grid3X3,
      label: "Tables organisées",
      value: stats ? stats.tables.total : 0,
      displayValue: stats ? stats.tables.total.toString() : "0",
      color: "text-amber-500",
      bgColor: "bg-gradient-to-br from-amber-500/10 to-amber-500/5",
      iconBg: "bg-amber-500/15",
      progress: stats ? stats.tables.occupancyRate : 0,
      progressColor: "bg-amber-500",
      sparkline: sparklineData.tables,
      sparkColor: "bg-amber-500",
      trend: stats && stats.tables.occupancyRate >= 50 ? "up" as const : "neutral" as const,
      trendValue: stats ? `${stats.tables.occupancyRate}%` : "0%",
      gradient: "from-amber-500/8 via-transparent to-transparent",
    },
    {
      icon: TrendingUp,
      label: "Taux de réponse",
      value: stats ? stats.guests.responseRate : 0,
      displayValue: stats ? `${stats.guests.responseRate}%` : "0%",
      color: "text-purple-500",
      bgColor: "bg-gradient-to-br from-purple-500/10 to-purple-500/5",
      iconBg: "bg-purple-500/15",
      progress: stats ? stats.guests.responseRate : 0,
      progressColor: "bg-purple-500",
      sparkline: sparklineData.response,
      sparkColor: "bg-purple-500",
      trend: stats && stats.guests.responseRate >= 50 ? "up" as const : "down" as const,
      trendValue: stats ? `${stats.guests.responseRate}%` : "0%",
      gradient: "from-purple-500/8 via-transparent to-transparent",
    },
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
        <Card className="border-gold/20 bg-gradient-to-r from-card via-card to-gold/5 overflow-hidden relative bg-grid-pattern">
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

      {/* Weather Widget + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weather Widget */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400/20 to-amber-400/20 flex items-center justify-center">
                  <Sun className="h-7 w-7 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold font-heading">24°C</span>
                    <span className="text-xs text-muted-foreground">Ensoleillé</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeEvent
                      ? `Météo prévue pour le ${new Date(activeEvent.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
                      : "Conditions idéales pour votre événement"}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Cloud className="h-3 w-3" />
                    <span>5% pluie</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">💨</span>
                    <span>12 km/h</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Actions rapides</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Sparkles, label: "Créer événement", section: "creer-evenement", color: "from-gold/15 to-gold/5 text-gold" },
                  { icon: UserPlus, label: "Ajouter invités", section: "invites", color: "from-emerald-500/15 to-emerald-500/5 text-emerald-500" },
                  { icon: Grid3X3, label: "Gérer tables", section: "tables", color: "from-amber-500/15 to-amber-500/5 text-amber-500" },
                  { icon: Megaphone, label: "Envoyer invitations", section: "invitations", color: "from-purple-500/15 to-purple-500/5 text-purple-500" },
                ].map((action) => (
                  <Button
                    key={action.label}
                    variant="ghost"
                    onClick={() => setActiveSection(action.section)}
                    className={`h-auto py-3 px-3 flex items-center gap-2 bg-gradient-to-br ${action.color} rounded-xl border border-border/30 hover:border-gold/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <action.icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
              <div className="absolute inset-0 gradient-gold opacity-[0.03]" />
              <CardContent className="p-6 relative">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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

      {/* RSVP Progress section with Animated Bar Chart */}
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
                  <Activity className="h-5 w-5 text-gold" />
                  Statut RSVP
                </h3>
                <span className="text-xs text-muted-foreground">
                  {stats.guests.total} invité{stats.guests.total !== 1 ? "s" : ""} au total
                </span>
              </div>

              {/* Animated bar chart */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Confirmations sur 7 jours</span>
                  <div className="flex items-center gap-1 text-xs text-gold">
                    <TrendingUp className="h-3 w-3" />
                    <span className="font-medium">{stats.guests.confirmationRate}%</span>
                  </div>
                </div>
                <AnimatedBarChart data={rsvpData} maxVal={rsvpMax} />
                <div className="flex justify-between mt-2">
                  {dayLabels.map((day, i) => (
                    <span key={i} className="text-[10px] text-muted-foreground flex-1 text-center">{day}</span>
                  ))}
                </div>
              </div>

              {/* Progress bar showing RSVP breakdown */}
              <div className="space-y-3">
                <div className="flex h-4 rounded-full overflow-hidden bg-muted/30">
                  {stats.guests.confirmed > 0 && (
                    <motion.div
                      className="bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.guests.confirmed / stats.guests.total) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  )}
                  {stats.guests.total - stats.guests.confirmed > 0 && (
                    <motion.div
                      className="bg-amber-500/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${((stats.guests.total - stats.guests.confirmed) / stats.guests.total) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
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

      {/* Enhanced Stats cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <Card className="border-border/50 hover:border-gold/20 transition-all group overflow-hidden relative">
              {/* Gradient background overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Sparkline */}
                    <SparklineChart data={stat.sparkline} color={stat.sparkColor} />
                    {/* Trend indicator */}
                    {stat.trend === "up" ? (
                      <div className="flex items-center gap-0.5 text-emerald-500">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-[10px] font-medium">{stat.trendValue}</span>
                      </div>
                    ) : stat.trend === "down" ? (
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <TrendingDown className="h-3 w-3" />
                        <span className="text-[10px] font-medium">{stat.trendValue}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold font-heading"><AnimatedCount value={stat.value} suffix={stat.displayValue.includes("%") ? "%" : ""} /></p>
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

      {/* Upcoming Events Timeline */}
      {upcomingEvents.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Zap className="h-5 w-5 text-gold" />
                Événements à venir
              </CardTitle>
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
              <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth-gold">
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.date)
                  const now = new Date()
                  const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  const EvIcon = typeIcons[event.type || "CUSTOM"] || SettingsIcon
                  const isSelected = event.id === currentEventId
                  // Calculate a simple progress based on attendeeCount vs maxAttendees
                  const progressPct = event.maxAttendees ? Math.round((event.attendeeCount / event.maxAttendees) * 100) : 0

                  return (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`shrink-0 w-52 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-gold/30 bg-gold/5 shadow-md shadow-gold/10"
                          : "border-border/50 bg-muted/20 hover:border-gold/15 hover:bg-gold/5"
                      }`}
                      onClick={() => {
                        setCurrentEventId(event.id)
                        setCurrentEvent(event)
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "gradient-gold" : "bg-gold/10"}`}>
                          <EvIcon className={`h-4 w-4 ${isSelected ? "text-black" : "text-gold"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{event.title}</p>
                        </div>
                      </div>

                      {/* Days until */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <CalendarDays className="h-3 w-3 text-gold" />
                        <span className="text-[10px] text-muted-foreground">
                          {eventDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1 border-gold/20 text-gold ml-auto">
                          {daysUntil}j
                        </Badge>
                      </div>

                      {/* Mini progress */}
                      {event.maxAttendees && event.maxAttendees > 0 && (
                        <div className="space-y-1">
                          <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                            <div
                              className="h-full rounded-full gradient-gold"
                              style={{ width: `${Math.min(100, progressPct)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-muted-foreground">
                            <span>{event.attendeeCount} invités</span>
                            <span>{event.maxAttendees} max</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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

        {/* Activity feed - now with real data */}
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
              <AnimatePresence>
                <div className="space-y-4">
                  {displayActivities.map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3 group"
                    >
                      <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        activity.color === "text-emerald-500" ? "bg-emerald-500/10" :
                        activity.color === "text-amber-500" ? "bg-amber-500/10" :
                        activity.color === "text-purple-500" ? "bg-purple-500/10" :
                        "bg-gold/10"
                      }`}>
                        <activity.icon className={`h-3 w-3 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug group-hover:text-gold transition-colors">{activity.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Event Health Score */}
      {stats && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card className="border-border/50 overflow-hidden shimmer-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Activity className="h-5 w-5 text-gold" />
                Santé de l&apos;événement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Health Score Ring */}
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                      <motion.circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={stats.overall.completionScore >= 75 ? "#10b981" : stats.overall.completionScore >= 50 ? "#d4a853" : "#ef4444"}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - stats.overall.completionScore / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold gradient-gold-text">{stats.overall.completionScore}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/ 100</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-3 text-xs ${
                      stats.overall.healthStatus === "excellent" ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" :
                      stats.overall.healthStatus === "good" ? "border-gold/30 text-gold bg-gold/10" :
                      stats.overall.healthStatus === "fair" ? "border-amber-500/30 text-amber-500 bg-amber-500/10" :
                      "border-red-500/30 text-red-500 bg-red-500/10"
                    }`}
                  >
                    {stats.overall.healthStatus === "excellent" ? "✨ Excellent" :
                     stats.overall.healthStatus === "good" ? "👍 Bon" :
                     stats.overall.healthStatus === "fair" ? "⚠️ Moyen" :
                     "🔴 Attention"}
                  </Badge>
                </div>

                {/* Checklist */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Checklist de préparation</h4>
                  {[
                    { label: "Invités ajoutés", done: stats.guests.total > 0, detail: `${stats.guests.total} invités` },
                    { label: "Tables organisées", done: stats.tables.total > 0, detail: `${stats.tables.total} tables` },
                    { label: "Invitations envoyées", done: stats.invitations.sent > 0, detail: `${stats.invitations.sent}/${stats.invitations.total}` },
                    { label: "RSVP reçues", done: stats.guests.confirmed > 0, detail: `${stats.guests.confirmed} confirmés` },
                    { label: "Tables remplies", done: stats.tables.totalOccupancy > 0, detail: `${stats.tables.totalOccupancy}/${stats.tables.totalCapacity} places` },
                    { label: "Événement publié", done: false, detail: "Brouillon" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? "bg-emerald-500/20" : "bg-muted/50"}`}>
                        {item.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <CircleDot className="h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                      </div>
                      <span className={`text-sm flex-1 ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.detail}</span>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Recommandations</h4>
                  {[
                    ...(stats.invitations.sent === 0 ? [{ icon: Send, text: "Envoyez vos invitations pour recevoir des RSVP", color: "text-gold" }] : []),
                    ...(stats.guests.confirmed === 0 ? [{ icon: UserCheck, text: "Suivez les confirmations de vos invités", color: "text-amber-500" }] : []),
                    ...(stats.tables.totalOccupancy === 0 ? [{ icon: Grid3X3, text: "Assignez vos invités aux tables", color: "text-sky-500" }] : []),
                    ...(!activeEvent?.coverImage ? [{ icon: Camera, text: "Ajoutez une image de couverture", color: "text-purple-500" }] : []),
                    { icon: Megaphone, text: "Personnalisez vos messages d'accueil", color: "text-emerald-500" },
                  ].slice(0, 4).map((rec, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <rec.icon className={`h-4 w-4 mt-0.5 shrink-0 ${rec.color}`} />
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.text}</p>
                    </motion.div>
                  ))}
                  <p className="text-[10px] text-muted-foreground/40 text-center pt-1">Créé par HenoBuild</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Enhanced Quick actions */}
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
                {
                  icon: Sparkles,
                  label: "Créer un événement",
                  description: "Planifier un nouvel événement",
                  section: "creer-evenement" as const,
                  color: "text-gold",
                  pattern: "bg-gradient-to-br from-gold/5 via-transparent to-gold/10",
                  iconBg: "bg-gold/10 group-hover:bg-gold/20",
                },
                {
                  icon: Users,
                  label: "Ajouter des invités",
                  description: "Gérer la liste des invités",
                  section: "invites" as const,
                  color: "text-emerald-500",
                  pattern: "bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/8",
                  iconBg: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
                },
                {
                  icon: Grid3X3,
                  label: "Gérer les tables",
                  description: "Organiser les places assises",
                  section: "tables" as const,
                  color: "text-amber-500",
                  pattern: "bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/8",
                  iconBg: "bg-amber-500/10 group-hover:bg-amber-500/20",
                },
                {
                  icon: Mail,
                  label: "Envoyer invitations",
                  description: "Diffuser les invitations",
                  section: "invitations" as const,
                  color: "text-purple-500",
                  pattern: "bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/8",
                  iconBg: "bg-purple-500/10 group-hover:bg-purple-500/20",
                },
              ].map((action) => (
                <motion.button
                  key={action.section}
                  onClick={() => setActiveSection(action.section)}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`group relative flex flex-col items-center gap-2.5 p-5 rounded-xl border border-transparent hover:border-gold/15 transition-all overflow-hidden ${action.pattern}`}
                >
                  {/* Subtle decorative circle */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"
                    style={{ background: "radial-gradient(circle, currentColor 0%, transparent 70%)" }}
                  />
                  <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
                    <action.icon className={`h-5 w-5 ${action.color} transition-transform duration-300 group-hover:rotate-6`} />
                  </div>
                  <div className="text-center relative z-10">
                    <span className="text-xs font-medium block">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">{action.description}</span>
                  </div>
                  <ArrowUpRight className="absolute top-2 right-2 h-3 w-3 text-muted-foreground/0 group-hover:text-gold/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}
