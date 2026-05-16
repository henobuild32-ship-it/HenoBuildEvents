"use client"

import { useEffect, useState } from "react"
import { Calendar, MapPin, Mail, Phone, Instagram, Facebook, Twitter, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navLinks = [
  { label: "Accueil", href: "#accueil" },
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "Contact", href: "#contact" },
]

const featureLinks = [
  { label: "Création d'événements", href: "#fonctionnalites" },
  { label: "Gestion des invités", href: "#fonctionnalites" },
  { label: "Billetterie en ligne", href: "#fonctionnalites" },
  { label: "Analyses & Rapports", href: "#fonctionnalites" },
]

const legalLinks = [
  { label: "Conditions d'utilisation", href: "#" },
  { label: "Politique de confidentialité", href: "#" },
  { label: "Mentions légales", href: "#" },
  { label: "Cookies", href: "#" },
]

export function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <footer className="relative mt-auto border-t border-border/50">
      {/* Premium gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/30 pointer-events-none" />

      <div className="relative">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-1 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/henobuildEvents.png"
                  alt="HenoBuild Event"
                  className="h-10 w-auto"
                />
                <div>
                  <h3 className="font-heading text-lg font-bold text-gold-gradient">
                    HenoBuild Event
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Premium Event Platform
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Créez des événements inoubliables intelligemment. La plateforme
                premium qui transforme vos idées en expériences exceptionnelles.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-border/50 text-muted-foreground hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-border/50 text-muted-foreground hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-border/50 text-muted-foreground hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all duration-300"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Navigation Column */}
            <div className="space-y-4">
              <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                Navigation
              </h4>
              <ul className="space-y-2.5">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-sm text-muted-foreground hover:text-gold transition-colors duration-300"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features Column */}
            <div className="space-y-4">
              <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                Fonctionnalités
              </h4>
              <ul className="space-y-2.5">
                {featureLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-sm text-muted-foreground hover:text-gold transition-colors duration-300"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Column */}
            <div className="space-y-4">
              <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                Contact
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-gold shrink-0" />
                  <span>contact@henobuild.event</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-gold shrink-0" />
                  <span>+33 1 23 45 67 89</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                  <span>Paris, France</span>
                </li>
              </ul>
              <div className="flex flex-col gap-2 pt-2">
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-xs font-medium btn-outline-gold border border-gold/30 text-gold hover:bg-gold/10 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 2.226l-5.509 9.325 5.509 9.325h3.954l-5.509-9.325 5.509-9.325zM7.287 2.226L1.778 11.551l5.509 9.325h3.954L5.732 11.551l5.509-9.325z" />
                  </svg>
                  Android
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-xs font-medium btn-outline-gold border border-gold/30 text-gold hover:bg-gold/10 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  iOS
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Created by HenoBuild - MANDATORY */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Créé par
                </span>
                <span className="text-sm font-semibold gradient-gold-text font-heading">
                  HenoBuild
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} HenoBuild Event
                </span>
              </div>

              {/* Legal Links */}
              <div className="flex flex-wrap items-center gap-4">
                {legalLinks.map((link, index) => (
                  <span key={link.label} className="flex items-center gap-4">
                    <a
                      href={link.href}
                      className="text-xs text-muted-foreground hover:text-gold transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                    {index < legalLinks.length - 1 && (
                      <span className="text-muted-foreground/30">•</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-10 h-10 rounded-full btn-gold shadow-lg transition-all duration-300 animate-fade-in"
          aria-label="Retour en haut"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </footer>
  )
}
