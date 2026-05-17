"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Plus, Search, Filter, Mail, Phone, QrCode,
  X, Check, UserPlus, Edit2, Trash2, MoreVertical,
  ChevronDown, Upload, FileText, ArrowUpRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  INVITED: { label: "Invité", color: "border-amber-500/30 text-amber-500 bg-amber-500/5", icon: Mail, bg: "bg-amber-500/10" },
  CONFIRMED: { label: "Confirmé", color: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5", icon: Check, bg: "bg-emerald-500/10" },
  DECLINED: { label: "Refusé", color: "border-destructive/30 text-destructive bg-destructive/5", icon: X, bg: "bg-destructive/10" },
  PRESENT: { label: "Présent", color: "border-sky-500/30 text-sky-500 bg-sky-500/5", icon: Users, bg: "bg-sky-500/10" },
}

const statusOrder: Record<string, number> = {
  INVITED: 0,
  CONFIRMED: 1,
  PRESENT: 2,
  DECLINED: 3,
}

// Count-up animation component
function CountUpNumber({ target, className }: { target: number; className?: string }) {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    if (target === prevTarget.current) return
    const start = prevTarget.current
    const diff = target - start
    const duration = 800
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(start + diff * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevTarget.current = target
      }
    }

    requestAnimationFrame(animate)
  }, [target])

  return <span className={className}>{count}</span>
}

// Stagger animation variants
const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.2 } }
}

// Skeleton loading component
function GuestSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full shimmer-load" />
        <div className="space-y-2">
          <div className="h-3.5 w-28 rounded shimmer-load" />
          <div className="h-2.5 w-40 rounded shimmer-load" />
        </div>
      </div>
      <div className="h-7 w-24 rounded-full shimmer-load" />
    </div>
  )
}

