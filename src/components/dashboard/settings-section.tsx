"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Settings, User, Bell, Palette, Shield, LogOut,
  Mail, Phone, MapPin, Building, Sparkles, Download
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useStore } from "@/lib/store"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { InstallButton } from "@/components/install-button"

export function SettingsSection() {
  const { user, auth, logout, setCurrentView } = useStore()
  const { theme, setTheme } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: "",
    city: "",
    bio: "",
  })

  const handleSaveProfile = async () => {
    toast.success("Profil mis à jour avec succès")
    setIsEditing(false)
  }

  const handleLogout = () => {
    logout()
    setCurrentView("landing")
  }

  const displayName = user?.name || user?.email || "Utilisateur"
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : displayName.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-gold" />
          Paramètres
        </h2>
        <p className="text-sm text-muted-foreground">Gérez votre profil et vos préférences</p>
      </div>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <User className="h-5 w-5 text-gold" />
                Profil
              </CardTitle>
              <Button
                variant="ghost"
                onClick={() => setIsEditing(!isEditing)}
                className="text-gold hover:text-gold-light hover:bg-gold/5"
              >
                {isEditing ? "Annuler" : "Modifier"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-gold/30">
                <AvatarFallback className="gradient-gold text-black text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading font-semibold text-lg">{displayName}</p>
                <p className="text-sm text-muted-foreground">{user?.role === "organizer" ? "Organisateur" : user?.role}</p>
                <p className="text-xs text-muted-foreground">Membre depuis {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "récemment"}</p>
              </div>
            </div>

            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pt-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="bg-background/50 border-gold/20 focus:border-gold/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="bg-background/50 border-gold/20 focus:border-gold/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} className="btn-gold rounded-full">
                  Sauvegarder
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme preferences */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Palette className="h-5 w-5 text-gold" />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Mode sombre</p>
                <p className="text-xs text-muted-foreground">Basculer entre le mode clair et sombre</p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Bell className="h-5 w-5 text-gold" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Confirmations d'invités", description: "Recevoir une notification quand un invité confirme" },
              { label: "Rappels d'événements", description: "Rappels avant la date de l'événement" },
              { label: "Messages", description: "Notifications pour les nouveaux messages" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Install app */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Download className="h-5 w-5 text-gold" />
              Installer l&apos;application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/30">
              <Sparkles className="h-8 w-8 text-gold" />
              <p className="text-sm text-center text-muted-foreground">
                Installez HenoBuild sur votre appareil pour un accès rapide
              </p>
              <InstallButton />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Zone danger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
              <div>
                <p className="text-sm font-medium">Déconnexion</p>
                <p className="text-xs text-muted-foreground">Se déconnecter de votre compte</p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Created by HenoBuild */}
      <div className="text-center pt-4 pb-8">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40">
          Created by HenoBuild
        </p>
      </div>
    </div>
  )
}
