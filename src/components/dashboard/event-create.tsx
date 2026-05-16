"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles, CalendarDays, MapPin, Clock, FileText, ChevronRight,
  ChevronLeft, Check, Palette, Heart, Diamond, Cake, Droplets,
  Mic, Crown, Star, Wine, GraduationCap, Church, Settings,
  Users as UsersIcon, Eye
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

const eventTypes = [
  { value: "WEDDING", label: "Mariage", icon: Heart },
  { value: "ENGAGEMENT", label: "Fiançailles", icon: Diamond },
  { value: "BIRTHDAY", label: "Anniversaire", icon: Cake },
  { value: "BAPTISM", label: "Baptême", icon: Droplets },
  { value: "CONFERENCE", label: "Conférence", icon: Mic },
  { value: "CEREMONY", label: "Cérémonie", icon: Crown },
  { value: "VIP", label: "Soirée VIP", icon: Star },
  { value: "GALA", label: "Gala", icon: Wine },
  { value: "COCKTAIL", label: "Cocktail", icon: Sparkles },
  { value: "GRADUATION", label: "Remise de diplômes", icon: GraduationCap },
  { value: "RELIGIOUS", label: "Événement religieux", icon: Church },
  { value: "CUSTOM", label: "Personnalisé", icon: Settings },
]

const themeOptions = [
  { value: "LUXURIOUS", label: "Luxueux" },
  { value: "MODERN", label: "Moderne" },
  { value: "ROMANTIC", label: "Romantique" },
  { value: "AFRICAN", label: "Africain" },
  { value: "VIP", label: "VIP" },
  { value: "MINIMALIST", label: "Minimaliste" },
  { value: "RUSTIC", label: "Rustique" },
  { value: "BOHEMIAN", label: "Bohème" },
  { value: "VINTAGE", label: "Vintage" },
  { value: "TROPICAL", label: "Tropical" },
  { value: "ELEGANT", label: "Élégant" },
  { value: "FESTIVE", label: "Festif" },
  { value: "CUSTOM", label: "Personnalisé" },
]

const steps = [
  { number: 1, title: "Informations", description: "Type, titre, date" },
  { number: 2, title: "Détails", description: "Description, thème" },
  { number: 3, title: "Personnalisation", description: "Couleurs, image" },
  { number: 4, title: "Révision", description: "Vérifier & créer" },
]

