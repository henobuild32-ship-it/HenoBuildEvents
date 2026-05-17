"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet, TrendingDown, CreditCard, Receipt,
  Plus, Search, Filter, Pencil, Trash2, CheckCircle2,
  Clock, ChevronDown, Sparkles, CalendarDays, X, UtensilsCrossed,
  Flower2, Camera, Music, Shirt, Car, Palette, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, BarChart3, PiggyBank, Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────
interface Expense {
  id: string
  name: string
  category: string
  amount: number
  vendor: string | null
  date: string | null
  status: "PAID" | "PENDING"
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  totalPaid: number
  totalPending: number
  remaining: number
  expenseCount: number
  paidCount: number
  pendingCount: number
  byCategory: Record<string, { amount: number; count: number; label: string }>
}

// ─── Constants ────────────────────────────────────────────────────
const DEFAULT_TOTAL_BUDGET = 30000

const CATEGORY_MAP: Record<string, { label: string; color: string; icon: typeof UtensilsCrossed }> = {
  TRAITER: { label: "Traiteur", color: "#d4a853", icon: UtensilsCrossed },
  DECORATION: { label: "Décoration", color: "#e879f9", icon: Palette },
  LIEU: { label: "Lieu", color: "#60a5fa", icon: CalendarDays },
  PHOTOGRAPHIE: { label: "Photographie", color: "#34d399", icon: Camera },
  MUSIQUE: { label: "Musique", color: "#a78bfa", icon: Music },
  FLEURISTE: { label: "Fleuriste", color: "#fb7185", icon: Flower2 },
  TENUES: { label: "Tenues", color: "#fbbf24", icon: Shirt },
  TRANSPORT: { label: "Transport", color: "#38bdf8", icon: Car },
  AUTRES: { label: "Autres", color: "#94a3b8", icon: MoreHorizontal },
}

const CATEGORIES = Object.entries(CATEGORY_MAP).map(([value, data]) => ({
  value,
  label: data.label,
  color: data.color,
  icon: data.icon,
}))

// ─── Animation variants ──────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

// ─── Helper: format currency ─────────────────────────────────────
function fmtEur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
}

// ─── Category Icon helper ────────────────────────────────────────
function CategoryIcon({ category, className, style }: { category: string; className?: string; style?: React.CSSProperties }) {
  const cat = CATEGORIES.find((c) => c.value === category)
  if (!cat) return <MoreHorizontal className={className} style={style} />
  const Icon = cat.icon
  return <Icon className={className} style={style} />
}

function CategoryColor(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.color ?? "#94a3b8"
}

// ─── Budget Progress Ring ────────────────────────────────────────
function BudgetProgressRing({ spent, total, size = 140 }: { spent: number; total: number; size?: number }) {
  const ratio = total > 0 ? spent / total : 0
  const pct = Math.round(ratio * 100)
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - ratio * circumference

  const getColor = () => {
    if (pct > 90) return { stroke: "#ef4444", label: "Critique", text: "text-red-500" }
    if (pct > 70) return { stroke: "#f59e0b", label: "Attention", text: "text-amber-500" }
    return { stroke: "#10b981", label: "Sain", text: "text-emerald-500" }
  }
  const c = getColor()

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={8}
          className="text-muted/20"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={c.stroke} strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-heading">{pct}%</span>
        <span className={`text-[10px] font-medium ${c.text}`}>{c.label}</span>
      </div>
    </div>
  )
}

