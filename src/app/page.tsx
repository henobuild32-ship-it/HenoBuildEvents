"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, useInView, useSpring, useTransform, AnimatePresence } from "framer-motion"
import {
  Heart, Diamond, Cake, Droplets, Mic, Crown, Star, Wine,
  GraduationCap, Church, Sparkles, Settings, Users, Grid3X3,
  Mail, QrCode, BarChart3, Camera, MessageCircle, Palette,
  ChevronRight, Check, Quote,
  ArrowRight, Sun, Moon, Menu, X, ArrowUp,
  ShieldCheck,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { InstallButton } from "@/components/install-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { LoginDialog } from "@/components/auth/login-dialog"
import { RegisterDialog } from "@/components/auth/register-dialog"
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useStore } from "@/lib/store"
import { useTheme } from "next-themes"

/* ──────────────────── Gold Particles Canvas ──────────────────── */

function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const particles: { x: number; y: number; size: number; speedY: number; speedX: number; opacity: number; life: number }[] = []
    const maxParticles = 40

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      size: Math.random() * 3 + 1,
      speedY: -(Math.random() * 0.8 + 0.2),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      life: 0,
    })

    for (let i = 0; i < maxParticles; i++) {
      const p = createParticle()
      p.y = Math.random() * canvas.height
      p.life = Math.random() * 200
      particles.push(p)
    }

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.y += p.speedY
        p.x += p.speedX
        p.life++

        const lifeFactor = Math.min(1, p.life / 60)
        const fadeOut = p.y < 50 ? p.y / 50 : 1
        const alpha = p.opacity * lifeFactor * fadeOut

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 168, 83, ${alpha})`
        ctx.fill()

        // Glow effect
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 168, 83, ${alpha * 0.15})`
        ctx.fill()

        if (p.y < -10 || p.life > 400) {
          Object.assign(p, createParticle())
        }
      }

      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 -z-5 pointer-events-none" />
}

/* ──────────────────── Animation Helpers ──────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const staggerContainerSlow = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
}

/* ──────────────────── Animated Counter ──────────────────── */

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })
  const spring = useSpring(0, { duration: 2000, bounce: 0 })
  const display = useTransform(spring, (v: number) => {
    if (target >= 1000) {
      return `${Math.floor(v).toLocaleString("fr-FR")}${suffix}`
    }
    return `${Math.floor(v)}${suffix}`
  })

  useEffect(() => {
    if (inView) spring.set(target)
  }, [inView, spring, target])

  return <motion.span ref={ref}>{display}</motion.span>
}

/* ──────────────────── Section Wrapper ──────────────────── */

function Section({
  id,
  children,
  className = "",
}: {
  id?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`relative py-20 md:py-28 lg:py-32 overflow-hidden ${className}`}>
      {children}
    </section>
  )
}

function SectionHeader({
  badge,
  title,
  subtitle,
}: {
  badge?: string
  title: string
  subtitle?: string
}) {
  return (
    <motion.div
      className="text-center max-w-3xl mx-auto mb-14 md:mb-20"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
    >
      {badge && (
        <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1.5 text-xs font-medium border-gold/30 text-gold bg-gold/5"
          >
            {badge}
          </Badge>
        </motion.div>
      )}
      <motion.h2
        className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed"
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}

/* ──────────────────── Typing Animation ──────────────────── */

function TypingText({ words, className = "" }: { words: string[]; className?: string }) {
  const [wordIndex, setWordIndex] = useState(0)
  const [text, setText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = words[wordIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(currentWord.slice(0, text.length + 1))
        if (text.length + 1 === currentWord.length) {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        setText(currentWord.slice(0, text.length - 1))
        if (text.length === 0) {
          setIsDeleting(false)
          setWordIndex((prev) => (prev + 1) % words.length)
        }
      }
    }, isDeleting ? 50 : 100)
    return () => clearTimeout(timeout)
  }, [text, isDeleting, wordIndex, words])

  return (
    <span className={className}>
      {text}
      <span className="animate-pulse text-gold">|</span>
    </span>
  )
}

/* ──────────────────── Scroll to Top Button ──────────────────── */

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 400)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full gradient-gold flex items-center justify-center shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/40 transition-shadow"
          aria-label="Retour en haut"
        >
          <ArrowUp className="h-5 w-5 text-black" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

/* ──────────────────── 1. Hero Section ──────────────────── */