export function EventCreate() {
  const { auth, setActiveSection, addEvent } = useStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

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
  })

  const updateForm = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.title || !form.date) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    setIsLoading(true)
    try {
      const eventDate = new Date(`${form.date}T${form.time || "12:00"}`)
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
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
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la création")
        return
      }

      addEvent(data.event)
      toast.success("Événement créé avec succès !")
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  currentStep > step.number
                    ? "gradient-gold text-black shadow-lg shadow-gold/20"
                    : currentStep === step.number
                    ? "border-2 border-gold text-gold bg-gold/10"
                    : "border border-border/50 text-muted-foreground"
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </div>
              <p
                className={`text-[10px] mt-1 font-medium ${
                  currentStep >= step.number ? "text-gold" : "text-muted-foreground/50"
                }`}
              >
                {step.title}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 md:w-20 h-0.5 mx-2 transition-colors duration-300 ${
                  currentStep > step.number ? "bg-gold" : "bg-border/30"
                }`}
              />
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
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Type d&apos;événement</Label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {eventTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateForm("type", type.value)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                            form.type === type.value
                              ? "border-gold/50 bg-gold/10 text-gold"
                              : "border-border/50 hover:border-gold/20 text-muted-foreground hover:text-gold"
                          }`}
                        >
                          <type.icon className="h-5 w-5" />
                          {type.label}
                        </button>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="date"
                          type="date"
                          value={form.date}
                          onChange={(e) => updateForm("date", e.target.value)}
                          className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Heure</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

                  <div className="space-y-2">
                    <Label>Thème</Label>
                    <Select value={form.theme} onValueChange={(v) => updateForm("theme", v)}>
                      <SelectTrigger className="bg-background/50 border-gold/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {themeOptions.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                    <div className="space-y-3 pt-7">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allowPlusOne" className="text-sm">Autoriser +1</Label>
                        <Switch
                          id="allowPlusOne"
                          checked={form.allowPlusOne}
                          onCheckedChange={(v) => updateForm("allowPlusOne", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="isPrivate" className="text-sm">Événement privé</Label>
                        <Switch
                          id="isPrivate"
                          checked={form.isPrivate}
                          onCheckedChange={(v) => updateForm("isPrivate", v)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Customization */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-4">
                    <Label>Personnalisation des couleurs</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor" className="text-xs">Couleur principale</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="primaryColor"
                            type="color"
                            value={form.primaryColor}
                            onChange={(e) => updateForm("primaryColor", e.target.value)}
                            className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer"
                          />
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
                          <input
                            id="secondaryColor"
                            type="color"
                            value={form.secondaryColor}
                            onChange={(e) => updateForm("secondaryColor", e.target.value)}
                            className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer"
                          />
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
                          <input
                            id="accentColor"
                            type="color"
                            value={form.accentColor}
                            onChange={(e) => updateForm("accentColor", e.target.value)}
                            className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer"
                          />
                          <Input
                            value={form.accentColor}
                            onChange={(e) => updateForm("accentColor", e.target.value)}
                            className="flex-1 bg-background/50 border-gold/20 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image de couverture placeholder */}
                  <div className="space-y-2">
                    <Label>Image de couverture</Label>
                    <div className="border-2 border-dashed border-gold/20 rounded-xl p-8 text-center hover:border-gold/40 transition-colors cursor-pointer">
                      <Palette className="h-10 w-10 text-gold/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Glissez une image ici ou cliquez pour parcourir</p>
                      <p className="text-xs text-muted-foreground/50 mt-1">PNG, JPG jusqu&apos;à 5MB</p>
                    </div>
                  </div>

                  {/* Preview card */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Aperçu
                    </Label>
                    <div className="rounded-xl overflow-hidden border border-gold/20 max-w-xs mx-auto">
                      <div
                        className="p-4 text-center"
                        style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}
                      >
                        <p className="text-xs uppercase tracking-wider opacity-70">Vous êtes invité</p>
                        <h3 className="text-lg font-bold mt-1">{form.title || "Titre de l'événement"}</h3>
                      </div>
                      <div className="bg-card p-4 text-center space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {form.date ? new Date(form.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Date à définir"}
                        </p>
                        <p className="text-xs text-muted-foreground">{form.location || "Lieu à définir"}</p>
                        <div className="divider-gold" />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "Titre", value: form.title },
                        { label: "Type", value: eventTypes.find((t) => t.value === form.type)?.label },
                        { label: "Date", value: form.date ? new Date(form.date).toLocaleDateString("fr-FR") : "-" },
                        { label: "Heure", value: form.time || "-" },
                        { label: "Lieu", value: form.location || "-" },
                        { label: "Ville", value: form.city || "-" },
                        { label: "Thème", value: themeOptions.find((t) => t.value === form.theme)?.label },
                        { label: "Code vestimentaire", value: form.dressCode || "-" },
                        { label: "Max invités", value: form.maxGuests || "Illimité" },
                        { label: "Autoriser +1", value: form.allowPlusOne ? "Oui" : "Non" },
                        { label: "Événement privé", value: form.isPrivate ? "Oui" : "Non" },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between p-2 rounded-lg bg-muted/30">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {form.description && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{form.description}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/5 border border-gold/20">
                      <Sparkles className="h-5 w-5 text-gold shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Votre événement sera créé en tant que <strong className="text-gold">brouillon</strong>. Vous pourrez le publier ultérieurement.
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
                Création...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Créer l&apos;événement
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
