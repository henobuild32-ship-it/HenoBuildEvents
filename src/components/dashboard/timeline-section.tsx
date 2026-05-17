"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarDays, Plus, Clock, MapPin, Pencil, Trash2,
  Sparkles, Play, CheckCircle2, Timer, ChevronRight, X, Loader2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────
interface TimelineItem {
  id: string
  title: string
  startTime: string
  duration: number
  description: string
  location: string
  color: string
  status: "a_venir" | "en_cours" | "termine"
}

// ─── Mock Data ────────────────────────────────────────────────────
const MOCK_TIMELINE: TimelineItem[] = [
  {
    id: "1",
    title: "Préparation & Accueil",
    startTime: "09:00",
    duration: 60,
    description: "Accueil des invités et préparation finale de la salle",
    location: "Salle de préparation",
    color: "#d4a853",
    status: "a_venir",
  },
  {
    id: "2",
    title: "Cérémonie religieuse",
    startTime: "10:30",
    duration: 90,
    description: "Cérémonie de mariage à l'église avec échange des vœux",
    location: "Église Saint-Augustin",
    color: "#e879f9",
    status: "a_venir",
  },
  {
    id: "3",
    title: "Photos de groupe",
    startTime: "12:00",
    duration: 60,
    description: "Séance photo avec les familles et les invités",
    location: "Jardin du Château",
    color: "#34d399",
    status: "a_venir",
  },
  {
    id: "4",
    title: "Cocktail d'accueil",
    startTime: "13:30",
    duration: 90,
    description: "Cocktail dinatoire avec amuse-bouches et champagne",
    location: "Terrasse panoramique",
    color: "#f59e0b",
    status: "a_venir",
  },
  {
    id: "5",
    title: "Déjeuner",
    startTime: "15:00",
    duration: 120,
    description: "Repas gastronomique avec menu à thème marocain",
    location: "Grande Salle",
    color: "#60a5fa",
    status: "a_venir",
  },
  {
    id: "6",
    title: "Discours & Toasts",
    startTime: "17:30",
    duration: 45,
    description: "Discours des témoins et toasts en l'honneur des mariés",
    location: "Grande Salle",
    color: "#a78bfa",
    status: "a_venir",
  },
  {
    id: "7",
    title: "Ouverture de la piste de danse",
    startTime: "18:30",
    duration: 180,
    description: "Soirée dansante avec DJ et animations",
    location: "Salle de réception",
    color: "#fb7185",
    status: "a_venir",
  },
  {
    id: "8",
    title: "Feu d'artifice & Clôture",
    startTime: "22:00",
    duration: 30,
    description: "Spectacle de feu d'artifice grandiose pour clôturer la soirée",
    location: "Jardin principal",
    color: "#fbbf24",
    status: "a_venir",
  },
]

// ─── Animation variants ──────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, "0")}`
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function endTime(startTime: string, duration: number): string {
  return minutesToTime(timeToMinutes(startTime) + duration)
}

function statusLabel(status: TimelineItem["status"]): string {
  switch (status) {
    case "en_cours": return "En cours"
    case "termine": return "Terminé"
    default: return "À venir"
  }
}

function statusColor(status: TimelineItem["status"]): string {
  switch (status) {
    case "en_cours": return "border-gold/40 text-gold bg-gold/10"
    case "termine": return "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
    default: return "border-muted-foreground/20 text-muted-foreground bg-muted/10"
  }
}

function statusIcon(status: TimelineItem["status"]) {
  switch (status) {
    case "en_cours": return <Play className="h-2.5 w-2.5 mr-0.5" />
    case "termine": return <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
    default: return <Clock className="h-2.5 w-2.5 mr-0.5" />
  }
}

// ─── Color options for the timeline item color picker ─────────────
const COLOR_OPTIONS = [
  { value: "#d4a853", label: "Or" },
  { value: "#e879f9", label: "Violet" },
  { value: "#34d399", label: "Émeraude" },
  { value: "#f59e0b", label: "Ambre" },
  { value: "#60a5fa", label: "Bleu" },
  { value: "#a78bfa", label: "Lavande" },
  { value: "#fb7185", label: "Rose" },
  { value: "#fbbf24", label: "Jaune" },
]

