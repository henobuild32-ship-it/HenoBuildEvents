"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, CheckCircle2, Clock, XCircle, Send, Mail, Eye,
  ChevronDown, Download, Activity, BarChart3, TrendingUp,
  Sparkles, ArrowRight, CircleDot, QrCode, MessageCircle,
  UserCheck, AlertCircle, CalendarDays, Grid3X3
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DATA = {
  totalGuests: 15,
  confirmed: 4,
  pending: 7,
  declined: 2,
  notSent: 2,
  checkedIn: 1,
  rsvpTimeline: [0, 1, 2, 3, 3, 4, 4],
  rsvpLabels: ["Lun 24", "Mar 25", "Mer 26", "Jeu 27", "Ven 28", "Sam 01", "Dim 02"],
  tables: [
    { name: "Table A", capacity: 10, filled: 5, guests: ["Amina", "Youssef", "Leila", "Hassan", "Nadia"] },
    { name: "Table B", capacity: 10, filled: 3, guests: ["Fatima", "Omar", "Rachid"] },
    { name: "Table C", capacity: 10, filled: 4, guests: ["Sarah", "Samira", "Mehdi", "Dounia"] },
    { name: "Table VIP", capacity: 6, filled: 3, guests: ["Karim", "Khaled", "Meriem"] },
  ],
  invitations: { sent: 13, opened: 10, confirmed: 4, declined: 2 },
  activities: [
    { icon: CheckCircle2, text: "Amina a confirmé sa présence", time: "Il y a 5 min", color: "text-emerald-500" },
    { icon: QrCode, text: "Fatima vient de faire le check-in", time: "Il y a 15 min", color: "text-gold" },
    { icon: MessageCircle, text: "Omar a envoyé un message", time: "Il y a 30 min", color: "text-purple-500" },
    { icon: Mail, text: "Invitation envoyée à Khaled", time: "Il y a 1h", color: "text-sky-500" },
    { icon: XCircle, text: "Samira a décliné l'invitation", time: "Il y a 2h", color: "text-red-500" },
    { icon: UserCheck, text: "Karim a confirmé sa présence", time: "Il y a 3h", color: "text-emerald-500" },
  ],
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

// ─── Animated Counter Hook ────────────────────────────────────────────────────

function useCountUp(end: number, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (end === 0) return
    let current = 0
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      current += increment
      if (current >= end) { setCount(end); clearInterval(timer) }
      else { setCount(Math.floor(current)) }
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration])
  return end === 0 ? 0 : count
}

