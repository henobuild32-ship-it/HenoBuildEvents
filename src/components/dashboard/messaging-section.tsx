"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  MessageCircle, Send, Megaphone, User, Users,
  Search, Plus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

interface Message {
  id: string
  subject?: string
  content: string
  isAnnouncement: boolean
  isRead: boolean
  createdAt: string
  recipient?: {
    id: string
    firstName: string
    lastName: string
  }
}

export function MessagingSection() {
  const { auth, currentEventId, events } = useStore()
  const [messages] = useState<Message[]>([])
  const [isComposing, setIsComposing] = useState(false)
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")

  const currentEvent = events.find((e) => e.id === currentEventId)

  const handleSend = () => {
    if (!content.trim()) {
      toast.error("Le message ne peut pas être vide")
      return
    }
    toast.success(isAnnouncement ? "Annonce envoyée à tous les invités" : "Message envoyé")
    setIsComposing(false)
    setContent("")
    setSubject("")
    setIsAnnouncement(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-gold" />
            Messages
          </h2>
          <p className="text-sm text-muted-foreground">
            Communiquez avec vos invités
          </p>
        </div>
        <Button
          onClick={() => setIsComposing(!isComposing)}
          className="btn-gold rounded-full"
          disabled={!currentEventId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau message
        </Button>
      </div>

      {/* Compose form */}
      {isComposing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-gold/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                {isAnnouncement ? (
                  <Megaphone className="h-5 w-5 text-gold" />
                ) : (
                  <MessageCircle className="h-5 w-5 text-gold" />
                )}
                {isAnnouncement ? "Nouvelle annonce" : "Nouveau message"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-gold" />
                  <Label htmlFor="announcement" className="text-sm cursor-pointer">Mode annonce (envoyer à tous)</Label>
                </div>
                <Switch
                  id="announcement"
                  checked={isAnnouncement}
                  onCheckedChange={setIsAnnouncement}
                />
              </div>

              {!isAnnouncement && (
                <div className="space-y-2">
                  <Label>Destinataire</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un invité..."
                      className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Sujet</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Sujet du message"
                  className="bg-background/50 border-gold/20 focus:border-gold/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="bg-background/50 border-gold/20 focus:border-gold/50 min-h-[120px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSend} className="btn-gold rounded-full">
                  <Send className="h-4 w-4 mr-2" />
                  {isAnnouncement ? "Envoyer l'annonce" : "Envoyer"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsComposing(false)
                    setContent("")
                    setSubject("")
                  }}
                  className="text-muted-foreground"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Messages list */}
      {!currentEventId ? (
        <div className="text-center py-16">
          <MessageCircle className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Sélectionnez un événement pour voir les messages</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">Aucun message</h3>
          <p className="text-muted-foreground mb-6">Commencez par envoyer un message ou une annonce</p>
          <Button onClick={() => setIsComposing(true)} className="btn-gold rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau message
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <Card key={message.id} className="border-border/50 hover:border-gold/10 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      message.isAnnouncement ? "gradient-gold text-black" : "bg-gold/10 text-gold"
                    }`}>
                      {message.isAnnouncement ? (
                        <Megaphone className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{message.subject || "Sans sujet"}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{message.content}</p>
                    </div>
                  </div>
                  {message.isAnnouncement && (
                    <Badge className="gradient-gold text-black text-[10px] border-0">Annonce</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
