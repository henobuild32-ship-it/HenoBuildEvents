"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import {
  Mail, Send, QrCode, Eye, Check, Clock,
  Copy, Download, Share2, Calendar, MapPin, User,
  LayoutGrid, List, Link2, Sparkles
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

interface Invitation {
  id: string
  uniqueLink: string
  qrCodeData?: string
  isUsed: boolean
  usedAt?: string
  isSent: boolean
  sentAt?: string
  message?: string
  createdAt: string
  guest: {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    status: string
  }
}

// Stagger animation variants
const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
}

const staggerGridItem = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
}

// Skeleton loading component
function InvitationSkeleton({ isCard }: { isCard?: boolean }) {
  if (isCard) {
    return (
      <Card className="border-border/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full shimmer-load" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-24 rounded shimmer-load" />
              <div className="h-2.5 w-32 rounded shimmer-load" />
            </div>
          </div>
          <div className="h-8 w-20 rounded-full shimmer-load" />
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="h-24 bg-muted/30 rounded-xl shimmer-load" />
  )
}

type ViewMode = "list" | "cards"

export function InvitationManagement() {
  const { auth, currentEventId, events } = useStore()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const currentEvent = events.find((e) => e.id === currentEventId)

  useEffect(() => {
    if (currentEventId) fetchInvitations()
  }, [currentEventId])

  const fetchInvitations = async () => {
    if (!currentEventId || !auth.token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/invitations?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setInvitations(data.invitations || [])
      }
    } catch (err) {
      console.error("Failed to fetch invitations:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const sendInvitation = async (invitationId: string) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/invitations/${invitationId}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === invitationId ? { ...inv, isSent: true, sentAt: new Date().toISOString() } : inv
          )
        )
        toast.success("Invitation envoyée !")
      } else {
        toast.error("Erreur lors de l'envoi")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    }
  }

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invitation/${link}`)
    toast.success("Lien copié dans le presse-papiers !")
  }

  const shareInvitation = async (invitation: Invitation) => {
    const link = `${window.location.origin}/invitation/${invitation.uniqueLink}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invitation - ${currentEvent?.title || "Événement"}`,
          text: `Vous êtes invité(e) à ${currentEvent?.title || "notre événement"} !`,
          url: link,
        })
      } catch {
        copyLink(invitation.uniqueLink)
      }
    } else {
      copyLink(invitation.uniqueLink)
    }
  }

  const shareAllLinks = () => {
    const links = invitations
      .map((inv) => `${inv.guest.firstName} ${inv.guest.lastName}: ${window.location.origin}/invitation/${inv.uniqueLink}`)
      .join("\n")
    navigator.clipboard.writeText(links)
    toast.success(`${invitations.length} lien${invitations.length > 1 ? "s" : ""} copié${invitations.length > 1 ? "s" : ""} dans le presse-papiers !`)
  }

  const sentCount = invitations.filter((i) => i.isSent).length
  const pendingCount = invitations.filter((i) => !i.isSent).length
  const usedCount = invitations.filter((i) => i.isUsed).length

  const filteredInvitations = invitations.filter((inv) =>
    `${inv.guest.firstName} ${inv.guest.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.guest.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    sent: { label: "Envoyée", color: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5", icon: Send },
    pending: { label: "En attente", color: "border-amber-500/30 text-amber-500 bg-amber-500/5", icon: Clock },
    used: { label: "Utilisée", color: "border-blue-500/30 text-blue-500 bg-blue-500/5", icon: Check },
  }

  const getInvitationUrl = (uniqueLink: string) => `${window.location.origin}/invitation/${uniqueLink}`

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.isUsed) return statusConfig.used
    if (invitation.isSent) return statusConfig.sent
    return statusConfig.pending
  }

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
            <Mail className="h-6 w-6 text-gold" />
            Invitations
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentEvent ? currentEvent.title : "Sélectionnez un événement"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {invitations.length > 0 && (
            <div className="flex items-center bg-muted/30 rounded-full p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === "list" ? "bg-gold text-black" : "text-muted-foreground hover:text-gold"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-full transition-all ${
                  viewMode === "cards" ? "bg-gold text-black" : "text-muted-foreground hover:text-gold"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          )}
          {/* Share all button */}
          {invitations.length > 0 && (
            <Button
              onClick={shareAllLinks}
              variant="outline"
              className="btn-outline-gold border-gold/30 rounded-full"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Copier tous les liens
            </Button>
          )}
          {invitations.length > 0 && (
            <Button
              onClick={() => {
                invitations.filter(i => !i.isSent).forEach(i => sendInvitation(i.id))
              }}
              className="btn-gold rounded-full"
              disabled={pendingCount === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer tout ({pendingCount})
            </Button>
          )}
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
          { value: invitations.length, label: "Total", color: "", bg: "bg-gradient-to-br from-muted/50 to-muted/20" },
          { value: sentCount, label: "Envoyées", color: "text-emerald-500", bg: "bg-gradient-to-br from-emerald-500/8 to-emerald-500/3" },
          { value: pendingCount, label: "En attente", color: "text-amber-500", bg: "bg-gradient-to-br from-amber-500/8 to-amber-500/3" },
          { value: usedCount, label: "Utilisées", color: "text-blue-500", bg: "bg-gradient-to-br from-blue-500/8 to-blue-500/3" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <Card className="border-border/50 hover:border-gold/10 transition-all">
              <CardContent className={`p-4 text-center ${stat.bg}`}>
                <p className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search */}
      {invitations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="relative"
        >
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une invitation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
          />
        </motion.div>
      )}

      {/* Invitation list/cards */}
      {!currentEventId ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Mail className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Sélectionnez un événement pour gérer les invitations</p>
        </motion.div>
      ) : isLoading ? (
        viewMode === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <InvitationSkeleton key={i} isCard />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <InvitationSkeleton key={i} />
            ))}
          </div>
        )
      ) : invitations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-gold/5 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-10 w-10 text-gold/30" />
          </div>
          <h3 className="font-heading text-xl font-semibold mb-2">Aucune invitation</h3>
          <p className="text-muted-foreground text-sm mb-4">Les invitations sont créées automatiquement lorsque vous ajoutez des invités</p>
          <p className="text-xs text-muted-foreground">Ajoutez des invités depuis la section &quot;Invités&quot; pour commencer</p>
        </motion.div>
      ) : viewMode === "cards" ? (
        /* Card view mode */
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredInvitations.map((invitation) => {
            const status = getInvitationStatus(invitation)
            const StatusIcon = status.icon

            return (
              <motion.div key={invitation.id} variants={staggerGridItem}>
                <Card className="border-border/50 hover:border-gold/15 transition-all group overflow-hidden relative">
                  {/* Decorative gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/3 via-transparent to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <CardContent className="p-4 relative">
                    {/* Guest info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/10 transition-all">
                        <span className="text-sm font-bold text-gold">
                          {invitation.guest.firstName[0]}{invitation.guest.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {invitation.guest.firstName} {invitation.guest.lastName}
                        </p>
                        {invitation.guest.email && (
                          <p className="text-xs text-muted-foreground truncate">{invitation.guest.email}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${status.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    {/* QR Code mini preview */}
                    <div className="flex justify-center mb-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <QRCodeSVG
                          value={getInvitationUrl(invitation.uniqueLink)}
                          size={80}
                          level="L"
                          imageSettings={{
                            src: "/henobuildEvents.png",
                            height: 16,
                            width: 16,
                            excavate: true,
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      {!invitation.isSent && (
                        <Button
                          size="sm"
                          onClick={() => sendInvitation(invitation.id)}
                          className="btn-gold rounded-full text-xs h-7 px-3"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Envoyer
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(invitation.uniqueLink)}
                        className="btn-outline-gold border-gold/30 rounded-full text-xs h-7 px-3"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInvitation(invitation)
                          setShowQR(true)
                        }}
                        className="text-muted-foreground hover:text-gold rounded-full text-xs h-7 px-3"
                      >
                        <QrCode className="h-3 w-3 mr-1" />
                        QR
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => shareInvitation(invitation)}
                        className="text-muted-foreground hover:text-gold rounded-full text-xs h-7 px-3"
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        /* List view mode (default) */
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 scroll-smooth-gold"
        >
          <AnimatePresence>
            {filteredInvitations.map((invitation) => {
              const status = getInvitationStatus(invitation)
              const StatusIcon = status.icon

              return (
                <motion.div
                  key={invitation.id}
                  variants={staggerItem}
                  layout
                >
                  <Card className="border-border/50 hover:border-gold/10 transition-all group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/10 transition-all">
                            <User className="h-5 w-5 text-gold" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {invitation.guest.firstName} {invitation.guest.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {invitation.guest.email && <span>{invitation.guest.email}</span>}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {!invitation.isSent && (
                          <Button
                            size="sm"
                            onClick={() => sendInvitation(invitation.id)}
                            className="btn-gold rounded-full text-xs h-8"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Envoyer
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(invitation.uniqueLink)}
                          className="btn-outline-gold border-gold/30 rounded-full text-xs h-8"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copier le lien
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvitation(invitation)
                            setShowQR(true)
                          }}
                          className="text-muted-foreground hover:text-gold rounded-full text-xs h-8"
                        >
                          <QrCode className="h-3 w-3 mr-1" />
                          QR Code
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvitation(invitation)
                            setShowPreview(true)
                          }}
                          className="text-muted-foreground hover:text-gold rounded-full text-xs h-8"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Aperçu
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareInvitation(invitation)}
                          className="text-muted-foreground hover:text-gold rounded-full text-xs h-8"
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Partager
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* QR Code Dialog with animated entrance */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-sm glass-dark border-gold/20">
          <DialogHeader>
            <DialogTitle className="gradient-gold-text font-heading flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code d&apos;accès
            </DialogTitle>
          </DialogHeader>
          {selectedInvitation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-6 py-4"
            >
              <motion.div
                initial={{ rotateY: 90 }}
                animate={{ rotateY: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="p-4 bg-white rounded-2xl shadow-lg"
              >
                <QRCodeSVG
                  value={getInvitationUrl(selectedInvitation.uniqueLink)}
                  size={200}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/henobuildEvents.png",
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </motion.div>
              <div className="text-center space-y-2">
                <p className="font-heading font-semibold">
                  {selectedInvitation.guest.firstName} {selectedInvitation.guest.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Scannez ce code à l&apos;entrée de l&apos;événement
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => copyLink(selectedInvitation.uniqueLink)}
                  className="flex-1 btn-gold rounded-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le lien
                </Button>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
                Created by HenoBuild
              </p>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog with animated entrance */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-md glass-dark border-gold/20">
          <DialogHeader>
            <DialogTitle className="gradient-gold-text font-heading">Aperçu de l&apos;invitation</DialogTitle>
          </DialogHeader>
          {selectedInvitation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="rounded-2xl overflow-hidden border border-gold/20 shadow-xl"
            >
              {/* Card header */}
              <div className="gradient-gold p-6 text-center relative">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-4 w-16 h-16 border border-black/10 rounded-full" />
                  <div className="absolute bottom-2 left-4 w-12 h-12 border border-black/10 rounded-full" />
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/60 mb-2 relative">
                  Vous êtes invité
                </p>
                <h3 className="font-heading text-xl font-bold text-black relative">
                  {currentEvent?.title || "Événement"}
                </h3>
              </div>

              {/* Card body */}
              <div className="bg-card p-6 space-y-5 text-center">
                <div className="space-y-2">
                  {currentEvent?.date && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-gold" />
                      <span className="text-xs uppercase tracking-wider">
                        {new Date(currentEvent.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {currentEvent?.location && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-gold" />
                      <span className="text-xs">{currentEvent.location}</span>
                    </div>
                  )}
                </div>

                <div className="divider-gold" />

                <p className="text-sm text-muted-foreground italic">
                  &ldquo;Chère/Cher {selectedInvitation.guest.firstName}, nous serions honorés de votre présence&rdquo;
                </p>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <QRCodeSVG
                      value={getInvitationUrl(selectedInvitation.uniqueLink)}
                      size={120}
                      level="M"
                      imageSettings={{
                        src: "/henobuildEvents.png",
                        height: 24,
                        width: 24,
                        excavate: true,
                      }}
                    />
                  </div>
                </div>

                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
                  Created by HenoBuild
                </p>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
