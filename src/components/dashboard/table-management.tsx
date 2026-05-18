"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Grid3X3, Plus, Crown, Users, Edit2, Trash2,
  CircleDot, ChevronDown, UserMinus, ArrowRightLeft, GripVertical, Info
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

interface TableItem {
  id: string
  name: string
  number: number
  capacity: number
  currentOccupancy: number
  isVip: boolean
  guests: { id: string; firstName: string; lastName: string; status: string; seatNumber?: number }[]
}

interface UnassignedGuest {
  id: string
  firstName: string
  lastName: string
  status: string
  tableId?: string | null
}

// Capacity ring SVG component
function CapacityRing({ occupancy, capacity, size = 48 }: { occupancy: number; capacity: number; size?: number }) {
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
    <div className="relative" style={{ width: size, height: size }}>
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold font-mono" style={{ color: getColor() }}>
          {occupancy}/{capacity}
        </span>
      </div>
    </div>
  )
}

// Stagger animation variants
const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: "easeOut" }
  },
}

// Skeleton loading component
function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full shimmer-load" />
            <div className="space-y-2">
              <div className="h-4 w-24 rounded shimmer-load" />
              <div className="h-3 w-16 rounded shimmer-load" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full shimmer-load" />
          ))}
        </div>
        <div className="h-1.5 rounded-full shimmer-load" />
      </CardContent>
    </Card>
  )
}

