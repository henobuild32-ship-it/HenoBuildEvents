"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Settings, User, Bell, Palette, Shield, LogOut,
  Mail, Phone, MapPin, Building, Sparkles, Download,
  Lock, Trash2, Globe, Info, ChevronDown, ChevronUp,
  Eye, EyeOff, Building2, PenLine, AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useStore } from "@/lib/store"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { InstallButton } from "@/components/install-button"

const languages = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
]

export function SettingsSection() {
  const { user, auth, logout, setCurrentView, setUser } = useStore()
  const { theme, setTheme } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [language, setLanguage] = useState("fr")
  const [showAbout, setShowAbout] = useState(false)

  // Profile form with comprehensive fields
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: user?.company || "",
    city: user?.city || "",
    bio: user?.bio || "",
  })

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSaveProfile = async () => {
    if (!auth.token) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          ...profileForm,
          name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la mise à jour")
        return
      }

      // Update store with new user data
      if (data.user) {
        setUser(data.user)
      }

      toast.success("Profil mis à jour avec succès")
      setIsEditing(false)
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!auth.token) return

    if (passwordForm.newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    if (!passwordForm.currentPassword) {
      toast.error("Veuillez saisir votre mot de passe actuel")
      return
    }

    setIsChangingPassword(true)
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(passwordForm),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erreur lors du changement de mot de passe")
        return
      }

      toast.success("Mot de passe modifié avec succès")
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!auth.token) return

    if (!deletePassword) {
      toast.error("Veuillez saisir votre mot de passe pour supprimer votre compte")
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la suppression du compte")
        return
      }

      toast.success("Compte supprimé avec succès")
      logout()
      setCurrentView("landing")
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = () => {
    logout()
    setCurrentView("landing")
  }

  const displayName = user?.name || user?.email || "Utilisateur"
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : displayName.slice(0, 2).toUpperCase()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      className="space-y-6 max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-gold" />
          Paramètres
        </h2>
        <p className="text-sm text-muted-foreground">Gérez votre profil et vos préférences</p>
      </motion.div>

      {/* Profile card */}
      <motion.div variants={itemVariants}>
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

            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {[
                  { label: "Prénom", value: user?.firstName || "—" },
                  { label: "Nom", value: user?.lastName || "—" },
                  { label: "Email", value: user?.email || "—" },
                  { label: "Téléphone", value: user?.phone || "—" },
                  { label: "Entreprise", value: user?.company || "—" },
                  { label: "Ville", value: user?.city || "—" },
                ].map((item) => (
                  <div key={item.label} className="p-2.5 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium mt-0.5">{item.value}</p>
                  </div>
                ))}
                {user?.bio && (
                  <div className="col-span-full p-2.5 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Bio</p>
                    <p className="text-sm font-medium mt-0.5">{user.bio}</p>
                  </div>
                )}
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Entreprise</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={profileForm.company}
                          onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                          className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                          placeholder="Mon entreprise"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                          placeholder="Paris"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <div className="relative">
                      <PenLine className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50 min-h-[80px] pt-3"
                        placeholder="Parlez-nous de vous..."
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="btn-gold rounded-full"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sauvegarde...
                      </span>
                    ) : (
                      "Sauvegarder"
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Change */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Lock className="h-5 w-5 text-gold" />
              Changer le mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="pl-10 pr-10 bg-background/50 border-gold/20 focus:border-gold/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="pl-10 pr-10 bg-background/50 border-gold/20 focus:border-gold/50"
                  placeholder="Minimum 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.newPassword && passwordForm.newPassword.length < 6 && (
                <p className="text-xs text-destructive">Au moins 6 caractères requis</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="pl-10 pr-10 bg-background/50 border-gold/20 focus:border-gold/50"
                  placeholder="Retapez le nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={
                isChangingPassword ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword ||
                passwordForm.newPassword !== passwordForm.confirmPassword ||
                passwordForm.newPassword.length < 6
              }
              className="btn-gold rounded-full"
            >
              {isChangingPassword ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Modification...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Changer le mot de passe
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Language Preference */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Globe className="h-5 w-5 text-gold" />
              Langue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <motion.button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code)
                    toast.success(lang.code === "fr" ? "Langue : Français" : "Language: English")
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all ${
                    language === lang.code
                      ? "border-gold/60 bg-gold/10 text-gold shadow-md shadow-gold/10"
                      : "border-border/50 hover:border-gold/20 text-muted-foreground hover:text-gold"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {language === lang.code && (
                    <Check className="h-4 w-4 ml-auto text-gold" />
                  )}
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {language === "fr"
                ? "L'interface est actuellement en français. La version anglaise sera bientôt disponible."
                : "The interface is currently in French. English version coming soon."
              }
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme preferences */}
      <motion.div variants={itemVariants}>
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
      <motion.div variants={itemVariants}>
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
      <motion.div variants={itemVariants}>
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

      {/* About HenoBuild */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <button
              type="button"
              onClick={() => setShowAbout(!showAbout)}
              className="w-full flex items-center justify-between"
            >
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Info className="h-5 w-5 text-gold" />
                À propos
              </CardTitle>
              <motion.div
                animate={{ rotate: showAbout ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </motion.div>
            </button>
          </CardHeader>
          <AnimatePresence>
            {showAbout && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="space-y-4 pt-0">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/20">
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-gold shadow-lg shadow-gold/20">
                        <Sparkles className="h-7 w-7 text-black" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-bold text-gold">HenoBuild Event</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Version 1.0.0</p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        HenoBuild est votre plateforme premium de gestion d&apos;événements.
                        Créez des événements élégants, gérez vos invités, envoyez des invitations
                        numériques avec QR codes, organisez vos tables et partagez vos plus beaux
                        souvenirs dans la galerie.
                      </p>
                      <Separator className="bg-gold/20" />
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">
                          ✨ Gestion d&apos;événements premium
                        </p>
                        <p className="text-xs text-muted-foreground">
                          🎫 Invitations digitales avec QR codes
                        </p>
                        <p className="text-xs text-muted-foreground">
                          📊 Suivi RSVP en temps réel
                        </p>
                        <p className="text-xs text-muted-foreground">
                          🪑 Plan de table interactif
                        </p>
                        <p className="text-xs text-muted-foreground">
                          📸 Galerie photo collaborative
                        </p>
                      </div>
                      <Separator className="bg-gold/20" />
                      <div className="pt-1">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                          Created by HenoBuild
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1">
                          © {new Date().getFullYear()} HenoBuild. Tous droits réservés.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Danger zone */}
      <motion.div variants={itemVariants}>
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

            {/* Account deletion */}
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Supprimer le compte</p>
                  <p className="text-xs text-muted-foreground">
                    Cette action est irréversible. Toutes vos données, événements et invités seront définitivement supprimés.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirmez avec votre mot de passe"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="pl-10 bg-background/50 border-destructive/20 focus:border-destructive/50 text-sm"
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={!deletePassword || isDeleting}
                      className="rounded-full shrink-0"
                    >
                      {isDeleting ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Supprimer définitivement le compte ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Toutes vos données seront définitivement supprimées,
                        y compris vos événements, invités, tables, invitations, galerie et messages.
                        Vous ne pourrez pas récupérer votre compte.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeletePassword("")}>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Created by HenoBuild */}
      <motion.div variants={itemVariants} className="text-center pt-4 pb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/5 border border-gold/10">
          <Sparkles className="h-3 w-3 text-gold" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold/60 font-bold">
            Created by HenoBuild
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