// ─── Monthly Spending Trend (FIXED: deterministic values) ────────
function MonthlyTrend({ expenses }: { expenses: Expense[] }) {
  const months = useMemo(() => {
    const now = new Date()
    const labels: string[] = []
    const values: number[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      labels.push(d.toLocaleDateString("fr-FR", { month: "short" }))
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      // Only sum actual expenses for months that match; 0 for months with no data
      const total = expenses
        .filter((e) => e.date && e.date.startsWith(mKey))
        .reduce((s, e) => s + e.amount, 0)
      values.push(total)
    }
    return { labels, values }
  }, [expenses])

  const maxVal = Math.max(...months.values, 1)

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-28">
        {months.values.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              className="w-full rounded-t-md bg-gradient-to-t from-gold-dark via-gold to-gold-light relative group cursor-pointer"
              initial={{ height: 0 }}
              animate={{ height: val > 0 ? `${Math.max(8, (val / maxVal) * 100)}%` : "4px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
              style={val === 0 ? { opacity: 0.3 } : undefined}
            >
              {val > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-gold/20 rounded-lg px-2 py-1 text-[10px] font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-10">
                  {fmtEur(val)}
                </div>
              )}
            </motion.div>
            <span className="text-[10px] text-muted-foreground">{months.labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
export function BudgetSection() {
  const { currentEvent, auth } = useStore()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formVendor, setFormVendor] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formStatus, setFormStatus] = useState<"PAID" | "PENDING">("PENDING")
  const [formNotes, setFormNotes] = useState("")

  // ─── Fetch expenses from API ──────────────────────────────────
  const fetchBudget = useCallback(async () => {
    if (!currentEvent?.id || !auth.token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/budget?eventId=${currentEvent.id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors du chargement du budget")
      }
      const data = await res.json()
      setExpenses(data.expenses || [])
      setSummary(data.summary || null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [currentEvent?.id, auth.token])

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

  // ─── Computed values ──────────────────────────────────────────
  const totalBudget = summary?.totalBudget ?? DEFAULT_TOTAL_BUDGET
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])
  const remaining = totalBudget - totalSpent
  const paidCount = expenses.filter((e) => e.status === "PAID").length
  const pendingCount = expenses.filter((e) => e.status === "PENDING").length

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    expenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount)
    })
    return CATEGORIES
      .filter((c) => (map.get(c.value) || 0) > 0)
      .map((c) => ({ ...c, amount: map.get(c.value) || 0, pct: totalBudget > 0 ? ((map.get(c.value) || 0) / totalBudget) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses, totalBudget])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = !searchQuery ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.vendor && e.vendor.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchCategory = filterCategory === "all" || e.category === filterCategory
      const matchStatus = filterStatus === "all" || e.status === filterStatus
      return matchSearch && matchCategory && matchStatus
    })
  }, [expenses, searchQuery, filterCategory, filterStatus])

  // ─── Handlers ─────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormName("")
    setFormCategory("")
    setFormAmount("")
    setFormVendor("")
    setFormDate("")
    setFormStatus("PENDING")
    setFormNotes("")
    setEditingExpense(null)
  }, [])

  const openAddDialog = useCallback(() => {
    resetForm()
    setAddDialogOpen(true)
  }, [resetForm])

  const openEditDialog = useCallback((expense: Expense) => {
    setEditingExpense(expense)
    setFormName(expense.name)
    setFormCategory(expense.category)
    setFormAmount(String(expense.amount))
    setFormVendor(expense.vendor || "")
    setFormDate(expense.date ? expense.date.slice(0, 10) : "")
    setFormStatus(expense.status)
    setFormNotes(expense.notes || "")
    setAddDialogOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!currentEvent?.id || !auth.token) {
      toast.error("Aucun événement sélectionné")
      return
    }
    if (!formName.trim()) {
      toast.error("Le nom de la dépense est requis")
      return
    }
    if (!formCategory) {
      toast.error("Veuillez sélectionner une catégorie")
      return
    }
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error("Le montant doit être supérieur à 0")
      return
    }

    setSaving(true)

    try {
      if (editingExpense) {
        // PATCH - update existing
        const res = await fetch(`/api/budget?eventId=${currentEvent.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            expenseId: editingExpense.id,
            name: formName.trim(),
            category: formCategory,
            amount: Number(formAmount),
            vendor: formVendor.trim() || null,
            date: formDate || null,
            status: formStatus,
            notes: formNotes.trim() || null,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Erreur lors de la modification")
        }

        toast.success("Dépense modifiée avec succès")
      } else {
        // POST - create new
        const res = await fetch("/api/budget", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            eventId: currentEvent.id,
            name: formName.trim(),
            category: formCategory,
            amount: Number(formAmount),
            vendor: formVendor.trim() || null,
            date: formDate || null,
            status: formStatus,
            notes: formNotes.trim() || null,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Erreur lors de l'ajout")
        }

        toast.success("Dépense ajoutée avec succès")
      }

      setAddDialogOpen(false)
      resetForm()
      await fetchBudget()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }, [currentEvent?.id, auth.token, formName, formCategory, formAmount, formVendor, formDate, formStatus, formNotes, editingExpense, resetForm, fetchBudget])

  const handleDelete = useCallback(async (id: string) => {
    if (!auth.token) return

    setDeleting(id)

    try {
      const res = await fetch(`/api/budget?expenseId=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de la suppression")
      }

      toast.success("Dépense supprimée")
      await fetchBudget()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue"
      toast.error(message)
    } finally {
      setDeleting(null)
    }
  }, [auth.token, fetchBudget])

  const toggleStatus = useCallback(async (expense: Expense) => {
    if (!auth.token || !currentEvent?.id) return

    const newStatus = expense.status === "PAID" ? "PENDING" : "PAID"

    // Optimistic update
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === expense.id ? { ...e, status: newStatus } : e
      )
    )

    try {
      const res = await fetch(`/api/budget?eventId=${currentEvent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          expenseId: expense.id,
          status: newStatus,
        }),
      })

      if (!res.ok) {
        // Revert on failure
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === expense.id ? { ...e, status: expense.status } : e
          )
        )
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de la mise à jour")
      }

      toast.success(newStatus === "PAID" ? "Marqué comme payé" : "Marqué en attente")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue"
      toast.error(message)
    }
  }, [auth.token, currentEvent?.id])

  // ─── No event state ──────────────────────────────────────────
  if (!currentEvent) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-4 animate-float">
          <Wallet className="h-10 w-10 text-gold" />
        </div>
        <h3 className="font-heading text-xl font-bold mb-2">Aucun événement sélectionné</h3>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Sélectionnez un événement pour accéder à la gestion du budget
        </p>
        <div className="mt-6 text-xs text-muted-foreground/50 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-gold/40" />
          Créé par HenoBuild
        </div>
      </motion.div>
    )
  }

  // ─── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-gold animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">Chargement du budget...</p>
      </div>
    )
  }

  // ─── Error state ─────────────────────────────────────────────
  if (error && expenses.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Receipt className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <Button onClick={fetchBudget} variant="outline" className="mt-4 border-gold/20 rounded-full text-xs">
          Réessayer
        </Button>
      </motion.div>
    )
  }

  // ─── Overview stat cards ─────────────────────────────────────
  const statCards = [
    {
      icon: Wallet,
      label: "Budget total",
      value: fmtEur(totalBudget),
      sub: "Budget prévu",
      color: "text-gold",
      iconBg: "gradient-gold",
      iconColor: "text-black",
      gradient: "from-gold/10 via-gold/5 to-transparent",
    },
    {
      icon: CreditCard,
      label: "Total dépensé",
      value: fmtEur(totalSpent),
      sub: `${paidCount} payé${paidCount !== 1 ? "s" : ""} · ${pendingCount} en attente`,
      color: "text-amber-500",
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
      gradient: "from-amber-500/8 via-amber-500/4 to-transparent",
      trend: totalSpent > totalBudget * 0.8 ? "up" as const : "down" as const,
    },
    {
      icon: PiggyBank,
      label: "Budget restant",
      value: fmtEur(remaining),
      sub: `${Math.round(((totalBudget - totalSpent) / totalBudget) * 100)}% disponible`,
      color: remaining > 0 ? "text-emerald-500" : "text-red-500",
      iconBg: remaining > 0 ? "bg-emerald-500/15" : "bg-red-500/15",
      iconColor: remaining > 0 ? "text-emerald-500" : "text-red-500",
      gradient: remaining > 0
        ? "from-emerald-500/8 via-emerald-500/4 to-transparent"
        : "from-red-500/8 via-red-500/4 to-transparent",
    },
    {
      icon: Receipt,
      label: "Nombre de dépenses",
      value: String(expenses.length),
      sub: `${CATEGORIES.filter((c) => expenses.some((e) => e.category === c.value)).length} catégories`,
      color: "text-purple-500",
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-500",
      gradient: "from-purple-500/8 via-purple-500/4 to-transparent",
    },
  ]

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6 text-gold" />
              Gestion du Budget
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {currentEvent.title} — Suivez vos dépenses et maîtrisez votre budget
            </p>
          </div>
          <motion.button
            onClick={openAddDialog}
            className="btn-gold rounded-full text-sm inline-flex items-center justify-center px-4 py-2 font-medium"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une dépense
          </motion.button>
        </div>
      </motion.div>

      {/* ─── Overview Cards ──────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <Card className="border-border/50 hover:border-gold/20 transition-all group overflow-hidden relative shimmer-card card-hover-lift">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  {stat.trend && (
                    <div className={`flex items-center gap-0.5 ${stat.trend === "up" ? "text-red-500" : "text-emerald-500"}`}>
                      {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      <span className="text-[10px] font-medium">
                        {stat.trend === "up" ? "Élevé" : "Modéré"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-xl font-bold font-heading">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Budget Ring + Category Breakdown ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress Ring */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="border-gold/20 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gold" />
                Progression du budget
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              <BudgetProgressRing spent={totalSpent} total={totalBudget} />
              <div className="mt-4 text-center space-y-1">
                <p className="text-sm font-medium">
                  <span className="text-gold">{fmtEur(totalSpent)}</span>
                  <span className="text-muted-foreground"> / {fmtEur(totalBudget)}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmtEur(remaining)} restant{remaining < 0 ? " (dépassement !)" : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                Répartition par catégorie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-72 overflow-y-auto scroll-smooth-gold pr-1">
              {categoryBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Receipt className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune dépense enregistrée</p>
                </div>
              ) : (
                categoryBreakdown.map((cat, i) => (
                  <motion.div
                    key={cat.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <CategoryIcon category={cat.value} className="h-3.5 w-3.5" style={{ color: cat.color }} />
                        </div>
                        <span className="text-sm font-medium">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{fmtEur(cat.amount)}</span>
                        <span className="text-[10px] text-muted-foreground w-10 text-right">
                          {Math.round(cat.pct)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Monthly Spending Trend ──────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-gold" />
              Tendance mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrend expenses={expenses} />
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Expense List ────────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gold" />
                Liste des dépenses
                <Badge variant="outline" className="border-gold/20 text-gold text-[10px] ml-1">
                  {filteredExpenses.length}
                </Badge>
              </CardTitle>
              <motion.button
                onClick={openAddDialog}
                className="btn-gold rounded-full text-xs inline-flex items-center justify-center px-3 py-1.5 font-medium self-start sm:self-auto"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </motion.button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une dépense..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-gold/20 focus:border-gold/40 input-premium h-9 text-sm"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[160px] border-gold/20 h-9 text-xs">
                  <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px] border-gold/20 h-9 text-xs">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PAID">Payé</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto scroll-smooth-gold pr-1">
              <AnimatePresence mode="popLayout">
                {filteredExpenses.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-3 animate-float">
                      <Receipt className="h-7 w-7 text-gold/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">Aucune dépense trouvée</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Modifiez vos filtres ou ajoutez une dépense</p>
                  </motion.div>
                ) : (
                  filteredExpenses.map((expense, i) => (
                    <motion.div
                      key={expense.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-gold/20 hover:bg-gold/5 transition-all"
                    >
                      {/* Category dot */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${CategoryColor(expense.category)}15` }}
                      >
                        <CategoryIcon category={expense.category} className="h-4 w-4" style={{ color: CategoryColor(expense.category) }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{expense.name}</p>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 shrink-0 ${
                              expense.status === "PAID"
                                ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                                : "border-amber-500/30 text-amber-600 bg-amber-500/5"
                            }`}
                          >
                            {expense.status === "PAID" ? (
                              <><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Payé</>
                            ) : (
                              <><Clock className="h-2.5 w-2.5 mr-0.5" /> En attente</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {expense.vendor || "—"} · {expense.date ? new Date(expense.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </p>
                      </div>

                      {/* Amount + Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold font-heading text-gold">
                          {fmtEur(expense.amount)}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-gold/10"
                            onClick={() => toggleStatus(expense)}
                            title={expense.status === "PAID" ? "Marquer en attente" : "Marquer payé"}
                            disabled={deleting === expense.id}
                          >
                            {expense.status === "PAID" ? (
                              <Clock className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-gold/10"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-gold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-red-500/10"
                            onClick={() => handleDelete(expense.id)}
                            disabled={deleting === expense.id}
                          >
                            {deleting === expense.id ? (
                              <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Add / Edit Expense Dialog ───────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="glass-dark border-gold/20 text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
                <Plus className="h-4 w-4 text-black" />
              </div>
              {editingExpense ? "Modifier la dépense" : "Ajouter une dépense"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {editingExpense
                ? "Modifiez les informations de la dépense ci-dessous"
                : "Remplissez les informations pour ajouter une nouvelle dépense"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Traiteur Saveurs d'Orient"
                className="border-gold/20 focus:border-gold/40 input-premium h-9"
              />
            </div>

            {/* Category + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Catégorie</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="border-gold/20 h-9 text-xs w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Montant (€)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  className="border-gold/20 focus:border-gold/40 input-premium h-9"
                />
              </div>
            </div>

            {/* Vendor + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fournisseur</Label>
                <Input
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  placeholder="Nom du fournisseur"
                  className="border-gold/20 focus:border-gold/40 input-premium h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="border-gold/20 focus:border-gold/40 input-premium h-9"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Statut du paiement</Label>
              <Select value={formStatus} onValueChange={(v: "PAID" | "PENDING") => setFormStatus(v)}>
                <SelectTrigger className="border-gold/20 h-9 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="PAID">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Notes supplémentaires (optionnel)"
                className="border-gold/20 focus:border-gold/40 input-premium text-sm min-h-[60px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="border-gold/20 rounded-full text-xs" disabled={saving}>
                Annuler
              </Button>
            </DialogClose>
            <motion.button
              onClick={handleSave}
              className="btn-gold rounded-full text-xs inline-flex items-center justify-center px-4 py-2 font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={saving}
            >
              {saving ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Enregistrement...</>
              ) : editingExpense ? (
                <><Pencil className="h-3.5 w-3.5 mr-1" /> Modifier</>
              ) : (
                <><Plus className="h-3.5 w-3.5 mr-1" /> Ajouter</>
              )}
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Branding ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-1.5 pt-2 pb-4"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/5 border border-gold/10">
          <Sparkles className="h-3 w-3 text-gold" />
          <span className="text-[10px] text-gold/60 uppercase tracking-wider font-medium">
            Créé par HenoBuild
          </span>
        </div>
      </motion.div>
    </div>
  )
}
