"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  QrCode, Search, Check, Users, Clock, ChevronDown, ChevronUp,
  Mail, Phone, MapPin, CheckCircle2, UserCheck, AlertCircle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  checkedInAt?: string
  table?: { id: string; name: string; number: number }
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  INVITED: { label: "Invité", color: "text-amber-500", bgColor: "bg-amber-500/10 border-amber-500/30" },
  CONFIRMED: { label: "Confirmé", color: "text-emerald-500", bgColor: "bg-emerald-500/10 border-emerald-500/30" },
  PRESENT: { label: "Présent", color: "text-sky-500", bgColor: "bg-sky-500/10 border-sky-500/30" },
  DECLINED: { label: "Refusé", color: "text-red-500", bgColor: "bg-red-500/10 border-red-500/30" },
}

export function CheckInSection() {
  const { auth, currentEventId, events } = useStore()
  const [guests, setGuests] = useState<Guest[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [showCheckinDialog, setShowCheckinDialog] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [checkinSuccess, setCheckinSuccess] = useState(false)
  const [expandedGuest, setExpandedGuest] = useState<string | null>(null)
  const [recentCheckins, setRecentCheckins] = useState<Guest[]>([])

  const currentEvent = events.find((e) => e.id === currentEventId)

  const fetchGuests = useCallback(async () => {
    if (!currentEventId || !auth.token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/guests?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGuests(data.guests || [])
        // Set recent check-ins from guests who are PRESENT
        const presentGuests = (data.guests || [])
          .filter((g: Guest) => g.status === "PRESENT" && g.checkedInAt)
          .sort((a: Guest, b: Guest) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
        setRecentCheckins(presentGuests.slice(0, 5))
      }
    } catch (err) {
      console.error("Failed to fetch guests:", err)
    } finally {
      setIsLoading(false)
    }
  }, [currentEventId, auth.token])

  useEffect(() => {
    if (currentEventId) fetchGuests()
  }, [currentEventId, fetchGuests])

  const checkInGuest = async (guest: Guest) => {
    if (!auth.token) return
    setIsCheckingIn(true)
    setCheckinSuccess(false)
    try {
      const res = await fetch(`/api/guests/${guest.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          status: "PRESENT",
          checkedInAt: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const updatedGuest = data.guest
        setGuests((prev) =>
          prev.map((g) => (g.id === guest.id ? { ...g, status: "PRESENT", checkedInAt: updatedGuest.checkedInAt } : g))
        )
        setRecentCheckins((prev) => {
          const filtered = prev.filter((g) => g.id !== guest.id)
          return [{ ...guest, status: "PRESENT", checkedInAt: updatedGuest.checkedInAt }, ...filtered].slice(0, 5)
        })
        setCheckinSuccess(true)
        toast.success(`${guest.firstName} ${guest.lastName} est arrivé(e) !`)
        setTimeout(() => {
          setShowCheckinDialog(false)
          setCheckinSuccess(false)
          setSelectedGuest(null)
        }, 1500)
      } else {
        toast.error("Erreur lors du check-in")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsCheckingIn(false)
    }
  }

  const openCheckinDialog = (guest: Guest) => {
    setSelectedGuest(guest)
    setCheckinSuccess(false)
    setShowCheckinDialog(true)
  }

  // Stats
  const totalGuests = guests.length
  const checkedIn = guests.filter((g) => g.status === "PRESENT").length
  const remaining = guests.filter((g) => g.status !== "PRESENT" && g.status !== "DECLINED").length
  const checkinPercentage = totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0

  // Filtered guests
  const filtered = guests.filter((guest) => {
    const searchLower = search.toLowerCase()
    return (
      `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(searchLower) ||
      (guest.email || "").toLowerCase().includes(searchLower) ||
      (guest.qrCode || "").toLowerCase().includes(searchLower)
    )
  })

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Il y a ${hours}h`
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <QrCode className="h-6 w-6 text-gold" />
            Check-in
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentEvent ? currentEvent.title : "Sélectionnez un événement"}
          </p>
        </div>
      </div>

      {!currentEventId ? (
        <div className="text-center py-16">
          <QrCode className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Sélectionnez un événement pour gérer les check-ins</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Real-time Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50 hover:border-gold/10 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-sky-500" />
                  </div>
                  <Badge variant="outline" className="border-sky-500/30 text-sky-500 bg-sky-500/5">
                    {checkinPercentage}%
                  </Badge>
                </div>
                <p className="text-3xl font-bold font-heading text-sky-500">{checkedIn}</p>
                <p className="text-sm text-muted-foreground">Enregistrés</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-gold/10 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-gold" />
                  </div>
                </div>
                <p className="text-3xl font-bold font-heading">{totalGuests}</p>
                <p className="text-sm text-muted-foreground">Total invités</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-gold/10 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
                <p className="text-3xl font-bold font-heading text-amber-500">{remaining}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="border-border/50 hover:border-gold/10 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Progression du check-in</p>
                <p className="text-sm text-muted-foreground">{checkedIn} / {totalGuests}</p>
              </div>
              <div className="w-full h-3 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-gold/80 to-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${checkinPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              {checkinPercentage === 100 && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-emerald-500 font-medium mt-2 flex items-center gap-1"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Tous les invités sont enregistrés !
                </motion.p>
              )}
            </CardContent>
          </Card>

          {/* Search/Scan Interface */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email ou code QR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-base bg-background/50 border-gold/20 focus:border-gold/50 rounded-xl"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold"
              >
                Effacer
              </Button>
            )}
          </div>

          {/* Recent Check-ins */}
          {recentCheckins.length > 0 && !search && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Check-ins récents
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recentCheckins.map((guest) => (
                  <motion.div
                    key={guest.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 shrink-0"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" />
                    <span className="text-xs font-medium text-sky-500">
                      {guest.firstName} {guest.lastName}
                    </span>
                    {guest.checkedInAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(guest.checkedInAt)}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Guest List */}
          <div className="space-y-2 max-h-[55vh] overflow-y-auto">
            <AnimatePresence>
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {search ? "Aucun invité trouvé" : "Aucun invité à afficher"}
                  </p>
                </motion.div>
              ) : (
                filtered.map((guest, index) => {
                  const status = statusConfig[guest.status] || statusConfig.INVITED
                  const isExpanded = expandedGuest === guest.id
                  const isCheckedIn = guest.status === "PRESENT"

                  return (
                    <motion.div
                      key={guest.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className={`rounded-xl border transition-all ${
                        isCheckedIn
                          ? "bg-sky-500/5 border-sky-500/20"
                          : "bg-card border-border/50 hover:border-gold/10"
                      }`}
                    >
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => setExpandedGuest(isExpanded ? null : guest.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            isCheckedIn
                              ? "bg-sky-500/20 text-sky-500"
                              : "bg-gold/10 text-gold"
                          }`}>
                            {isCheckedIn ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              `${guest.firstName[0]}${guest.lastName[0]}`
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {guest.firstName} {guest.lastName}
                              </p>
                              <Badge variant="outline" className={`text-[10px] ${status.bgColor} ${status.color}`}>
                                {status.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {guest.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />{guest.email}
                                </span>
                              )}
                              {guest.table && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />Table {guest.table.number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isCheckedIn && guest.status !== "DECLINED" && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openCheckinDialog(guest)
                              }}
                              className="btn-gold rounded-full text-xs h-8"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Check-in
                            </Button>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-1 border-t border-border/30">
                              <div className="grid grid-cols-2 gap-3 mt-3">
                                {guest.phone && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3 text-gold" />
                                    {guest.phone}
                                  </div>
                                )}
                                {guest.seatNumber && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3 text-gold" />
                                    Siège {guest.seatNumber}
                                  </div>
                                )}
                                {guest.plusOne && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3 text-gold" />
                                    +1{guest.plusOneName ? ` (${guest.plusOneName})` : ""}
                                  </div>
                                )}
                                {guest.dietaryReq && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <AlertCircle className="h-3 w-3 text-gold" />
                                    {guest.dietaryReq}
                                  </div>
                                )}
                                {guest.checkedInAt && (
                                  <div className="flex items-center gap-2 text-xs text-sky-500">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Enregistré {formatTime(guest.checkedInAt)}
                                  </div>
                                )}
                              </div>
                              {!isCheckedIn && guest.status !== "DECLINED" && (
                                <Button
                                  onClick={() => openCheckinDialog(guest)}
                                  className="w-full btn-gold rounded-full mt-3 text-xs h-9"
                                >
                                  <UserCheck className="h-3.5 w-3.5 mr-2" />
                                  Confirmer l&apos;arrivée
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Check-in Confirmation Dialog */}
      <Dialog open={showCheckinDialog} onOpenChange={setShowCheckinDialog}>
        <DialogContent className="sm:max-w-md glass-dark border-gold/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 gradient-gold-text font-heading">
              <QrCode className="h-5 w-5 text-gold" />
              Confirmer l&apos;arrivée
            </DialogTitle>
            <DialogDescription>Vérifiez les informations avant d&apos;enregistrer</DialogDescription>
          </DialogHeader>

          {selectedGuest && (
            <AnimatePresence mode="wait">
              {checkinSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center py-8 gap-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </motion.div>
                  </motion.div>
                  <div className="text-center">
                    <p className="font-heading font-semibold text-lg">
                      {selectedGuest.firstName} {selectedGuest.lastName}
                    </p>
                    <p className="text-sm text-emerald-500 font-medium">Arrivée confirmée !</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 mt-2"
                >
                  {/* Guest Info Card */}
                  <div className="rounded-xl border border-gold/20 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-black text-lg font-bold">
                        {selectedGuest.firstName[0]}{selectedGuest.lastName[0]}
                      </div>
                      <div>
                        <p className="font-heading font-semibold">
                          {selectedGuest.firstName} {selectedGuest.lastName}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] mt-1 ${statusConfig[selectedGuest.status]?.bgColor} ${statusConfig[selectedGuest.status]?.color}`}
                        >
                          {statusConfig[selectedGuest.status]?.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {selectedGuest.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 text-gold" />
                          {selectedGuest.email}
                        </div>
                      )}
                      {selectedGuest.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 text-gold" />
                          {selectedGuest.phone}
                        </div>
                      )}
                      {selectedGuest.table && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-gold" />
                          Table {selectedGuest.table.number} - {selectedGuest.table.name}
                        </div>
                      )}
                      {selectedGuest.plusOne && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-3.5 w-3.5 text-gold" />
                          +1{selectedGuest.plusOneName ? ` (${selectedGuest.plusOneName})` : ""}
                        </div>
                      )}
                      {selectedGuest.dietaryReq && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-3.5 w-3.5 text-gold" />
                          {selectedGuest.dietaryReq}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => checkInGuest(selectedGuest)}
                    className="w-full btn-gold rounded-full py-5"
                    disabled={isCheckingIn}
                  >
                    {isCheckingIn ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Confirmer l&apos;arrivée
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
