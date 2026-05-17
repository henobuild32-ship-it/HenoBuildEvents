"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles, CalendarDays, MapPin, Clock, FileText, ChevronRight,
  ChevronLeft, Check, Palette, Heart, Diamond, Cake, Droplets,
  Mic, Crown, Star, Wine, GraduationCap, Church, Settings,
  Users as UsersIcon, Eye, Upload, X, ImagePlus, PartyPopper,
  Briefcase, Users, Landmark, ChurchIcon, Cross
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

const eventTypes = [
  { value: "WEDDING", label: "Mariage", icon: Heart, color: "#e11d48" },
  { value: "ENGAGEMENT", label: "Fiançailles", icon: Diamond, color: "#a855f7" },
  { value: "BIRTHDAY", label: "Anniversaire", icon: Cake, color: "#f97316" },
  { value: "BAPTISM", label: "Baptême", icon: Droplets, color: "#3b82f6" },
  { value: "CONFERENCE", label: "Conférence", icon: Mic, color: "#6366f1" },
  { value: "CEREMONY", label: "Cérémonie", icon: Crown, color: "#d4a853" },
  { value: "PRIVATE_PARTY", label: "Soirée privée", icon: PartyPopper, color: "#ec4899" },
  { value: "VIP", label: "Soirée VIP", icon: Star, color: "#d4a853" },
  { value: "GRADUATION", label: "Diplômes", icon: GraduationCap, color: "#14b8a6" },
  { value: "RELIGIOUS", label: "Religieux", icon: Church, color: "#8b5cf6" },
  { value: "FAMILY", label: "Familial", icon: Users, color: "#22c55e" },
  { value: "PROFESSIONAL", label: "Professionnel", icon: Briefcase, color: "#0ea5e9" },
  { value: "GALA", label: "Gala", icon: Wine, color: "#722f37" },
  { value: "COCKTAIL", label: "Cocktail", icon: Sparkles, color: "#f59e0b" },
  { value: "MEETING", label: "Réunion", icon: Landmark, color: "#64748b" },
  { value: "CUSTOM", label: "Personnalisé", icon: Settings, color: "#78716c" },
]

const themeOptions = [
  { value: "LUXURIOUS", label: "Luxueux", colors: ["#d4a853", "#1a1a2e", "#f5e6c8"], icon: "✨" },
  { value: "MODERN", label: "Moderne", colors: ["#2d2d2d", "#ffffff", "#e0e0e0"], icon: "🔲" },
  { value: "ROMANTIC", label: "Romantique", colors: ["#e8a0bf", "#fff0f5", "#c77da6"], icon: "💕" },
  { value: "AFRICAN", label: "Africain", colors: ["#d4a853", "#2d5016", "#8b4513"], icon: "🌍" },
  { value: "VIP", label: "VIP", colors: ["#d4a853", "#0a0a0a", "#1a1a2e"], icon: "👑" },
  { value: "MINIMALIST", label: "Minimaliste", colors: ["#f5f5f5", "#333333", "#e0e0e0"], icon: "⬜" },
  { value: "RUSTIC", label: "Rustique", colors: ["#8b6914", "#556b2f", "#d2b48c"], icon: "🌿" },
  { value: "BOHEMIAN", label: "Bohème", colors: ["#c19a6b", "#e8d5b7", "#8fbc8f"], icon: "🪶" },
  { value: "VINTAGE", label: "Vintage", colors: ["#c9b037", "#f5e6c8", "#8b7355"], icon: "📻" },
  { value: "TROPICAL", label: "Tropical", colors: ["#ff6b35", "#004e89", "#2ec4b6"], icon: "🌴" },
  { value: "ELEGANT", label: "Élégant", colors: ["#1a1a2e", "#d4a853", "#f5f5f5"], icon: "🎩" },
  { value: "FESTIVE", label: "Festif", colors: ["#e74c3c", "#f1c40f", "#2ecc71"], icon: "🎊" },
  { value: "CUSTOM", label: "Personnalisé", colors: ["#d4a853", "#722f37", "#0a0a0a"], icon: "🎨" },
]

const steps = [
  { number: 1, title: "Informations", description: "Type, titre, date" },
  { number: 2, title: "Détails", description: "Description, thème" },
  { number: 3, title: "Personnalisation", description: "Couleurs, image" },
  { number: 4, title: "Révision", description: "Vérifier & créer" },
]

