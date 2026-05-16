"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Grid3X3, Plus, Crown, Users, Edit2, Trash2,
  CircleDot
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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

export function TableManagement() {
  const { auth, currentEventId, events } = useStore()
  const [tables, setTables] = useState<TableItem[]>([])
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
    if (currentEventId) fetchTables()
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
        toast.success("Table supprimée")
      }
    } catch {
      toast.error("Erreur lors de la suppression")
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

                    {/* Occupancy bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {table.currentOccupancy}/{table.capacity}
                        </span>
                        <span className={`text-xs font-medium ${badge.color}`}>{badge.label}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
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
                    </div>

                    {/* Guests list */}
                    {table.guests && table.guests.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Invités assignés :</p>
                        {table.guests.map((guest) => (
                          <div key={guest.id} className="flex items-center gap-2 text-xs">
                            <CircleDot className="h-3 w-3 text-gold" />
                            <span>{guest.firstName} {guest.lastName}</span>
                            {guest.seatNumber && <span className="text-muted-foreground">- Siège {guest.seatNumber}</span>}
                          </div>
                        ))}
                      </div>
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