function HeroSection({ onLogin, onRegister, onCreateEvent }: { onLogin: () => void; onRegister: () => void; onCreateEvent: () => void }) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <Section id="accueil" className="min-h-screen flex items-center pt-24 grain-overlay">
      <GoldParticles />
      <div className="absolute inset-0 -z-10" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/40" />
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-gold/5 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-gold/5 blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/[0.03] blur-[150px]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="absolute top-32 right-[15%] w-3 h-3 rounded-full bg-gold/30 animate-glow"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-[10%] w-2 h-2 rounded-full bg-gold/20 animate-glow"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute bottom-1/3 right-[8%] w-4 h-4 rounded-full bg-gold/15 animate-glow"
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="absolute top-2/3 left-[20%] w-2.5 h-2.5 rounded-full bg-gold/25 animate-glow"
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainerSlow}
        >
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1.5 text-xs font-medium border-gold/30 text-gold bg-gold/5"
            >
              <Sparkles className="h-3 w-3 mr-1.5" />
              Plateforme Premium d&apos;Événements
            </Badge>
          </motion.div>

          <motion.h1
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            variants={fadeInUp}
            transition={{ duration: 0.8 }}
          >
            Créez des événements{" "}
            <span className="gradient-gold-text">inoubliables</span>
            <br />
            <TypingText
              words={["intelligemment", "avec élégance", "sans effort", "avec passion"]}
              className="gradient-gold-text"
            />
          </motion.h1>

          <motion.p
            className="mt-6 md:mt-8 text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            La plateforme premium qui transforme chaque cérémonie en une expérience
            numérique exceptionnelle
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 md:mt-10"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <Button onClick={onCreateEvent} className="btn-gold rounded-full px-8 py-6 text-base animate-pulse-gold">
              <Sparkles className="h-5 w-5 mr-2" />
              Créer mon événement
            </Button>
            <Button
              variant="outline"
              className="btn-outline-gold rounded-full px-8 py-6 text-base border-gold/30"
            >
              Découvrir
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>

          <motion.div
            className="mt-8"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm text-center text-muted-foreground mb-4 font-medium">Disponible sur tous vos appareils</p>
            <div className="flex justify-center">
              <InstallButton />
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-3 gap-6 md:gap-12 mt-14 md:mt-20 max-w-2xl mx-auto"
            variants={fadeInUp}
            transition={{ duration: 0.8 }}
          >
            {[
              { value: 10000, suffix: "+", label: "Événements créés" },
              { value: 500000, suffix: "+", label: "Invités" },
              { value: 98, suffix: "%", label: "Satisfaction" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold gradient-gold-text font-heading">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </Section>
  )
}

/* ──────────────────── 2. Event Types Section ──────────────────── */

const eventTypes = [
  { icon: Heart, name: "Mariage" },
  { icon: Diamond, name: "Fiançailles" },
  { icon: Cake, name: "Anniversaire" },
  { icon: Droplets, name: "Baptême" },
  { icon: Mic, name: "Conférence" },
  { icon: Crown, name: "Cérémonie" },
  { icon: Star, name: "Soirée VIP" },
  { icon: Wine, name: "Gala" },
  { icon: Sparkles, name: "Cocktail" },
  { icon: GraduationCap, name: "Remise de diplômes" },
  { icon: Church, name: "Événement religieux" },
  { icon: Settings, name: "Personnalisé" },
]

function EventTypesSection() {
  return (
    <Section id="types">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Types d'événements"
          title="Pour chaque occasion unique"
          subtitle="Quel que soit le type d'événement, HenoBuild s'adapte à vos besoins avec élégance"
        />
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {eventTypes.map((type) => (
            <motion.div key={type.name} variants={scaleIn} transition={{ duration: 0.5 }} className="group">
              <div className="card-premium card-premium-glow rounded-2xl bg-card/80 backdrop-blur-sm p-6 text-center cursor-pointer hover:bg-gold/[0.03] transition-all duration-400">
                <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gold/10 group-hover:bg-gold/20 transition-colors duration-300">
                  <type.icon className="h-6 w-6 text-gold group-hover:text-gold-light transition-colors duration-300" />
                </div>
                <span className="text-sm font-medium text-foreground/80 group-hover:text-gold transition-colors duration-300">
                  {type.name}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

/* ──────────────────── 3. Features Section ──────────────────── */

const features = [
  { icon: Users, title: "Gestion des invités", description: "Ajoutez, organisez et suivez vos invités en temps réel" },
  { icon: Grid3X3, title: "Tables intelligentes", description: "Répartition automatique et gestion des places" },
  { icon: Mail, title: "Invitations numériques", description: "Créez et envoyez des invitations premium interactives" },
  { icon: QrCode, title: "QR Code & Accès", description: "Contrôle d'accès sécurisé par QR code unique" },
  { icon: BarChart3, title: "Tableau de bord", description: "Statistiques en temps réel et suivi complet" },
  { icon: Camera, title: "Galerie souvenirs", description: "Albums photos et vidéos collaboratifs" },
  { icon: MessageCircle, title: "Messagerie", description: "Communiquez avec vos invités instantanément" },
  { icon: Palette, title: "Personnalisation", description: "Thèmes, couleurs et animations sur mesure" },
]

function FeaturesSection() {
  return (
    <Section id="fonctionnalites" className="bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Fonctionnalités" title="Tout ce dont vous avez besoin" subtitle="Une suite complète d'outils intelligents pour gérer vos événements" />
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={fadeInUp} transition={{ duration: 0.5 }} className="group">
              <div className="card-premium card-premium-glow h-full rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-6 hover:border-gold/30 transition-all duration-400">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-gold/20 to-gold/5 group-hover:from-gold/30 group-hover:to-gold/10 transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2 group-hover:text-gold transition-colors duration-300">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

/* ──────────────────── 4. How It Works Section ──────────────────── */

const steps = [
  { number: "01", icon: Sparkles, title: "Créez votre événement", description: "Définissez le type, la date, le lieu et personnalisez chaque détail" },
  { number: "02", icon: Mail, title: "Invitez vos invités", description: "Envoyez des invitations numériques premium avec QR code" },
  { number: "03", icon: BarChart3, title: "Gérez en temps réel", description: "Suivez les confirmations, organisez les tables et controlez les accès" },
]

function HowItWorksSection() {
  return (
    <Section id="comment">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Comment ça marche" title="Simple comme 1, 2, 3" subtitle="Créez votre événement en quelques étapes et laissez la technologie faire le reste" />
        <motion.div className="max-w-4xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainerSlow}>
          <div className="relative">
            <div className="hidden md:block absolute top-24 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px">
              <motion.div className="h-full bg-gradient-to-r from-gold/20 via-gold/40 to-gold/20" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut" }} style={{ transformOrigin: "left" }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
              {steps.map((step) => (
                <motion.div key={step.number} className="relative text-center" variants={fadeInUp} transition={{ duration: 0.6 }}>
                  <div className="mx-auto w-14 h-14 rounded-full gradient-gold flex items-center justify-center mb-6 shadow-lg shadow-gold/20 relative z-10">
                    <span className="text-sm font-bold text-black">{step.number}</span>
                  </div>
                  <div className="mx-auto w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center mb-4 shadow-sm">
                    <step.icon className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  )
}

/* ──────────────────── 5-10: Remaining Landing Sections (condensed) ──────────────────── */

function InvitationPreviewSection() {
  return (
    <Section id="apercu" className="bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Aperçu" title="Invitations numériques premium" subtitle="Des invitations élégantes et interactives qui impressionnent vos invités" />
        <motion.div className="max-w-md mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} transition={{ duration: 0.8 }}>
          <motion.div className="animate-float" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-gold/10 blur-sm" />
              <div className="absolute -bottom-4 -right-4 w-10 h-10 rounded-full bg-gold/10 blur-sm" />
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gold/5 border border-gold/20">
                <div className="gradient-gold p-6 text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/60 mb-2">Vous êtes invité</p>
                  <h3 className="font-heading text-2xl font-bold text-black">Mariage de Sarah & Karim</h3>
                </div>
                <div className="bg-card p-6 space-y-5">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground"><span className="text-xs uppercase tracking-wider">Samedi 15 Juin 2025</span></div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground"><span className="text-xs">Château de Versailles, Paris</span></div>
                  </div>
                  <div className="divider-gold" />
                  <div className="text-center"><p className="text-sm text-muted-foreground italic">&ldquo;Nous serions honorés de votre présence&rdquo;</p></div>
                  <div className="flex justify-center"><div className="w-24 h-24 rounded-xl bg-muted/80 border border-border/50 flex items-center justify-center"><QrCode className="h-10 w-10 text-gold/60" /></div></div>
                  <div className="text-center"><p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Created by HenoBuild</p></div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Section>
  )
}

const testimonials = [
  { quote: "HenoBuild a transformé l'organisation de notre mariage en une expérience fluide et élégante. Nos invités ont adoré les invitations numériques !", name: "Amina K.", role: "Organisatrice de mariage", rating: 5 },
  { quote: "La gestion des tables et le QR code d'accès nous ont fait gagner un temps précieux. Un outil absolument indispensable.", name: "Youssef B.", role: "Planificateur d'événements", rating: 5 },
  { quote: "J'ai organisé la remise des diplômes de notre école avec HenoBuild. Le résultat était professionnel et impressionnant.", name: "Dr. Fatima M.", role: "Directrice académique", rating: 5 },
  { quote: "La personnalisation des invitations et le suivi en temps réel sont exceptionnels. Je recommande à 100% !", name: "Omar R.", role: "Chef d'entreprise", rating: 5 },
]

function TestimonialsSection() {
  return (
    <Section id="temoignages">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Témoignages" title="Ils nous font confiance" subtitle="Découvrez les retours de nos utilisateurs satisfaits" />
        {/* Avis vérifiés badge */}
        <motion.div className="flex items-center justify-center gap-2 mb-8" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">Avis vérifiés</span>
          </div>
        </motion.div>
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={fadeInUp} transition={{ duration: 0.5 }} className="group">
              <div className="card-premium card-hover-lift h-full rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-6 hover:border-gold/20 transition-all duration-400">
                <Quote className="h-8 w-8 text-gold/30 mb-4" />
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex gap-1 mb-4">{Array.from({ length: testimonial.rating }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-gold text-gold" />))}</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-sm font-bold text-black">{testimonial.name.charAt(0)}</div>
                  <div><p className="text-sm font-semibold">{testimonial.name}</p><p className="text-xs text-muted-foreground">{testimonial.role}</p></div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}



const stats = [
  { value: 10000, suffix: "+", label: "Événements créés", icon: Sparkles },
  { value: 500000, suffix: "+", label: "Invités accueillis", icon: Users },
  { value: 25000, suffix: "+", label: "Tables organisées", icon: Grid3X3 },
  { value: 98, suffix: "%", label: "Taux de satisfaction", icon: Star },
]

function StatisticsSection() {
  return (
    <Section className="bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
          {stats.map((stat) => (
            <motion.div key={stat.label} className="text-center" variants={fadeInUp} transition={{ duration: 0.5 }}>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-card border border-border/50 flex items-center justify-center mb-4 shadow-sm"><stat.icon className="h-6 w-6 text-gold" /></div>
              <div className="text-3xl md:text-4xl font-bold gradient-gold-text font-heading"><AnimatedCounter target={stat.value} suffix={stat.suffix} /></div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}



const faqItems = [
  { question: "Comment créer mon premier événement sur HenoBuild ?", answer: "C'est très simple ! Créez un compte, cliquez sur 'Créer mon événement', choisissez le type d'événement, remplissez les détails et personnalisez votre invitation. En moins de 5 minutes, votre événement est prêt." },
  { question: "Les invitations numériques sont-elles personnalisables ?", answer: "Absolument ! Vous pouvez personnaliser entièrement vos invitations : thèmes, couleurs, polices, images, animations, et messages personnalisés." },
  { question: "Comment fonctionne le système de QR Code ?", answer: "Chaque invité reçoit un QR code unique dans son invitation. Le jour de l'événement, scannez simplement le QR code à l'entrée pour vérifier l'invité en temps réel." },
  { question: "Puis-je gérer la disposition des tables ?", answer: "Oui ! Notre fonctionnalité de tables intelligentes vous permet de créer des plans de table visuels, de répartir automatiquement les invités selon vos critères." },
  { question: "Y a-t-il une limite d'invités ?", answer: "Non ! HenoBuild vous permet d'inviter autant d'invités que vous le souhaitez, sans aucune limite." },
  { question: "L'application est-elle disponible sur mobile ?", answer: "Oui ! HenoBuild est une PWA qui fonctionne parfaitement sur tous les appareils. Vous pouvez l'installer sur Android et iOS." },
  { question: "Est-ce que je peux utiliser HenoBuild sur ordinateur ?", answer: "Bien sûr ! HenoBuild fonctionne sur tous les navigateurs modernes, que ce soit sur ordinateur, tablette ou mobile." },
  { question: "Mes données sont-elles sécurisées ?", answer: "La sécurité de vos données est notre priorité. Nous utilisons un chiffrement de bout en bout, des serveurs sécurisés et conformes au RGPD." },
]

function FAQSection() {
  return (
    <Section className="bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="FAQ" title="Questions fréquentes" subtitle="Tout ce que vous devez savoir sur HenoBuild Event" />
        <motion.div className="max-w-3xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <motion.div key={index} variants={fadeInUp} transition={{ duration: 0.4, delay: index * 0.06 }}>
              <AccordionItem value={`item-${index}`} className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm px-6 data-[state=open]:border-gold/20 data-[state=open]:bg-gold/[0.02] transition-all duration-300">
                <AccordionTrigger className="text-left text-sm md:text-base font-medium hover:text-gold transition-colors duration-300 hover:no-underline py-5">{item.question}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">{item.answer}</AccordionContent>
              </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </Section>
  )
}

function CTASection({ onCreateEvent }: { onCreateEvent: () => void }) {
  return (
    <Section id="contact">
      <GoldParticles />
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.06] via-background to-gold/[0.03]" />
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold/[0.04] blur-[200px]" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center max-w-3xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainerSlow}>
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-medium border-gold/30 text-gold bg-gold/5"><Sparkles className="h-3 w-3 mr-1.5" />Prêt ?</Badge>
          </motion.div>
          <motion.h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight" variants={fadeInUp} transition={{ duration: 0.6 }}>Prêt à créer votre <motion.span className="gradient-gold-text inline-block" initial={{ scale: 1 }} whileInView={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>événement</motion.span> ?</motion.h2>
          <motion.p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed" variants={fadeInUp} transition={{ duration: 0.6 }}>Rejoignez des milliers d&apos;utilisateurs qui font confiance à HenoBuild pour créer des événements inoubliables</motion.p>
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8" variants={fadeInUp} transition={{ duration: 0.6 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={onCreateEvent} className="btn-gold rounded-full px-8 py-6 text-base animate-pulse-gold shadow-lg shadow-gold/20"><Sparkles className="h-5 w-5 mr-2" />Créer mon événement</Button>
            </motion.div>

          </motion.div>
          <motion.div className="mt-8" variants={fadeInUp} transition={{ duration: 0.6 }}>
            <p className="text-sm text-center text-muted-foreground mb-4 font-medium">Téléchargez l'application</p>
            <div className="flex justify-center">
              <InstallButton />
            </div>
          </motion.div>
          <motion.div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-muted-foreground" variants={fadeInUp} transition={{ duration: 0.6 }}>
            <motion.div className="flex items-center gap-1.5" whileHover={{ scale: 1.05 }}><Check className="h-3.5 w-3.5 text-gold" /><span>Fonctionnalités complètes</span></motion.div>
            <motion.div className="flex items-center gap-1.5" whileHover={{ scale: 1.05 }}><Check className="h-3.5 w-3.5 text-gold" /><span>Toutes les options incluses</span></motion.div>
            <motion.div className="flex items-center gap-1.5" whileHover={{ scale: 1.05 }}><Check className="h-3.5 w-3.5 text-gold" /><span>Sans engagement</span></motion.div>
          </motion.div>
          <motion.p className="mt-12 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40" variants={fadeIn} transition={{ duration: 1, delay: 0.5 }}>Created by HenoBuild</motion.p>
        </motion.div>
      </div>
    </Section>
  )
}

/* ──────────────────── Main Page ──────────────────── */

export default function Home() {
  const { auth, currentView, setCurrentView, login } = useStore()
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("henobuild_token")
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error("Invalid token")
        })
        .then((data) => {
          if (data?.user) {
            login(data.user, token)
          }
          setIsCheckingAuth(false)
        })
        .catch(() => {
          localStorage.removeItem("henobuild_token")
          setIsCheckingAuth(false)
        })
    } else {
      queueMicrotask(() => setIsCheckingAuth(false))
    }
  }, [login])

  // Save token to localStorage on auth change
  useEffect(() => {
    if (auth.token) {
      localStorage.setItem("henobuild_token", auth.token)
    } else {
      localStorage.removeItem("henobuild_token")
    }
  }, [auth.token])

  const handleCreateEvent = () => {
    if (auth.isAuthenticated) {
      setCurrentView("dashboard")
      useStore.getState().setActiveSection("creer-evenement")
    } else {
      setShowRegister(true)
    }
  }

  const handleLoginSuccess = () => {
    setShowLogin(false)
    setCurrentView("dashboard")
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center animate-pulse-gold">
            <Sparkles className="h-6 w-6 text-black" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {auth.isAuthenticated && currentView === "dashboard" ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardLayout />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="min-h-screen flex flex-col">
              <NavbarWithAuth onLogin={() => setShowLogin(true)} onRegister={() => setShowRegister(true)} />
              <main className="flex-1">
                <HeroSection onLogin={() => setShowLogin(true)} onRegister={() => setShowRegister(true)} onCreateEvent={handleCreateEvent} />
                <EventTypesSection />
                <FeaturesSection />
                <HowItWorksSection />
                <InvitationPreviewSection />
                <TestimonialsSection />
                <StatisticsSection />
                <FAQSection />
                <CTASection onCreateEvent={handleCreateEvent} />
              </main>
              <Footer />
            </div>
            <ScrollToTopButton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth dialogs */}
      <LoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onSwitchToRegister={() => {
          setShowLogin(false)
          setTimeout(() => setShowRegister(true), 200)
        }}
        onSwitchToForgotPassword={() => {
          setShowLogin(false)
          setTimeout(() => setShowForgotPassword(true), 200)
        }}
      />
      <RegisterDialog
        open={showRegister}
        onOpenChange={setShowRegister}
        onSwitchToLogin={() => {
          setShowRegister(false)
          setTimeout(() => setShowLogin(true), 200)
        }}
      />
      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        onSwitchToLogin={() => {
          setShowForgotPassword(false)
          setTimeout(() => setShowLogin(true), 200)
        }}
      />
    </>
  )
}

/* ──────────────────── Navbar with Auth ──────────────────── */

function NavbarWithAuth({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("accueil")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
      // Floating nav indicator - detect which section is in view
      const sections = ["accueil", "types", "fonctionnalites", "comment", "apercu", "temoignages", "contact"]
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 200) {
            setActiveSection(id)
            break
          }
        }
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setIsMobileMenuOpen(false) }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const scrollToSection = (href: string) => {
    setIsMobileMenuOpen(false)
    const element = document.querySelector(href)
    if (element) element.scrollIntoView({ behavior: "smooth" })
  }

  const navLinks = [
    { label: "Accueil", href: "#accueil" },
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Contact", href: "#contact" },
  ]

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "glass-dark py-2 shadow-lg shadow-black/10" : "bg-transparent py-4"}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 group">
            <img src="/henobuildEvents.png" alt="HenoBuild Event" className="h-9 w-auto transition-transform duration-300 group-hover:scale-105" />
            <div className="hidden sm:block">
              <span className="font-heading text-lg font-bold gradient-gold-text">HenoBuild</span>
              <span className="font-heading text-lg font-light text-foreground ml-1">Event</span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const sectionId = link.href.replace("#", "")
              const isActive = activeSection === sectionId
              return (
                <button key={link.label} onClick={() => scrollToSection(link.href)} className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 group ${isActive ? "text-gold" : "text-muted-foreground hover:text-gold"}`}>
                  {link.label}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gold rounded-full transition-all duration-300 ${isActive ? "w-3/4" : "w-0 group-hover:w-3/4"}`} />
                </button>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {mounted && (
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-muted-foreground hover:text-gold hover:bg-gold/5">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" onClick={onLogin} className="text-sm text-muted-foreground hover:text-gold hover:bg-gold/5">Connexion</Button>
            <Button variant="outline" onClick={onRegister} className="text-sm btn-outline-gold border-gold/30 hover:bg-gold/5">Inscription</Button>
            <Button onClick={onRegister} className="btn-gold text-sm rounded-full px-5"><Sparkles className="h-4 w-4 mr-1.5" />Créer mon événement</Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {mounted && (
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-muted-foreground hover:text-gold hover:bg-gold/5">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-muted-foreground hover:text-gold hover:bg-gold/5">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="md:hidden glass-dark border-t border-border/30 overflow-hidden">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link, index) => (
                <motion.button key={link.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} onClick={() => scrollToSection(link.href)} className="flex items-center w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-gold hover:bg-gold/5 rounded-lg transition-all duration-300">
                  {link.label}
                </motion.button>
              ))}
              <div className="pt-3 space-y-2 border-t border-border/30 mt-2">
                <Button variant="ghost" onClick={onLogin} className="w-full justify-start text-sm text-muted-foreground hover:text-gold hover:bg-gold/5">Connexion</Button>
                <Button variant="outline" onClick={onRegister} className="w-full justify-start text-sm btn-outline-gold border-gold/30">Inscription</Button>
                <Button onClick={onRegister} className="w-full btn-gold text-sm rounded-full mt-2"><Sparkles className="h-4 w-4 mr-1.5" />Créer mon événement</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