export function TableManagement() {
  const { auth, currentEventId, events } = useStore()
  const [tables, setTables] = useState<TableItem[]>([])
  const [unassignedGuests, setUnassignedGuests] = useState<UnassignedGuest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTable, setNewTable] = useState({
    name: "",
    number: "",
    capacity: "8",
    isVip: false,
  })
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkConfig, setBulkConfig] = useState({
    count: "5",
    capacity: "8",
    prefix: "Table ",
    isVip: false,
  })
  const [isBulkLoading, setIsBulkLoading] = useState(false)

  const currentEvent = events.find((e) => e.id === currentEventId)

  useEffect(() => {
    if (currentEventId) {
      fetchTables()
      fetchUnassignedGuests()
    }
  }, [currentEventId])

  const fetchTables = async () => {
    if (!currentEventId || !auth.token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/tables?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTables(data.tables || [])
      }
    } catch (err) {
      console.error("Failed to fetch tables:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnassignedGuests = async () => {
    if (!currentEventId || !auth.token) return
    try {
      const res = await fetch(`/api/guests?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const unassigned = (data.guests || []).filter(
          (g: UnassignedGuest) => !g.tableId
        )
        setUnassignedGuests(unassigned)
      }
    } catch (err) {
      console.error("Failed to fetch unassigned guests:", err)
    }
  }

  const addTable = async () => {
    if (!currentEventId || !auth.token) return
    if (!newTable.name || !newTable.number) {
      toast.error("Le nom et le numéro sont requis")
      return
    }

    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          eventId: currentEventId,
          name: newTable.name,
          number: parseInt(newTable.number),
          capacity: parseInt(newTable.capacity) || 8,
          isVip: newTable.isVip,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setTables((prev) => [...prev, data.table])
        toast.success("Table ajoutée avec succès")
        setShowAddDialog(false)
        setNewTable({ name: "", number: "", capacity: "8", isVip: false })
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors de l'ajout")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    }
  }

  const generateBulkTables = async () => {
    if (!currentEventId || !auth.token) return
    const countNum = parseInt(bulkConfig.count)
    if (isNaN(countNum) || countNum <= 0) {
      toast.error("Le nombre de tables doit être positif")
      return
    }

    setIsBulkLoading(true)
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          isBulk: true,
          eventId: currentEventId,
          count: countNum,
          capacity: parseInt(bulkConfig.capacity) || 8,
          prefix: bulkConfig.prefix || "Table ",
          isVip: bulkConfig.isVip,
        }),
      })

      if (res.ok) {
        toast.success(`${countNum} tables générées avec succès !`)
        setShowBulkDialog(false)
        setBulkConfig({ count: "5", capacity: "8", prefix: "Table ", isVip: false })
        fetchTables()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors de la génération")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsBulkLoading(false)
    }
  }

  const deleteTable = async (tableId: string) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        setTables((prev) => prev.filter((t) => t.id !== tableId))
        fetchUnassignedGuests()
        toast.success("Table supprimée")
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  const assignGuestToTable = async (guestId: string, tableId: string) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ tableId }),
      })
      if (res.ok) {
        toast.success("Invité assigné à la table")
        fetchTables()
        fetchUnassignedGuests()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors de l'assignation")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    }
  }

  const unassignGuestFromTable = async (guestId: string) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ tableId: null, tableNumber: null, seatNumber: null }),
      })
      if (res.ok) {
        toast.success("Invité retiré de la table")
        fetchTables()
        fetchUnassignedGuests()
      } else {
        toast.error("Erreur lors du retrait")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    }
  }

  const moveGuestToTable = async (guestId: string, newTableId: string) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ tableId: newTableId }),
      })
      if (res.ok) {
        toast.success("Invité déplacé avec succès")
        fetchTables()
        fetchUnassignedGuests()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors du déplacement")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    }
  }

  const getOccupancyColor = (current: number, capacity: number) => {
    const ratio = capacity > 0 ? current / capacity : 0
    if (ratio >= 1) return "border-red-500/30 bg-red-500/5"
    if (ratio >= 0.75) return "border-gold/30 bg-gold/5"
    return "border-emerald-500/30 bg-emerald-500/5"
  }

  const getOccupancyBadge = (current: number, capacity: number) => {
    const ratio = capacity > 0 ? current / capacity : 0
    if (ratio >= 1) return { label: "Complète", color: "text-red-500" }
    if (ratio >= 0.75) return { label: "Presque pleine", color: "text-gold" }
    return { label: "Disponible", color: "text-emerald-500" }
  }

  const getSeatColor = (index: number, capacity: number, occupancy: number) => {
    if (index < occupancy) {
      const ratio = capacity > 0 ? occupancy / capacity : 0
      if (ratio >= 1) return "bg-red-500 border-red-500/50"
      if (ratio >= 0.75) return "bg-gold border-gold/50"
      return "bg-emerald-500 border-emerald-500/50"
    }
    return "bg-muted/30 border-border/50"
  }

  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0)
  const totalOccupancy = tables.reduce((sum, t) => sum + t.currentOccupancy, 0)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
              <Grid3X3 className="h-6 w-6 text-gold" />
              Tables
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentEvent ? currentEvent.title : "Sélectionnez un événement"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowBulkDialog(true)}
              variant="outline"
              className="border-gold/30 hover:border-gold/60 text-gold hover:text-gold hover:bg-gold/10 rounded-full"
              disabled={!currentEventId}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Générateur intelligent
            </Button>
            <Button onClick={() => setShowAddDialog(true)} className="btn-gold rounded-full" disabled={!currentEventId}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une table
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { value: tables.length, label: "Total tables", color: "", bg: "bg-gradient-to-br from-muted/50 to-muted/20" },
            { value: totalCapacity, label: "Places totales", color: "text-gold", bg: "bg-gradient-to-br from-gold/8 to-gold/3" },
            { value: totalCapacity - totalOccupancy, label: "Places libres", color: "text-emerald-500", bg: "bg-gradient-to-br from-emerald-500/8 to-emerald-500/3" },
            { value: tables.filter((t) => t.isVip).length, label: "Tables VIP", color: "text-purple-500", bg: "bg-gradient-to-br from-purple-500/8 to-purple-500/3" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <Card className="border-border/50 hover:border-gold/15 transition-all">
                <CardContent className={`p-4 text-center ${stat.bg}`}>
                  <p className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Unassigned guests bar */}
        <AnimatePresence>
          {unassignedGuests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Invités non assignés</span>
                      <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-[10px]">
                        {unassignedGuests.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scroll-smooth-gold">
                    {unassignedGuests.map((guest) => (
                      <DropdownMenu key={guest.id}>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background border border-border/50 text-xs font-medium hover:border-gold/30 transition-all">
                            <span>{guest.firstName} {guest.lastName}</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Assigner à une table</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {tables
                            .filter((t) => t.currentOccupancy < t.capacity)
                            .map((table) => (
                              <DropdownMenuItem
                                key={table.id}
                                onClick={() => assignGuestToTable(guest.id, table.id)}
                                className="text-sm"
                              >
                                <Grid3X3 className="h-3.5 w-3.5 mr-2 text-gold" />
                                {table.name} ({table.currentOccupancy}/{table.capacity})
                              </DropdownMenuItem>
                            ))}
                          {tables.filter((t) => t.currentOccupancy < t.capacity).length === 0 && (
                            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                              Aucune table disponible
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tables grid */}
        {!currentEventId ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Grid3X3 className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">Sélectionnez un événement pour gérer les tables</p>
          </motion.div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <TableSkeleton key={i} />
            ))}
          </div>
        ) : tables.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Grid3X3 className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Aucune table configurée</p>
            <Button onClick={() => setShowAddDialog(true)} className="btn-gold rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une table
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {tables.map((table) => {
              const badge = getOccupancyBadge(table.currentOccupancy, table.capacity)
              return (
                <motion.div
                  key={table.id}
                  variants={staggerItem}
                  layout
                >
                  <Card className={`border ${getOccupancyColor(table.currentOccupancy, table.capacity)} hover:shadow-lg transition-all group overflow-hidden relative`}>
                    {/* Drag hint indicator */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
                            table.isVip ? "gradient-gold text-black" : "bg-muted/50 text-muted-foreground"
                          }`}>
                            {table.isVip ? <Crown className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-heading font-semibold">{table.name}</p>
                            <p className="text-xs text-muted-foreground">Table #{table.number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Capacity ring */}
                          <CapacityRing occupancy={table.currentOccupancy} capacity={table.capacity} size={44} />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTable(table.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {table.isVip && (
                        <Badge className="gradient-gold text-black text-[10px] border-0 w-fit">VIP</Badge>
                      )}

                      {/* Visual seat representation with tooltips */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {table.currentOccupancy}/{table.capacity}
                          </span>
                          <span className={`text-xs font-medium ${badge.color}`}>{badge.label}</span>
                        </div>
                        {/* Seats as circles with tooltips */}
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: table.capacity }).map((_, index) => {
                            const guest = table.guests?.[index]
                            return (
                              <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.03, duration: 0.2 }}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all cursor-default hover:scale-110 hover:z-10 ${
                                      guest
                                        ? getSeatColor(index, table.capacity, table.currentOccupancy)
                                        : "bg-muted/20 border-dashed border-border/50"
                                    }`}
                                  >
                                    {guest ? (
                                      <span className="text-white">
                                        {guest.firstName[0]}{guest.lastName[0]}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground/30">{index + 1}</span>
                                    )}
                                  </motion.div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {guest
                                    ? `${guest.firstName} ${guest.lastName}${guest.seatNumber ? ` - Siège ${guest.seatNumber}` : ""}`
                                    : `Siège ${index + 1} (libre)`
                                  }
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                      </div>

                      {/* Occupancy bar */}
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            table.currentOccupancy >= table.capacity
                              ? "bg-red-500"
                              : table.currentOccupancy / table.capacity >= 0.75
                              ? "bg-gold"
                              : "bg-emerald-500"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (table.currentOccupancy / table.capacity) * 100)}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      </div>

                      {/* Seated guests list with move/remove actions */}
                      {table.guests && table.guests.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground font-medium">Invités assignés :</p>
                          {table.guests.map((guest) => (
                            <div key={guest.id} className="flex items-center justify-between text-xs group/guest">
                              <div className="flex items-center gap-2">
                                <CircleDot className="h-3 w-3 text-gold shrink-0" />
                                <span className="font-medium">{guest.firstName} {guest.lastName}</span>
                                {guest.seatNumber && <span className="text-muted-foreground">- Siège {guest.seatNumber}</span>}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover/guest:opacity-100 transition-opacity">
                                {/* Move to other table dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all">
                                      <ArrowRightLeft className="h-3 w-3" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs text-muted-foreground">Déplacer vers</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {tables
                                      .filter((t) => t.id !== table.id && t.currentOccupancy < t.capacity)
                                      .map((otherTable) => (
                                        <DropdownMenuItem
                                          key={otherTable.id}
                                          onClick={() => moveGuestToTable(guest.id, otherTable.id)}
                                          className="text-xs"
                                        >
                                          <Grid3X3 className="h-3 w-3 mr-1.5 text-gold" />
                                          {otherTable.name} ({otherTable.currentOccupancy}/{otherTable.capacity})
                                        </DropdownMenuItem>
                                      ))}
                                    {tables.filter((t) => t.id !== table.id && t.currentOccupancy < t.capacity).length === 0 && (
                                      <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                        Aucune table disponible
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                {/* Remove from table */}
                                <button
                                  onClick={() => unassignGuestFromTable(guest.id)}
                                  className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                >
                                  <UserMinus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add guest to table button */}
                      {table.currentOccupancy < table.capacity && unassignedGuests.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full btn-outline-gold border-gold/30 rounded-full text-xs h-8">
                              <Plus className="h-3 w-3 mr-1" />
                              Ajouter un invité
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Invités non assignés</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {unassignedGuests.slice(0, 10).map((guest) => (
                              <DropdownMenuItem
                                key={guest.id}
                                onClick={() => assignGuestToTable(guest.id, table.id)}
                                className="text-sm"
                              >
                                <Users className="h-3.5 w-3.5 mr-2 text-gold" />
                                {guest.firstName} {guest.lastName}
                              </DropdownMenuItem>
                            ))}
                            {unassignedGuests.length > 10 && (
                              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                +{unassignedGuests.length - 10} autres invités...
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Add table dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-md glass-dark border-gold/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 gradient-gold-text font-heading">
                <Grid3X3 className="h-5 w-5 text-gold" />
                Ajouter une table
              </DialogTitle>
              <DialogDescription>Configurez une nouvelle table pour votre événement</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nom de la table *</Label>
                  <Input
                    value={newTable.name}
                    onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                    className="bg-background/50 border-gold/20 focus:border-gold/50"
                    placeholder="Table 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Numéro *</Label>
                  <Input
                    type="number"
                    value={newTable.number}
                    onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                    className="bg-background/50 border-gold/20 focus:border-gold/50"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capacité</Label>
                <Input
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                  className="bg-background/50 border-gold/20 focus:border-gold/50"
                  placeholder="8"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Table VIP</Label>
                <Switch
                  checked={newTable.isVip}
                  onCheckedChange={(v) => setNewTable({ ...newTable, isVip: v })}
                />
              </div>

              <Button onClick={addTable} className="w-full btn-gold rounded-full py-5">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la table
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Smart bulk table generator dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent className="sm:max-w-md glass-dark border-gold/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 gradient-gold-text font-heading">
                <Grid3X3 className="h-5 w-5 text-gold" />
                Générateur de tables automatique
              </DialogTitle>
              <DialogDescription>
                Créez instantanément plusieurs tables configurées uniformément pour votre événement.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nombre de tables *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={bulkConfig.count}
                    onChange={(e) => setBulkConfig({ ...bulkConfig, count: e.target.value })}
                    className="bg-background/50 border-gold/20 focus:border-gold/50"
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacité (Sièges) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={bulkConfig.capacity}
                    onChange={(e) => setBulkConfig({ ...bulkConfig, capacity: e.target.value })}
                    className="bg-background/50 border-gold/20 focus:border-gold/50"
                    placeholder="8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Préfixe du nom des tables</Label>
                <Input
                  value={bulkConfig.prefix}
                  onChange={(e) => setBulkConfig({ ...bulkConfig, prefix: e.target.value })}
                  className="bg-background/50 border-gold/20 focus:border-gold/50"
                  placeholder="Table "
                />
                <p className="text-[10px] text-muted-foreground/60">
                  Les tables seront nommées avec ce préfixe suivi du numéro (ex: Table 1, Table 2...)
                </p>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-gold/5">
                <div>
                  <Label className="text-xs">Tables VIP</Label>
                  <p className="text-[10px] text-muted-foreground">Marquer toutes ces tables comme VIP</p>
                </div>
                <Switch
                  checked={bulkConfig.isVip}
                  onCheckedChange={(v) => setBulkConfig({ ...bulkConfig, isVip: v })}
                />
              </div>

              <Button onClick={generateBulkTables} disabled={isBulkLoading} className="w-full btn-gold rounded-full py-5">
                {isBulkLoading ? "Génération en cours..." : "Générer les tables"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