export function EventCreate() {
  const { auth, setActiveSection, addEvent, updateEvent, eventToEdit, setEventToEdit } = useStore()
  const isEditMode = !!eventToEdit
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: "",
    type: "CUSTOM",
    date: "",
    time: "",
    location: "",
    address: "",
    city: "",
    description: "",
    dressCode: "",
    theme: "MODERN",
    maxGuests: "",
    allowPlusOne: false,
    primaryColor: "#d4a853",
    secondaryColor: "#722f37",
    accentColor: "#0a0a0a",
    isPrivate: false,
    hostName: "",
    rsvpDeadline: "",
    notes: "",
    coverImage: "",
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (eventToEdit) {
      const eventDate = new Date(eventToEdit.date)
      const dateStr = eventDate.toISOString().split("T")[0]
      const timeStr = eventDate.toTimeString ? eventDate.toTimeString().slice(0, 5) : ""
      setForm({
        title: eventToEdit.title || "",
        type: (eventToEdit as Record<string, unknown>).type as string || "CUSTOM",
        date: dateStr,
        time: timeStr,
        location: eventToEdit.location || "",
        address: ((eventToEdit as Record<string, unknown>).address as string) || "",
        city: ((eventToEdit as Record<string, unknown>).city as string) || "",
        description: eventToEdit.description || "",
        dressCode: ((eventToEdit as Record<string, unknown>).dressCode as string) || "",
        theme: ((eventToEdit as Record<string, unknown>).theme as string) || "MODERN",
        maxGuests: ((eventToEdit as Record<string, unknown>).maxGuests as number)?.toString() || ((eventToEdit as Record<string, unknown>).maxAttendees as number)?.toString() || "",
        allowPlusOne: ((eventToEdit as Record<string, unknown>).allowPlusOne as boolean) || false,
        primaryColor: ((eventToEdit as Record<string, unknown>).primaryColor as string) || "#d4a853",
        secondaryColor: ((eventToEdit as Record<string, unknown>).secondaryColor as string) || "#722f37",
        accentColor: ((eventToEdit as Record<string, unknown>).accentColor as string) || "#0a0a0a",
        isPrivate: ((eventToEdit as Record<string, unknown>).isPrivate as boolean) || false,
        hostName: ((eventToEdit as Record<string, unknown>).hostName as string) || "",
        rsvpDeadline: ((eventToEdit as Record<string, unknown>).rsvpDeadline as string)
          ? new Date((eventToEdit as Record<string, unknown>).rsvpDeadline as string).toISOString().split("T")[0]
          : "",
        notes: ((eventToEdit as Record<string, unknown>).notes as string) || "",
        coverImage: eventToEdit.coverImage || "",
      })
    }
  }, [eventToEdit])

  const updateForm = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Auto-set colors when theme changes
  const handleThemeChange = useCallback((theme: string) => {
    const themeData = themeOptions.find((t) => t.value === theme)
    if (themeData && theme !== "CUSTOM") {
      setForm((prev) => ({
        ...prev,
        theme,
        primaryColor: themeData.colors[0],
        secondaryColor: themeData.colors[1],
        accentColor: themeData.colors[2],
      }))
    } else {
      setForm((prev) => ({ ...prev, theme }))
    }
  }, [])

  // Cover image upload handler
  const handleCoverImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      updateForm("coverImage", base64)
      toast.success("Image de couverture ajoutée")
    }
    reader.readAsDataURL(file)
  }, [updateForm])

  const handleSubmit = async () => {
    if (!form.title || !form.date) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    setIsLoading(true)
    try {
      const eventDate = new Date(`${form.date}T${form.time || "12:00"}`)
      const body = JSON.stringify({
        title: form.title,
        type: form.type,
        date: eventDate.toISOString(),
        location: form.location,
        address: form.address,
        city: form.city,
        description: form.description,
        dressCode: form.dressCode,
        theme: form.theme,
        maxGuests: form.maxGuests ? parseInt(form.maxGuests) : undefined,
        allowPlusOne: form.allowPlusOne,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        accentColor: form.accentColor,
        isPrivate: form.isPrivate,
        hostName: form.hostName,
        rsvpDeadline: form.rsvpDeadline || undefined,
        notes: form.notes,
        coverImage: form.coverImage || undefined,
      })

      if (isEditMode && eventToEdit) {
        // Edit mode: PUT to /api/events/[id]
        const res = await fetch(`/api/events/${eventToEdit.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body,
        })

        const data = await res.json()

        if (!res.ok) {
          toast.error(data.error || "Erreur lors de la mise à jour")
          return
        }

        updateEvent(eventToEdit.id, data.event)
        toast.success("Événement modifié avec succès !")
        setEventToEdit(null)
      } else {
        // Create mode: POST to /api/events
        const res = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body,
        })

        const data = await res.json()

        if (!res.ok) {
          toast.error(data.error || "Erreur lors de la création")
          return
        }

        addEvent(data.event)
        toast.success("Événement créé avec succès !")
      }

      setActiveSection("evenements")
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsLoading(false)
    }
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return form.title && form.date
      case 2:
        return true
      case 3:
        return true
      default:
        return true
    }
  }

  const selectedTheme = themeOptions.find((t) => t.value === form.theme)
  const selectedType = eventTypes.find((t) => t.value === form.type)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="font-heading text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-gold" />
          {isEditMode ? "Modifier l'événement" : "Créer un événement"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditMode ? "Modifiez les détails de votre événement" : "Suivez les étapes pour créer votre événement"}
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  currentStep > step.number
                    ? "gradient-gold text-black shadow-lg shadow-gold/20"
                    : currentStep === step.number
                    ? "border-2 border-gold text-gold bg-gold/10 shadow-md shadow-gold/10"
                    : "border border-border/50 text-muted-foreground"
                }`}
                animate={currentStep === step.number ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                {currentStep > step.number ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </motion.div>
              <p
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  currentStep >= step.number ? "text-gold" : "text-muted-foreground/50"
                }`}
              >
                {step.title}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="relative w-12 md:w-20 mx-2">
                <div className="h-0.5 bg-border/30 w-full" />
                <motion.div
                  className="absolute top-0 left-0 h-0.5 bg-gold"
                  initial={{ width: "0%" }}
                  animate={{
                    width: currentStep > step.number ? "100%" : currentStep === step.number ? "50%" : "0%",
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-5">
              {/* Step 1: Basic info */}
              {currentStep === 1 && (
                <>
                  {/* Event Type Cards */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Type d&apos;événement
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                      {eventTypes.map((type) => (
                        <motion.button
                          key={type.value}
                          type="button"
                          onClick={() => updateForm("type", type.value)}
                          className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                            form.type === type.value
                              ? "border-gold/60 bg-gold/10 text-gold shadow-md shadow-gold/10"
                              : "border-border/50 hover:border-gold/20 text-muted-foreground hover:text-gold"
                          }`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {form.type === type.value && (
                            <motion.div
                              layoutId="type-indicator"
                              className="absolute -top-1 -right-1 w-4 h-4 gradient-gold rounded-full flex items-center justify-center"
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <Check className="h-2.5 w-2.5 text-black" />
                            </motion.div>
                          )}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center mb-0.5"
                            style={{
                              backgroundColor: form.type === type.value ? `${type.color}20` : `${type.color}10`,
                            }}
                          >
                            <type.icon className="h-4 w-4" style={{ color: type.color }} />
                          </div>
                          {type.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Titre de l&apos;événement *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Mariage de Sarah & Karim"
                      value={form.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                      className="bg-background/50 border-gold/20 focus:border-gold/50"
                    />
                  </div>

                  {/* Separate Date and Time with better UX */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="date"
                          type="date"
                          value={form.date}
                          onChange={(e) => updateForm("date", e.target.value)}
                          className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Heure</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="time"
                          type="time"
                          value={form.time}
                          onChange={(e) => updateForm("time", e.target.value)}
                          className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Lieu</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="Ex: Château de Versailles"
                        value={form.location}
                        onChange={(e) => updateForm("location", e.target.value)}
                        className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        placeholder="1 Rue de la Paix"
                        value={form.address}
                        onChange={(e) => updateForm("address", e.target.value)}
                        className="bg-background/50 border-gold/20 focus:border-gold/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        placeholder="Paris"
                        value={form.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        className="bg-background/50 border-gold/20 focus:border-gold/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hostName">Nom de l&apos;hôte</Label>
                    <Input
                      id="hostName"
                      placeholder="Ex: Famille Dupont"
                      value={form.hostName}
                      onChange={(e) => updateForm("hostName", e.target.value)}
                      className="bg-background/50 border-gold/20 focus:border-gold/50"
                    />
                  </div>
                </>
              )}

              {/* Step 2: Details */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez votre événement..."
                      value={form.description}
                      onChange={(e) => updateForm("description", e.target.value)}
                      className="bg-background/50 border-gold/20 focus:border-gold/50 min-h-[120px]"
                    />
                  </div>

                  {/* Theme Selection with Preview */}
                  <div className="space-y-3">
                    <Label>Thème de l&apos;événement</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                      {themeOptions.map((t) => (
                        <motion.button
                          key={t.value}
                          type="button"
                          onClick={() => handleThemeChange(t.value)}
                          className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                            form.theme === t.value
                              ? "border-gold/60 bg-gold/10 shadow-md shadow-gold/10"
                              : "border-border/50 hover:border-gold/20"
                          }`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <div className="flex items-center gap-1">
                            {t.colors.map((color, idx) => (
                              <div
                                key={idx}
                                className="w-5 h-5 rounded-full border border-white/20"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <span className={form.theme === t.value ? "text-gold" : "text-muted-foreground"}>
                            {t.icon} {t.label}
                          </span>
                          {form.theme === t.value && (
                            <motion.div
                              layoutId="theme-indicator"
                              className="absolute -top-1 -right-1 w-4 h-4 gradient-gold rounded-full flex items-center justify-center"
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <Check className="h-2.5 w-2.5 text-black" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Preview Card */}
                  {selectedTheme && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <Label className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Aperçu du thème {selectedTheme.icon} {selectedTheme.label}
                      </Label>
                      <div className="rounded-xl overflow-hidden border border-gold/20 max-w-xs mx-auto shadow-lg shadow-gold/5">
                        <div
                          className="p-5 text-center relative"
                          style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}
                        >
                          {form.coverImage && (
                            <div
                              className="absolute inset-0 bg-cover bg-center opacity-30"
                              style={{ backgroundImage: `url(${form.coverImage})` }}
                            />
                          )}
                          <div className="relative z-10">
                            <p className="text-[10px] uppercase tracking-[0.25em] opacity-70 mb-1">
                              {selectedTheme.icon} {selectedTheme.label}
                            </p>
                            <p className="text-xs uppercase tracking-wider opacity-70">Vous êtes invité</p>
                            <h3 className="text-lg font-bold mt-1 text-white drop-shadow-md">
                              {form.title || "Titre de l'événement"}
                            </h3>
                            {form.hostName && (
                              <p className="text-xs opacity-60 mt-0.5">Organisé par {form.hostName}</p>
                            )}
                          </div>
                        </div>
                        <div className="bg-card p-4 text-center space-y-2">
                          <p className="text-xs text-muted-foreground">
                            📅 {form.date ? new Date(form.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Date à définir"}
                            {form.time && ` à ${form.time}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            📍 {form.location || "Lieu à définir"}{form.city ? `, ${form.city}` : ""}
                          </p>
                          {form.dressCode && (
                            <p className="text-xs text-muted-foreground">👔 {form.dressCode}</p>
                          )}
                          <div
                            className="h-0.5 mx-4"
                            style={{ backgroundColor: form.primaryColor, opacity: 0.3 }}
                          />
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
                            Created by HenoBuild
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="dressCode">Code vestimentaire</Label>
                    <Input
                      id="dressCode"
                      placeholder="Ex: Tenue de soirée, Traditionnel..."
                      value={form.dressCode}
                      onChange={(e) => updateForm("dressCode", e.target.value)}
                      className="bg-background/50 border-gold/20 focus:border-gold/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxGuests">Nombre max d&apos;invités</Label>
                      <div className="relative">
                        <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="maxGuests"
                          type="number"
                          placeholder="200"
                          value={form.maxGuests}
                          onChange={(e) => updateForm("maxGuests", e.target.value)}
                          className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rsvpDeadline">Date limite RSVP</Label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="rsvpDeadline"
                          type="date"
                          value={form.rsvpDeadline}
                          onChange={(e) => updateForm("rsvpDeadline", e.target.value)}
                          className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <Label htmlFor="allowPlusOne" className="text-sm">Autoriser +1</Label>
                        <p className="text-xs text-muted-foreground">Les invités peuvent amener un accompagnant</p>
                      </div>
                      <Switch
                        id="allowPlusOne"
                        checked={form.allowPlusOne}
                        onCheckedChange={(v) => updateForm("allowPlusOne", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <Label htmlFor="isPrivate" className="text-sm">Événement privé</Label>
                        <p className="text-xs text-muted-foreground">Accès sur invitation uniquement</p>
                      </div>
                      <Switch
                        id="isPrivate"
                        checked={form.isPrivate}
                        onCheckedChange={(v) => updateForm("isPrivate", v)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes personnelles</Label>
                    <Textarea
                      id="notes"
                      placeholder="Notes internes (non visibles par les invités)..."
                      value={form.notes}
                      onChange={(e) => updateForm("notes", e.target.value)}
                      className="bg-background/50 border-gold/20 focus:border-gold/50 min-h-[80px]"
                    />
                  </div>
                </>
              )}

              {/* Step 3: Customization */}
              {currentStep === 3 && (
                <>
                  {/* Cover Image Upload */}
                  <div className="space-y-2">
                    <Label>Image de couverture</Label>
                    {form.coverImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-gold/20">
                        <img
                          src={form.coverImage}
                          alt="Cover preview"
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 right-3 flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-full text-xs"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Changer
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => updateForm("coverImage", "")}
                            className="rounded-full text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        className="border-2 border-dashed border-gold/20 rounded-xl p-8 text-center hover:border-gold/40 transition-colors cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                        whileHover={{ scale: 1.01 }}
                      >
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <ImagePlus className="h-10 w-10 text-gold/40 mx-auto mb-2 group-hover:text-gold/60 transition-colors" />
                        </motion.div>
                        <p className="text-sm text-muted-foreground">Glissez une image ici ou cliquez pour parcourir</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">PNG, JPG jusqu&apos;à 5MB</p>
                      </motion.div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleCoverImageUpload}
                    />
                  </div>

                  {/* Color Pickers */}
                  <div className="space-y-4">
                    <Label>Personnalisation des couleurs</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor" className="text-xs">Couleur principale</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              id="primaryColor"
                              type="color"
                              value={form.primaryColor}
                              onChange={(e) => updateForm("primaryColor", e.target.value)}
                              className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                            />
                          </div>
                          <Input
                            value={form.primaryColor}
                            onChange={(e) => updateForm("primaryColor", e.target.value)}
                            className="flex-1 bg-background/50 border-gold/20 text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor" className="text-xs">Couleur secondaire</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              id="secondaryColor"
                              type="color"
                              value={form.secondaryColor}
                              onChange={(e) => updateForm("secondaryColor", e.target.value)}
                              className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                            />
                          </div>
                          <Input
                            value={form.secondaryColor}
                            onChange={(e) => updateForm("secondaryColor", e.target.value)}
                            className="flex-1 bg-background/50 border-gold/20 text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accentColor" className="text-xs">Couleur d&apos;accent</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              id="accentColor"
                              type="color"
                              value={form.accentColor}
                              onChange={(e) => updateForm("accentColor", e.target.value)}
                              className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                            />
                          </div>
                          <Input
                            value={form.accentColor}
                            onChange={(e) => updateForm("accentColor", e.target.value)}
                            className="flex-1 bg-background/50 border-gold/20 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color palette preview */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <span className="text-xs text-muted-foreground mr-2">Palette :</span>
                      <div className="flex -space-x-1">
                        {[form.primaryColor, form.secondaryColor, form.accentColor].map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-card shadow-sm"
                            style={{ backgroundColor: color }}
                            title={i === 0 ? "Principale" : i === 1 ? "Secondaire" : "Accent"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">
                        {selectedTheme?.icon} {selectedTheme?.label}
                      </span>
                    </div>
                  </div>

                  {/* Full Preview Card */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Aperçu de l&apos;invitation
                    </Label>
                    <div className="rounded-xl overflow-hidden border border-gold/20 max-w-sm mx-auto shadow-xl shadow-gold/5">
                      <div
                        className="p-6 text-center relative"
                        style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}
                      >
                        {form.coverImage && (
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-20"
                            style={{ backgroundImage: `url(${form.coverImage})` }}
                          />
                        )}
                        <div className="relative z-10">
                          <p className="text-[10px] uppercase tracking-[0.25em] opacity-70 mb-2">
                            {selectedTheme?.icon} {selectedTheme?.label}
                          </p>
                          <p className="text-xs uppercase tracking-wider opacity-80">Vous êtes invité</p>
                          <h3 className="text-xl font-bold mt-2 text-white drop-shadow-md">
                            {form.title || "Titre de l'événement"}
                          </h3>
                          {form.hostName && (
                            <p className="text-sm opacity-70 mt-1">Organisé par {form.hostName}</p>
                          )}
                        </div>
                      </div>
                      <div className="bg-card p-5 text-center space-y-2.5">
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            📅 {form.date ? new Date(form.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "—"}
                          </span>
                          {form.time && (
                            <span className="flex items-center gap-1">
                              🕐 {form.time}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          📍 {form.location || "Lieu à définir"}{form.city ? `, ${form.city}` : ""}
                        </p>
                        {form.dressCode && (
                          <p className="text-xs text-muted-foreground">👔 {form.dressCode}</p>
                        )}
                        {form.maxGuests && (
                          <p className="text-xs text-muted-foreground">👥 {form.maxGuests} invités max</p>
                        )}
                        <div
                          className="h-0.5 mx-6"
                          style={{ backgroundColor: form.primaryColor, opacity: 0.3 }}
                        />
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
                          Created by HenoBuild
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <>
                  <div className="space-y-4">
                    <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
                      <Check className="h-5 w-5 text-gold" />
                      Récapitulatif
                    </h3>

                    {form.coverImage && (
                      <div className="rounded-xl overflow-hidden border border-gold/20 max-h-40">
                        <img
                          src={form.coverImage}
                          alt="Cover"
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: "Titre", value: form.title },
                        { label: "Type", value: eventTypes.find((t) => t.value === form.type)?.label },
                        { label: "Date", value: form.date ? new Date(form.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "-" },
                        { label: "Heure", value: form.time || "-" },
                        { label: "Lieu", value: form.location || "-" },
                        { label: "Ville", value: form.city || "-" },
                        { label: "Hôte", value: form.hostName || "-" },
                        { label: "Thème", value: themeOptions.find((t) => t.value === form.theme)?.label },
                        { label: "Code vestimentaire", value: form.dressCode || "-" },
                        { label: "Max invités", value: form.maxGuests || "Illimité" },
                        { label: "Date limite RSVP", value: form.rsvpDeadline ? new Date(form.rsvpDeadline).toLocaleDateString("fr-FR") : "-" },
                        { label: "Autoriser +1", value: form.allowPlusOne ? "Oui" : "Non" },
                        { label: "Événement privé", value: form.isPrivate ? "Oui" : "Non" },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between p-2.5 rounded-lg bg-muted/30">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Color preview */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground">Couleurs :</span>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full border border-border/50" style={{ backgroundColor: form.primaryColor }} />
                          <span className="text-xs text-muted-foreground">Principale</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full border border-border/50" style={{ backgroundColor: form.secondaryColor }} />
                          <span className="text-xs text-muted-foreground">Secondaire</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full border border-border/50" style={{ backgroundColor: form.accentColor }} />
                          <span className="text-xs text-muted-foreground">Accent</span>
                        </div>
                      </div>
                    </div>

                    {form.description && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{form.description}</p>
                      </div>
                    )}

                    {form.notes && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Notes personnelles</p>
                        <p className="text-sm">{form.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/5 border border-gold/20">
                      <Sparkles className="h-5 w-5 text-gold shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {isEditMode
                          ? "Votre événement sera mis à jour avec les nouvelles informations."
                          : <>Votre événement sera créé en tant que <strong className="text-gold">brouillon</strong>. Vous pourrez le publier ultérieurement.</>
                        }
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            if (currentStep === 1) {
              setEventToEdit(null)
              setActiveSection("evenements")
            } else {
              setCurrentStep(currentStep - 1)
            }
          }}
          className="text-muted-foreground hover:text-gold"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {currentStep === 1 ? "Annuler" : "Précédent"}
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canGoNext()}
            className="btn-gold rounded-full"
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-gold rounded-full"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isEditMode ? "Modification..." : "Création..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {isEditMode ? "Modifier l'événement" : "Créer l'événement"}
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
