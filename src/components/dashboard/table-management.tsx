"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Grid3X3, Plus, Crown, Users, Edit2, Trash2,
  CircleDot, ChevronDown, UserMinus, ArrowRightLeft
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
      // Occupied seat
      const ratio = capacity > 0 ? occupancy / capacity : 0
      if (ratio >= 1) return "bg-red-500 border-red-500/50"
      if (ratio >= 0.75) return "bg-gold border-gold/50"
      return "bg-emerald-500 border-emerald-500/50"
    }
    // Empty seat
    return "bg-muted/30 border-border/50"
  }

  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0)
  const totalOccupancy = tables.reduce((sum, t) => sum + t.currentOccupancy, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Grid3X3 className="h-6 w-6 text-gold" />
            Tables
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentEvent ? currentEvent.title : "Sélectionnez un événement"}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="btn-gold rounded-full" disabled={!currentEventId}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une table
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-heading">{tables.length}</p>
            <p className="text-xs text-muted-foreground">Total tables</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-heading text-gold">{totalCapacity}</p>
            <p className="text-xs text-muted-foreground">Places totales</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-heading text-emerald-500">{totalCapacity - totalOccupancy}</p>
            <p className="text-xs text-muted-foreground">Places libres</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-heading text-purple-500">{tables.filter((t) => t.isVip).length}</p>
            <p className="text-xs text-muted-foreground">Tables VIP</p>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned guests bar */}
      {unassignedGuests.length > 0 && (
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
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
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
      )}

      {/* Tables grid */}
      {!currentEventId ? (
        <div className="text-center py-16">
          <Grid3X3 className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Sélectionnez un événement pour gérer les tables</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-6 bg-muted/30 rounded w-1/2" />
                <div className="h-4 bg-muted/30 rounded w-1/3" />
                <div className="h-10 bg-muted/30 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16">
          <Grid3X3 className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Aucune table configurée</p>
          <Button onClick={() => setShowAddDialog(true)} className="btn-gold rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une table
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => {
            const badge = getOccupancyBadge(table.currentOccupancy, table.capacity)
            return (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className={`border ${getOccupancyColor(table.currentOccupancy, table.capacity)} hover:shadow-lg transition-all`}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          table.isVip ? "gradient-gold text-black" : "bg-muted/50 text-muted-foreground"
                        }`}>
                          {table.isVip ? <Crown className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-heading font-semibold">{table.name}</p>
                          <p className="text-xs text-muted-foreground">Table #{table.number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {table.isVip && (
                          <Badge className="gradient-gold text-black text-[10px] border-0">VIP</Badge>
                        )}
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

                    {/* Visual seat representation */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {table.currentOccupancy}/{table.capacity}
                        </span>
                        <span className={`text-xs font-medium ${badge.color}`}>{badge.label}</span>
                      </div>
                      {/* Seats as circles */}
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: table.capacity }).map((_, index) => {
                          const guest = table.guests?.[index]
                          return (
                            <div
                              key={index}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                                guest
                                  ? getSeatColor(index, table.capacity, table.currentOccupancy)
                                  : "bg-muted/20 border-dashed border-border/50"
                              }`}
                              title={guest ? `${guest.firstName} ${guest.lastName}` : `Siège ${index + 1}`}
                            >
                              {guest ? (
                                <span className="text-white">
                                  {guest.firstName[0]}{guest.lastName[0]}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30">{index + 1}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          table.currentOccupancy >= table.capacity
                            ? "bg-red-500"
                            : table.currentOccupancy / table.capacity >= 0.75
                            ? "bg-gold"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, (table.currentOccupancy / table.capacity) * 100)}%` }}
                      />
                    </div>

                    {/* Seated guests list with move/remove actions */}
                    {table.guests && table.guests.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground font-medium">Invités assignés :</p>
                        {table.guests.map((guest) => (
                          <div key={guest.id} className="flex items-center justify-between text-xs group">
                            <div className="flex items-center gap-2">
                              <CircleDot className="h-3 w-3 text-gold shrink-0" />
                              <span className="font-medium">{guest.firstName} {guest.lastName}</span>
                              {guest.seatNumber && <span className="text-muted-foreground">- Siège {guest.seatNumber}</span>}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
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
    </div>
  )
}