// ─── Day Overview Strip ───────────────────────────────────────────
function DayOverviewStrip({ items }: { items: TimelineItem[] }) {
  const startRange = 8 * 60  // 08:00
  const endRange = 26 * 60   // 02:00 next day = 26:00
  const totalRange = endRange - startRange

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const nowPct = ((currentMinutes - startRange) / totalRange) * 100

  const timeMarkers = []
  for (let h = 8; h <= 26; h += 2) {
    const displayH = h >= 24 ? h - 24 : h
    const pct = ((h * 60 - startRange) / totalRange) * 100
    timeMarkers.push({ label: `${String(displayH).padStart(2, "0")}:00`, pct })
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="h-4 w-4 text-gold" />
          <span className="text-xs font-medium text-muted-foreground">Vue d&apos;ensemble de la journée</span>
        </div>
        <div className="relative h-14 bg-muted/20 rounded-lg border border-border/30 overflow-hidden">
          {/* Time markers */}
          {timeMarkers.map((m) => (
            <div
              key={m.label}
              className="absolute top-0 h-full flex flex-col justify-end"
              style={{ left: `${m.pct}%` }}
            >
              <div className="w-px h-full bg-border/30" />
              <span className="text-[8px] text-muted-foreground/60 -ml-3 mt-0.5 absolute -bottom-3.5">
                {m.label}
              </span>
            </div>
          ))}

          {/* Event blocks */}
          {items.map((item) => {
            const start = timeToMinutes(item.startTime)
            const end = start + item.duration
            const leftPct = Math.max(0, ((start - startRange) / totalRange) * 100)
            const widthPct = Math.max(1, ((end - start) / totalRange) * 100)

            return (
              <motion.div
                key={item.id}
                className="absolute top-1 bottom-1 rounded-md cursor-pointer group/block"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: `${item.color}30`,
                  borderLeft: `2px solid ${item.color}`,
                }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                title={`${item.title} — ${item.startTime} → ${endTime(item.startTime, item.duration)}`}
              >
                <div className="px-1.5 h-full flex items-center overflow-hidden">
                  <span
                    className="text-[9px] font-medium truncate"
                    style={{ color: item.color }}
                  >
                    {item.title}
                  </span>
                </div>
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-card border border-gold/20 rounded-lg px-2.5 py-1.5 shadow-lg opacity-0 group-hover/block:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                  <p className="text-[10px] font-medium" style={{ color: item.color }}>{item.title}</p>
                  <p className="text-[9px] text-muted-foreground">{item.startTime} → {endTime(item.startTime, item.duration)} · {formatDuration(item.duration)}</p>
                </div>
              </motion.div>
            )
          })}

          {/* Current time indicator */}
          {nowPct >= 0 && nowPct <= 100 && (
            <div
              className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
              style={{ left: `${nowPct}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Timeline Stats ──────────────────────────────────────────────
function TimelineStats({ items }: { items: TimelineItem[] }) {
  const totalDuration = useMemo(() => items.reduce((s, i) => s + i.duration, 0), [items])
  const completedCount = items.filter((i) => i.status === "termine").length
  const completionPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  const nextItem = useMemo(() => {
    const now = new Date()
    const currentMins = now.getHours() * 60 + now.getMinutes()
    return items
      .filter((i) => timeToMinutes(i.startTime) > currentMins)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] || null
  }, [items])

  const stats = [
    {
      icon: CalendarDays,
      label: "Moments",
      value: String(items.length),
      sub: "programme(s)",
      color: "text-gold",
      iconBg: "gradient-gold",
      iconColor: "text-black",
      gradient: "from-gold/10 via-gold/5 to-transparent",
    },
    {
      icon: Timer,
      label: "Durée totale",
      value: formatDuration(totalDuration),
      sub: "de programme",
      color: "text-amber-500",
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
      gradient: "from-amber-500/8 via-amber-500/4 to-transparent",
    },
    {
      icon: Play,
      label: "Prochain moment",
      value: nextItem ? nextItem.title : "—",
      sub: nextItem ? `à ${nextItem.startTime}` : "Aucun",
      color: "text-emerald-500",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
      gradient: "from-emerald-500/8 via-emerald-500/4 to-transparent",
    },
    {
      icon: CheckCircle2,
      label: "Avancement",
      value: `${completionPct}%`,
      sub: `${completedCount}/${items.length} terminé(s)`,
      color: "text-purple-500",
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-500",
      gradient: "from-purple-500/8 via-purple-500/4 to-transparent",
    },
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat) => (
        <motion.div key={stat.label} variants={fadeInUp}>
          <Card className="border-border/50 hover:border-gold/20 transition-all group overflow-hidden relative shimmer-card card-hover-lift">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <CardContent className="p-5 relative">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold font-heading">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Inner form component (keyed for reset) ──────────────────────
function TimelineItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: TimelineItem | null
  onSave: (data: Omit<TimelineItem, "id" | "status">) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(item?.title ?? "")
  const [startTime, setStartTime] = useState(item?.startTime ?? "09:00")
  const [duration, setDuration] = useState(item ? String(item.duration) : "60")
  const [description, setDescription] = useState(item?.description ?? "")
  const [location, setLocation] = useState(item?.location ?? "")
  const [color, setColor] = useState(item?.color ?? "#d4a853")
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Le titre est requis")
      return
    }
    setSaving(true)
    setTimeout(() => {
      onSave({
        title: title.trim(),
        startTime,
        duration: Number(duration) || 60,
        description: description.trim(),
        location: location.trim(),
        color,
      })
      setSaving(false)
      onCancel()
    }, 300)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-black" />
          </div>
          {item ? "Modifier le moment" : "Ajouter un moment"}
        </DialogTitle>
        <DialogDescription className="text-muted-foreground text-sm">
          {item
            ? "Modifiez les informations de ce moment du programme"
            : "Planifiez un nouveau moment dans le programme de l'événement"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1">
            Titre <span className="text-red-500">*</span>
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Cérémonie, Cocktail, Dîner..."
            className="border-gold/20 focus:border-gold/40 input-premium h-9"
          />
        </div>

        {/* Start Time + Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Clock className="h-3 w-3 text-gold" /> Heure de début
            </Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border-gold/20 focus:border-gold/40 input-premium h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Timer className="h-3 w-3 text-gold" /> Durée (min)
            </Label>
            <Input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              className="border-gold/20 focus:border-gold/40 input-premium h-9"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez ce moment..."
            rows={3}
            className="border-gold/20 focus:border-gold/40 input-premium text-sm resize-none"
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gold" /> Lieu
          </Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Grande Salle, Jardin..."
            className="border-gold/20 focus:border-gold/40 input-premium h-9"
          />
        </div>

        {/* Color picker */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Couleur</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setColor(opt.value)}
                className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                  color === opt.value ? "border-foreground scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: opt.value }}
                title={opt.label}
              />
            ))}
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button variant="outline" className="border-gold/20 rounded-full text-xs" onClick={onCancel}>
            Annuler
          </Button>
        </DialogClose>
        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="btn-gold rounded-full text-xs inline-flex items-center justify-center px-4 py-2 font-medium disabled:opacity-50"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
          {item ? "Enregistrer" : "Ajouter"}
        </motion.button>
      </DialogFooter>
    </>
  )
}

// ─── Dialog wrapper (keyed to force remount on item change) ──────
function TimelineItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: TimelineItem | null
  onSave: (data: Omit<TimelineItem, "id" | "status">) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-dark border-gold/20 text-foreground sm:max-w-lg">
        <TimelineItemForm
          key={item?.id ?? "new"}
          item={item}
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Timeline Section ───────────────────────────────────────
export function TimelineSection() {
  const { currentEvent } = useStore()
  const [items, setItems] = useState<TimelineItem[]>(MOCK_TIMELINE)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const totalDuration = useMemo(() => items.reduce((s, i) => s + i.duration, 0), [items])

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [items]
  )

  // ─── Handlers ─────────────────────────────────────────────────
  const handleAdd = () => {
    setEditingItem(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: TimelineItem) => {
    setEditingItem(item)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    toast.success("Moment supprimé du programme")
  }

  const handleSave = (data: Omit<TimelineItem, "id" | "status">) => {
    if (editingItem) {
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...i, ...data } : i))
      )
      toast.success("Moment modifié avec succès")
    } else {
      const newItem: TimelineItem = {
        ...data,
        id: String(Date.now()),
        status: "a_venir",
      }
      setItems((prev) => [...prev, newItem])
      toast.success("Moment ajouté au programme")
    }
    setEditingItem(null)
  }

  // ─── No event state ──────────────────────────────────────────
  if (!currentEvent) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-4 animate-float">
          <CalendarDays className="h-10 w-10 text-gold" />
        </div>
        <h3 className="font-heading text-xl font-bold mb-2">Aucun événement sélectionné</h3>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Sélectionnez un événement pour accéder au programme
        </p>
        <div className="mt-6 text-xs text-muted-foreground/50 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-gold/40" />
          Créé par HenoBuild
        </div>
      </motion.div>
    )
  }

  // ─── Empty state ─────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center mb-6 animate-float relative">
          <CalendarDays className="h-12 w-12 text-gold/60" />
          <div className="absolute inset-0 rounded-full border-2 border-gold/20 animate-pulse" />
        </div>
        <h3 className="font-heading text-2xl font-bold mb-2">Aucun programme défini</h3>
        <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
          Planifiez les moments clés de votre événement pour offrir une expérience inoubliable à vos invités
        </p>
        <motion.button
          onClick={handleAdd}
          className="btn-gold rounded-full text-sm inline-flex items-center justify-center px-6 py-3 font-medium"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer le programme
        </motion.button>
        <div className="mt-8 text-xs text-muted-foreground/50 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-gold/40" />
          Créé par HenoBuild
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-gold" />
              Programme de l&apos;Événement
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {currentEvent.title} — {items.length} moment{items.length !== 1 ? "s" : ""} planifié{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live duration counter */}
            <Badge variant="outline" className="border-gold/30 text-gold bg-gold/10 text-xs flex items-center gap-1.5 px-3 py-1">
              <Timer className="h-3 w-3" />
              Durée totale : {formatDuration(totalDuration)}
            </Badge>
            <motion.button
              onClick={handleAdd}
              className="btn-gold rounded-full text-sm inline-flex items-center justify-center px-4 py-2 font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un moment
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ─── Timeline Stats ──────────────────────────────────── */}
      <TimelineStats items={items} />

      {/* ─── Day Overview Strip ───────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <DayOverviewStrip items={sortedItems} />
      </motion.div>

      {/* ─── Visual Timeline ─────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative"
      >
        {/* Gold vertical line (center on desktop, left on mobile) */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gold/20 md:-translate-x-px" />

        <div className="space-y-0">
          {sortedItems.map((item, index) => {
            const isLeft = index % 2 === 0
            const isEven = index % 2 === 0

            return (
              <motion.div
                key={item.id}
                variants={fadeInUp}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative"
              >
                {/* Gold dot marker */}
                <div className="absolute left-4 md:left-1/2 top-6 -translate-x-1/2 z-10">
                  <div className="w-4 h-4 rounded-full bg-gold border-2 border-background shadow-lg shadow-gold/20" />
                  {/* Pulsing current indicator */}
                  {item.status === "en_cours" && (
                    <div className="absolute inset-0 rounded-full bg-gold/50 animate-ping" />
                  )}
                </div>

                {/* Card positioning */}
                <div className={`flex items-start gap-0 ${
                  isLeft
                    ? "md:flex-row md:pr-[50%]"
                    : "md:flex-row-reverse md:pl-[50%]"
                } pl-10 md:pl-0`}>
                  <div className={`flex-1 ${isLeft ? "md:pr-8" : "md:pl-8"}`}>
                    <motion.div
                      className={`relative rounded-xl border p-4 transition-all ${
                        isEven ? "bg-gold/5 border-gold/15" : "bg-gold/10 border-gold/20"
                      } ${hoveredItem === item.id ? "border-gold/40 shadow-lg shadow-gold/5" : ""}`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      {/* Status indicator for "En cours" */}
                      {item.status === "en_cours" && (
                        <div className="absolute -top-2 right-4">
                          <Badge className="gradient-gold text-black text-[9px] border-0 px-2 py-0.5 flex items-center gap-1 animate-pulse">
                            <Play className="h-2.5 w-2.5" /> En cours
                          </Badge>
                        </div>
                      )}

                      {/* Time + Duration */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          <Clock className="h-3 w-3" />
                          {item.startTime}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          → {endTime(item.startTime, item.duration)}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-gold/15 text-gold/70">
                          {formatDuration(item.duration)}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h4 className="font-heading text-base font-bold mb-1">{item.title}</h4>

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Location */}
                      {item.location && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3 text-gold/60" />
                          {item.location}
                        </div>
                      )}

                      {/* Bottom row: status + actions */}
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-2 py-0.5 ${statusColor(item.status)}`}
                        >
                          {statusIcon(item.status)}
                          {statusLabel(item.status)}
                        </Badge>

                        {/* Hover actions */}
                        <div className={`flex items-center gap-1 transition-opacity duration-200 ${
                          hoveredItem === item.id ? "opacity-100" : "opacity-0"
                        }`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-gold/10"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-gold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-red-500/10"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Color accent bar */}
                      <div
                        className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                        style={{ backgroundColor: item.color }}
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ─── Branding Footer ─────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="pt-4"
      >
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50">
          <Sparkles className="h-3 w-3 text-gold/40" />
          <span className="uppercase tracking-[0.15em]">Créé par HenoBuild</span>
        </div>
      </motion.div>

      {/* ─── Add/Edit Dialog ─────────────────────────────────── */}
      <TimelineItemDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingItem(null)
        }}
        item={editingItem}
        onSave={handleSave}
      />
    </div>
  )
}