export function GuestManagement() {
  const { auth, currentEventId, events } = useStore()
  const [guests, setGuests] = useState<Guest[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [importText, setImportText] = useState("")
  const [isImporting, setIsImporting] = useState(false)

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
        const guest = data.guest

        // Auto-create invitation for the new guest
        try {
          await fetch("/api/invitations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth.token}`,
            },
            body: JSON.stringify({
              eventId: currentEventId,
              guestId: guest.id,
            }),
          })
        } catch {
          // Silently fail - invitation creation is best-effort
        }

        setGuests((prev) => [...prev, guest])
        toast.success("Invité ajouté et invitation créée")
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

  const updateGuestStatus = async (guestId: string, status: "INVITED" | "CONFIRMED" | "DECLINED" | "PRESENT") => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guestId ? { ...g, status } : g))
        )
        const cfg = statusConfig[status]
        toast.success(`Statut mis à jour : ${cfg?.label || status}`)
      } else {
        toast.error("Erreur lors de la mise à jour")
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

  const importGuests = async () => {
    if (!currentEventId || !auth.token || !importText.trim()) return
    setIsImporting(true)
    let successCount = 0
    let errorCount = 0

    const lines = importText.trim().split("\n").filter((l) => l.trim())

    for (const line of lines) {
      const parts = line.split(/[,;\t]+/).map((p) => p.trim())
      const firstName = parts[0] || ""
      const lastName = parts[1] || ""
      const email = parts[2] || ""

      if (!firstName || !lastName) {
        errorCount++
        continue
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
            firstName,
            lastName,
            email: email || null,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          // Auto-create invitation
          try {
            await fetch("/api/invitations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.token}`,
              },
              body: JSON.stringify({
                eventId: currentEventId,
                guestId: data.guest.id,
              }),
            })
          } catch {
            // best-effort
          }
          setGuests((prev) => [...prev, data.guest])
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }
    }

    setIsImporting(false)
    if (successCount > 0) {
      toast.success(`${successCount} invité${successCount > 1 ? "s" : ""} importé${successCount > 1 ? "s" : ""}${errorCount > 0 ? ` (${errorCount} erreur${errorCount > 1 ? "s" : ""})` : ""}`)
    } else {
      toast.error("Aucun invité importé")
    }
    setShowImportDialog(false)
    setImportText("")
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

  const statCards = [
    { label: "Total", value: statusCounts.total, color: "text-foreground", bg: "bg-gradient-to-br from-muted/50 to-muted/20" },
    { label: "Invités", value: statusCounts.invited, color: "text-amber-500", bg: "bg-gradient-to-br from-amber-500/8 to-amber-500/3" },
    { label: "Confirmés", value: statusCounts.confirmed, color: "text-emerald-500", bg: "bg-gradient-to-br from-emerald-500/8 to-emerald-500/3" },
    { label: "Présents", value: statusCounts.present, color: "text-sky-500", bg: "bg-gradient-to-br from-sky-500/8 to-sky-500/3" },
    { label: "Refusés", value: statusCounts.declined, color: "text-destructive", bg: "bg-gradient-to-br from-destructive/8 to-destructive/3" },
  ]

  return (
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
            <Users className="h-6 w-6 text-gold" />
            Invités
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentEvent ? currentEvent.title : "Sélectionnez un événement"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowImportDialog(true)} className="btn-outline-gold border-gold/30 rounded-full" disabled={!currentEventId}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="btn-gold rounded-full" disabled={!currentEventId}>
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter un invité
          </Button>
        </div>
      </motion.div>

      {/* Stats with count-up animation */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <Card className="border-border/50 hover:border-gold/15 transition-all group overflow-hidden">
              <CardContent className={`p-4 text-center relative ${stat.bg}`}>
                <p className={`text-2xl font-bold font-heading ${stat.color}`}>
                  <CountUpNumber target={stat.value} />
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search and filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
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
              className={`rounded-full text-xs transition-all duration-200 ${
                statusFilter === s ? "btn-gold" : "btn-outline-gold border-gold/30"
              }`}
            >
              {s === "all" ? "Tous" : statusConfig[s]?.label || s}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Guest list */}
      {!currentEventId ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Sélectionnez un événement pour gérer les invités</p>
        </motion.div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <GuestSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun invité trouvé</p>
          <Button onClick={() => setShowAddDialog(true)} className="btn-gold rounded-full mt-4">
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter un invité
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2 max-h-[60vh] overflow-y-auto scroll-smooth-gold pr-1"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((guest) => {
              const status = statusConfig[guest.status] || statusConfig.INVITED
              const StatusIcon = status.icon
              return (
                <motion.div
                  key={guest.id}
                  variants={staggerItem}
                  layout
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-gold/10 transition-all group hover:shadow-sm hover:shadow-gold/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-sm font-bold text-gold group-hover:scale-105 transition-transform`}>
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
                          <span className="text-gold font-medium">+1</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-medium transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/20 ${status.color} ${status.bg}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{status.label}</span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Changer le statut</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {(["INVITED", "CONFIRMED", "PRESENT", "DECLINED"] as const).map((s) => {
                          const cfg = statusConfig[s]
                          const Icon = cfg.icon
                          return (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => updateGuestStatus(guest.id, s)}
                              className="flex items-center gap-2 text-sm transition-colors duration-150"
                            >
                              <Icon className={`h-3.5 w-3.5 ${s === guest.status ? "text-gold" : ""}`} />
                              <span className={s === guest.status ? "font-semibold text-gold" : ""}>{cfg.label}</span>
                              {s === guest.status && (
                                <Check className="h-3 w-3 ml-auto text-gold" />
                              )}
                            </DropdownMenuItem>
                          )
                        })}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteGuest(guest.id)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
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

      {/* Import guests dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md glass-dark border-gold/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 gradient-gold-text font-heading">
              <Upload className="h-5 w-5 text-gold" />
              Importer des invités
            </DialogTitle>
            <DialogDescription>Collez les noms de vos invités (un par ligne)</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="rounded-xl bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Format accepté :</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><span className="font-mono bg-muted/50 px-1 rounded">Prénom, Nom, email@exemple.com</span></p>
                <p><span className="font-mono bg-muted/50 px-1 rounded">Prénom; Nom</span></p>
                <p><span className="font-mono bg-muted/50 px-1 rounded">Prénom  Nom</span> (tabulation)</p>
              </div>
            </div>

            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="min-h-[200px] bg-background/50 border-gold/20 focus:border-gold/50 font-mono text-sm"
              placeholder={"Amina, Diallo, amina@email.com\nYoussef, Benali\nFatou, Ndiaye, fatou@email.com"}
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {importText.trim().split("\n").filter((l) => l.trim()).length} ligne{importText.trim().split("\n").filter((l) => l.trim()).length !== 1 ? "s" : ""} détectée{importText.trim().split("\n").filter((l) => l.trim()).length !== 1 ? "s" : ""}
              </p>
            </div>

            <Button onClick={importGuests} className="w-full btn-gold rounded-full py-5" disabled={isImporting || !importText.trim()}>
              {isImporting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer les invités
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
