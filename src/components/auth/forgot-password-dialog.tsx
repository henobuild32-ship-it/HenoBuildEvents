"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Sparkles, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToLogin: () => void
}

export function ForgotPasswordDialog({ open, onOpenChange, onSwitchToLogin }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi")
        return
      }

      setIsSuccess(true)
    } catch {
      setError("Erreur de connexion au serveur")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after animation
    setTimeout(() => {
      setEmail("")
      setIsSuccess(false)
      setError("")
    }, 300)
  }

  const handleBackToLogin = () => {
    onOpenChange(false)
    setTimeout(() => {
      setEmail("")
      setIsSuccess(false)
      setError("")
      onSwitchToLogin()
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass-dark border-gold/20">
        <DialogHeader>
          <DialogTitle className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center shadow-lg shadow-gold/20">
                <KeyRound className="h-6 w-6 text-black" />
              </div>
              <span className="gradient-gold-text font-heading text-2xl font-bold">
                Mot de passe oublié
              </span>
            </motion.div>
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Entrez votre adresse email pour recevoir un lien de récupération
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 mt-2"
            >
              <div className="flex flex-col items-center text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
                </motion.div>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  Email envoyé !
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Un email de récupération a été envoyé à <strong className="text-gold">{email}</strong>.
                  Vérifiez votre boîte de réception et vos spams.
                </p>
              </div>

              <div className="divider-gold" />

              <Button
                onClick={handleBackToLogin}
                className="w-full btn-gold rounded-full py-5 text-base font-semibold"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4 mt-2"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-muted-foreground text-sm">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-gold/20 focus:border-gold/50"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-gold rounded-full py-5 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Envoi en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Envoyer le lien de récupération
                  </span>
                )}
              </Button>

              <div className="divider-gold" />

              <p className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-gold hover:text-gold-light font-semibold transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Retour à la connexion
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
