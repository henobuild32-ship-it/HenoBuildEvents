"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import {
  LayoutDashboard, CalendarDays, Users, Grid3X3, Mail, QrCode,
  Camera, MessageCircle, Settings, Sparkles, Sun, Moon,
  Menu, X, ChevronLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useStore, type DashboardSection } from "@/lib/store"
import { DashboardHome } from "./dashboard-home"
import { EventList } from "./event-list"
import { EventCreate } from "./event-create"
import { GuestManagement } from "./guest-management"
import { TableManagement } from "./table-management"
import { InvitationManagement } from "./invitation-management"
import { CheckInSection } from "./checkin-section"
import { GallerySection } from "./gallery-section"
import { MessagingSection } from "./messaging-section"
import { SettingsSection } from "./settings-section"
import { NotificationsPanel } from "./notifications-panel"
import { EventSelector } from "./event-selector"
import { InstallButton } from "@/components/install-button"

const sidebarItems: { icon: React.ElementType; label: string; section: DashboardSection }[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", section: "accueil" },
  { icon: CalendarDays, label: "Mes événements", section: "evenements" },
  { icon: Users, label: "Invités", section: "invites" },
  { icon: Grid3X3, label: "Tables", section: "tables" },
  { icon: Mail, label: "Invitations", section: "invitations" },
  { icon: QrCode, label: "Check-in", section: "checkin" },
  { icon: Camera, label: "Galerie", section: "galerie" },
  { icon: MessageCircle, label: "Messages", section: "messages" },
  { icon: Settings, label: "Paramètres", section: "parametres" },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-muted-foreground hover:text-gold hover:bg-gold/5"
      aria-label="Changer de thème"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

export function DashboardLayout() {
  const { user, auth, ui, setActiveSection, toggleSidebar, setSidebarOpen } = useStore()
  const activeSection = ui.activeSection
  const sidebarOpen = ui.sidebarOpen

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [setSidebarOpen])

  const renderContent = () => {
    switch (activeSection) {
      case "accueil":
        return <DashboardHome />
      case "evenements":
        return <EventList />
      case "creer-evenement":
        return <EventCreate />
      case "invites":
        return <GuestManagement />
      case "tables":
        return <TableManagement />
      case "invitations":
        return <InvitationManagement />
      case "checkin":
        return <CheckInSection />
      case "galerie":
        return <GallerySection />
      case "messages":
        return <MessagingSection />
      case "parametres":
        return <SettingsSection />
      default:
        return <DashboardHome />
    }
  }

  const displayName = (user?.firstName && user?.lastName)
    ? `${user.firstName} ${user.lastName}`
    : user?.name || user?.email || "Utilisateur"

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border/50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <img src="/henobuildEvents.png" alt="HenoBuild Event" className="h-8 w-auto" />
            {sidebarOpen && (
              <div>
                <span className="font-heading text-lg font-bold gradient-gold-text">HenoBuild</span>
                <span className="font-heading text-lg font-light text-foreground ml-1">Event</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex text-muted-foreground hover:text-gold hover:bg-gold/5"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-gold hover:bg-gold/5"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.section
            return (
              <button
                key={item.section}
                onClick={() => {
                  setActiveSection(item.section)
                  if (window.innerWidth < 1024) setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "text-muted-foreground hover:text-gold hover:bg-gold/5"
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-gold" : "group-hover:text-gold"}`} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            )
          })}

          {/* Create event button */}
          <div className="pt-3">
            <Button
              onClick={() => {
                setActiveSection("creer-evenement")
                if (window.innerWidth < 1024) setSidebarOpen(false)
              }}
              className={`w-full btn-gold rounded-xl py-5 text-sm font-semibold ${!sidebarOpen ? "px-3" : ""}`}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="ml-2">Créer un événement</span>}
            </Button>
          </div>
        </nav>

        {/* Sidebar footer */}
        {sidebarOpen && (
          <div className="p-4 space-y-3 border-t border-border/30">
            {/* Install button */}
            <div className="flex justify-center">
              <InstallButton />
            </div>

            {/* Created by HenoBuild */}
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 text-center">
              Created by HenoBuild
            </p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 glass-dark border-b border-border/30">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-muted-foreground hover:text-gold hover:bg-gold/5"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div>
                <h1 className="text-base md:text-lg font-heading font-bold">
                  {sidebarItems.find((i) => i.section === activeSection)?.label || "Tableau de bord"}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Gérez vos événements avec élégance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Event Selector - only for sections that need it */}
              {["invites", "tables", "invitations", "checkin", "galerie", "messages"].includes(activeSection) && (
                <div className="hidden md:flex">
                  <EventSelector />
                </div>
              )}

              <ThemeToggle />

              <NotificationsPanel />

              <Separator orientation="vertical" className="h-6 mx-1" />

              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-gold/30">
                  <AvatarFallback className="gradient-gold text-black text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.role === "organizer" ? "Organisateur" : user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