function AnimatedCount({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useCountUp(value)
  return <>{count}{suffix}</>
}

// ─── Animated Ring SVG ────────────────────────────────────────────────────────

function AnimatedRing({ value, color, size = 56 }: { value: number; color: string; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/20" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  )
}

// ─── RSVP Timeline SVG Chart ──────────────────────────────────────────────────

function RSVPTimelineChart() {
  const data = MOCK_DATA.rsvpTimeline
  const labels = MOCK_DATA.rsvpLabels
  const maxVal = Math.max(...data, 1)
  const width = 320
  const height = 160
  const padding = { top: 20, right: 20, bottom: 35, left: 30 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const points = data.map((val, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - (val / maxVal) * chartH,
  }))

  const linePath = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ")
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a853" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#d4a853" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + chartH - ratio * chartH
        return <line key={ratio} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth={1} />
      })}

      {/* Y-axis labels */}
      {[0, Math.ceil(maxVal / 2), maxVal].map((val, i) => {
        const y = padding.top + chartH - (val / maxVal) * chartH
        return (
          <text key={i} x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[9px]">{val}</text>
        )
      })}

      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill="url(#areaGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />

      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="#d4a853"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Dot markers */}
      {points.map((p, i) => (
        <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.3 + i * 0.12 }}>
          <circle cx={p.x} cy={p.y} r={5} fill="#0a0a0a" stroke="#d4a853" strokeWidth={2.5} />
          <circle cx={p.x} cy={p.y} r={2.5} fill="#d4a853" />
          {/* Tooltip */}
          <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-gold text-[9px] font-semibold">{data[i]}</text>
        </motion.g>
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text key={`label-${i}`} x={p.x} y={height - 5} textAnchor="middle" className="fill-muted-foreground text-[8px]">{labels[i]}</text>
      ))}
    </svg>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart() {
  const total = MOCK_DATA.totalGuests
  const segments = [
    { label: "Confirmés", count: MOCK_DATA.confirmed, color: "#10b981" },
    { label: "En attente", count: MOCK_DATA.pending, color: "#d4a853" },
    { label: "Refusés", count: MOCK_DATA.declined, color: "#ef4444" },
    { label: "Non envoyés", count: MOCK_DATA.notSent, color: "#6b7280" },
  ]

  const size = 180
  const strokeWidth = 28
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let currentOffset = 0
  const arcs = segments.map((seg) => {
    const ratio = seg.count / total
    const dashLength = ratio * circumference
    const arc = { ...seg, dashLength, offset: currentOffset }
    currentOffset += dashLength
    return arc
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/15" />

          {/* Segments */}
          {arcs.map((arc, i) => (
            <motion.circle
              key={arc.label}
              cx={center} cy={center} r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15, ease: "easeOut" }}
            />
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-heading gradient-gold-text">
            <AnimatedCount value={total} />
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Invités</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-[260px]">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-muted-foreground flex-1">{seg.label}</span>
            <span className="text-xs font-semibold">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Table Occupancy Heatmap ──────────────────────────────────────────────────

function TableHeatmap() {
  const tables = MOCK_DATA.tables
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)

  const getColor = (ratio: number) => {
    if (ratio >= 0.9) return { bg: "bg-red-500/15", border: "border-red-500/30", text: "text-red-500", bar: "bg-red-500" }
    if (ratio >= 0.5) return { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-500", bar: "bg-amber-500" }
    return { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-500", bar: "bg-emerald-500" }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tables.map((table, i) => {
        const ratio = table.filled / table.capacity
        const colors = getColor(ratio)
        const isHovered = hoveredTable === table.name

        return (
          <motion.div
            key={table.name}
            variants={itemVariants}
            onMouseEnter={() => setHoveredTable(table.name)}
            onMouseLeave={() => setHoveredTable(null)}
            className={`relative p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-300 cursor-pointer hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{table.name}</span>
              <Badge variant="outline" className={`text-[10px] ${colors.border} ${colors.text}`}>
                {table.filled}/{table.capacity}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden mb-2">
              <motion.div
                className={`h-full rounded-full ${colors.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${ratio * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
              />
            </div>

            {/* Guest names on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1 pt-1">
                    {table.guests.map((guest) => (
                      <span key={guest} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                        {guest}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Invitation Funnel ────────────────────────────────────────────────────────

function InvitationFunnel() {
  const stages = [
    { label: "Envoyées", value: MOCK_DATA.invitations.sent, icon: Send, color: "bg-sky-500" },
    { label: "Ouvertes", value: MOCK_DATA.invitations.opened, icon: Eye, color: "bg-amber-500" },
    { label: "Confirmées", value: MOCK_DATA.invitations.confirmed, icon: CheckCircle2, color: "bg-emerald-500" },
    { label: "Refusées", value: MOCK_DATA.invitations.declined, icon: XCircle, color: "bg-red-500" },
  ]

  const maxValue = stages[0].value

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const widthPct = (stage.value / maxValue) * 100
        const conversionRate = i > 0 ? Math.round((stage.value / stages[i - 1].value) * 100) : 100

        return (
          <motion.div key={stage.label} variants={itemVariants} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md ${stage.color} flex items-center justify-center`}>
                  <stage.icon className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium">{stage.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stage.value}</span>
                {i > 0 && (
                  <Badge variant="outline" className="text-[9px] border-gold/20 text-gold bg-gold/5">
                    {conversionRate}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Funnel bar */}
            <div className="h-3 rounded-full bg-muted/20 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${stage.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.15, ease: "easeOut" }}
              />
            </div>

            {/* Conversion arrow between stages */}
            {i < stages.length - 1 && (
              <div className="flex items-center justify-center py-0.5">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                >
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </motion.div>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed() {
  const activities = MOCK_DATA.activities

  return (
    <div className="max-h-80 overflow-y-auto scroll-smooth-gold pr-1">
      <div className="space-y-1">
        {activities.map((activity, i) => {
          const Icon = activity.icon
          return (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gold/5 transition-colors group"
            >
              <div className={`w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 ${activity.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{activity.text}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-6 animate-float">
        <BarChart3 className="h-10 w-10 text-gold" />
      </div>
      <h3 className="text-xl font-heading font-bold mb-2">Aucun événement sélectionné</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Sélectionnez un événement pour voir ses statistiques et analyses en temps réel.
      </p>
    </motion.div>
  )
}

// ─── Main Analytics Section ───────────────────────────────────────────────────

export function AnalyticsSection() {
  const { currentEvent, currentEventId } = useStore()
  const activeEvent = currentEvent

  if (!activeEvent && !currentEventId) {
    return <EmptyState />
  }

  const confirmationRate = Math.round((MOCK_DATA.confirmed / MOCK_DATA.totalGuests) * 100)
  const checkInRate = Math.round((MOCK_DATA.checkedIn / MOCK_DATA.totalGuests) * 100)
  const rsvpRate = Math.round(((MOCK_DATA.confirmed + MOCK_DATA.declined) / MOCK_DATA.totalGuests) * 100)

  const overviewStats = [
    {
      icon: Users,
      label: "Total Invités",
      value: MOCK_DATA.totalGuests,
      suffix: "",
      color: "text-gold",
      iconBg: "bg-gold/10",
      gradient: "from-gold/10 via-gold/5 to-transparent",
    },
    {
      icon: CheckCircle2,
      label: "Taux de Confirmation",
      value: confirmationRate,
      suffix: "%",
      color: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      gradient: "from-emerald-500/8 via-emerald-500/4 to-transparent",
      ring: true,
      ringColor: "#10b981",
    },
    {
      icon: QrCode,
      label: "Check-in Rate",
      value: checkInRate,
      suffix: "%",
      color: "text-sky-500",
      iconBg: "bg-sky-500/10",
      gradient: "from-sky-500/8 via-sky-500/4 to-transparent",
      ring: true,
      ringColor: "#0ea5e9",
    },
    {
      icon: Clock,
      label: "Taux de Réponse RSVP",
      value: rsvpRate,
      suffix: "%",
      color: "text-amber-500",
      iconBg: "bg-amber-500/10",
      gradient: "from-amber-500/8 via-amber-500/4 to-transparent",
      ring: true,
      ringColor: "#f59e0b",
    },
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* ─── Section Header ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-gold" />
            Statistiques & Analyses
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeEvent?.title || "Mariage de Sarah & Karim"} — Aperçu en temps réel
          </p>
        </div>
        <Badge variant="outline" className="border-gold/20 text-gold bg-gold/5 text-xs">
          <Activity className="h-3 w-3 mr-1" />
          En direct
        </Badge>
      </motion.div>

      {/* ─── Overview Stats Cards (4) ──────────────────────────── */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="border-gold/10 card-hover-lift shimmer-card overflow-hidden relative group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.ring ? (
                    <div className="relative">
                      <AnimatedRing value={stat.value} color={stat.ringColor!} size={52} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold" style={{ color: stat.ringColor }}>
                          <AnimatedCount value={stat.value} suffix="%" />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <TrendingUp className="h-4 w-4 text-emerald-500/60" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading">
                    {stat.ring ? (
                      <AnimatedCount value={stat.value} suffix={stat.suffix} />
                    ) : (
                      <AnimatedCount value={stat.value} />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Middle Row: RSVP Timeline + Donut Chart ───────────── */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* RSVP Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="border-gold/10 card-hover-lift shimmer-card overflow-hidden h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold" />
                RSVP — Réponses sur 7 jours
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <RSVPTimelineChart />
            </CardContent>
          </Card>
        </motion.div>

        {/* Guest Distribution Donut */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-gold/10 card-hover-lift shimmer-card overflow-hidden h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-gold" />
                Répartition des invités
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex items-center justify-center">
              <DonutChart />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ─── Table Occupancy Heatmap ───────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="border-gold/10 card-hover-lift shimmer-card overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-gold" />
                Occupation des Tables
              </CardTitle>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Libre</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Moitié</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Plein</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <TableHeatmap />
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Bottom Row: Invitation Funnel + Activity Feed ─────── */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Invitation Funnel */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-gold/10 card-hover-lift shimmer-card overflow-hidden h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" />
                Performance des Invitations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InvitationFunnel />
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="border-gold/10 card-hover-lift shimmer-card overflow-hidden h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gold" />
                  Activité Récente
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-gold hover:text-gold-light hover:bg-gold/5 text-xs h-7 px-2">
                  Voir tout <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ActivityFeed />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ─── Export Report Button ──────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <Button
          className="btn-gold rounded-xl px-6 py-3 text-sm"
          onClick={() => {
            // Mock export functionality
            const toast = document.createElement("div")
            toast.className = "fixed bottom-6 right-6 z-50 bg-card border border-gold/20 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 text-sm animate-slide-up"
            toast.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Rapport en cours de génération...`
            document.body.appendChild(toast)
            setTimeout(() => toast.remove(), 3000)
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter le Rapport PDF
        </Button>

        {/* HenoBuild Branding */}
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md gradient-gold flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-black" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium">
            Created by HenoBuild
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
