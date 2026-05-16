"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Plus, Search, Filter, Mail, Phone, QrCode,
  X, Check, UserPlus, Edit2, Trash2, MoreVertical
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

interface Guest {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  status: "INVITED" | "CONFIRMED" | "DECLINED" | "PRESENT"
  tableId?: string
  tableNumber?: number
  seatNumber?: number
  plusOne: boolean
  plusOneName?: string
  dietaryReq?: string
  qrCode?: string
  table?: { id: string; name: string; number: number }
}

const statusConfig: Record<string, { label: string; color: string }> = {
  INVITED: { label: "Invité", color: "border-amber-500/30 text-amber-500 bg-amber-500/5" },
  CONFIRMED: { label: "Confirmé", color: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" },
  DECLINED: { label: "Refusé", color: "border-destructive/30 text-destructive bg-destructive/5" },
  PRESENT: { label: "Présent", color: "border-blue-500/30 text-blue-500 bg-blue-500/5" },
}

export function GuestManagement() {
  const { auth, currentEventId, events } = useStore()
  const [guests, setGuests] = useState<Guest[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)

  const [newGuest, setNewGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    plusOne: false,
    plusOneName: "",
    dietaryReq: "",
  })

  const currentEvent = events.find((e) => e.id === currentEventId)

  useEffect(() => {
    if (currentEventId) fetchGuests()
  }, [currentEventId])

  const fetchGuests = async () => {
    if (!currentEventId || !auth.token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/guests?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGuests(data.guests || [])
      }
    } catch (err) {
      console.error("Failed to fetch guests:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const addGuest = async () => {
    if (!currentEventId || !auth.token) return
    if (!newGuest.firstName || !newGuest.lastName) {
      toast.error("Le prénom et le nom sont requis")
      return
    }

    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          eventId: currentEventId,
          ...newGuest,
          email: newGuest.email || null,
          phone: newGuest.phone || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGuests((prev) => [...prev, data.guest])
        toast.success("Invité ajouté avec succès")
        setShowAddDialog(false)
        setNewGuest({ firstName: "", lastName: "", email: "", phone: "", plusOne: false, plusOneName: "", dietaryReq: "" })
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors de l'ajout")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    }
  }

  const deleteGuest = async (guestId: string) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        setGuests((prev) => prev.filter((g) => g.id !== guestId))
        toast.success("Invité supprimé")
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  const filtered = guests.filter((guest) => {
    const matchesSearch =
      `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (guest.email || "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || guest.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    total: guests.length,
    invited: guests.filter((g) => g.status === "INVITED").length,
    confirmed: guests.filter((g) => g.status === "CONFIRMED").length,
    declined: guests.filter((g) => g.status === "DECLINED").length,
    present: guests.filter((g) => g.status === "PRESENT").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-gold" />
            Invités
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentEvent ? currentEvent.title : "Sélectionnez un événement"}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="btn-gold rounded-full" disabled={!currentEventId}>
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un invité
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: statusCounts.total, color: "text-foreground" },
          { label: "Invités", value: statusCounts.invited, color: "text-amber-500" },
          { label: "Confirmés", value: statusCounts.confirmed, color: "text-emerald-500" },
          { label: "Refusés", value: statusCounts.declined, color: "text-destructive" },
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
            placeholder="Rechercher un invité..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "INVITED", "CONFIRMED", "DECLINED", "PRESENT"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full text-xs ${
                statusFilter === s ? "btn-gold" : "btn-outline-gold border-gold/30"
              }`}
            >
              {s === "all" ? "Tous" : statusConfig[s]?.label || s}
            </Button>
          ))}
        </div>
      </div>

      {/* Guest list */}
      {!currentEventId ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Sélectionnez un événement pour gérer les invités</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun invité trouvé</p>
          <Button onClick={() => setShowAddDialog(true)} className="btn-gold rounded-full mt-4">
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter un invité
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          <AnimatePresence>
            {filtered.map((guest) => {
              const status = statusConfig[guest.status] || statusConfig.INVITED
              return (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-gold/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-sm font-bold text-gold">
                      {guest.firstName[0]}{guest.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {guest.firstName} {guest.lastName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {guest.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />{guest.email}
                          </span>
                        )}
                        {guest.table && (
                          <span>Table {guest.table.number}</span>
                        )}
                        {guest.plusOne && (
                          <span className="text-gold">+1</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                      {status.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGuest(guest.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add guest dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md glass-dark border-gold/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 gradient-gold-text font-heading">
              <UserPlus className="h-5 w-5 text-gold" />
              Ajouter un invité
            </DialogTitle>
            <DialogDescription>Ajoutez un nouvel invité à votre événement</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={newGuest.firstName}
                  onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                  className="bg-background/50 border-gold/20 focus:border-gold/50"
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={newGuest.lastName}
                  onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                  className="bg-background/50 border-gold/20 focus:border-gold/50"
                  placeholder="Nom"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                className="bg-background/50 border-gold/20 focus:border-gold/50"
                placeholder="email@exemple.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                type="tel"
                value={newGuest.phone}
                onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                className="bg-background/50 border-gold/20 focus:border-gold/50"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="space-y-2">
              <Label>Exigences alimentaires</Label>
              <Input
                value={newGuest.dietaryReq}
                onChange={(e) => setNewGuest({ ...newGuest, dietaryReq: e.target.value })}
                className="bg-background/50 border-gold/20 focus:border-gold/50"
                placeholder="Végétarien, sans gluten..."
              />
            </div>

            <Button onClick={addGuest} className="w-full btn-gold rounded-full py-5">
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter l&apos;invité
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
