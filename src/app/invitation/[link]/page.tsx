"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Heart,
  X,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UtensilsCrossed,
  Users,
  MessageSquare,
} from "lucide-react";

// ============================================
// Types
// ============================================

interface GuestData {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: "INVITED" | "CONFIRMED" | "DECLINED" | "PRESENT";
  plusOne: boolean;
  plusOneName: string | null;
  dietaryReq: string | null;
}

interface EventData {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  coverImage: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  dressCode: string | null;
  hostName: string | null;
  hostTitle: string | null;
  type: string;
  theme: string;
  allowPlusOne: boolean;
}

interface InvitationData {
  id: string;
  uniqueLink: string;
  qrCodeData: string | null;
  isUsed: boolean;
  usedAt: string | null;
  message: string | null;
  expiresAt: string | null;
  guest: GuestData;
  event: EventData;
}

type PageState = "loading" | "error" | "expired" | "notfound" | "invitation" | "confirmed" | "declined";

// ============================================
// Confetti Component
// ============================================

function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }[] = [];

    const colors = ["#d4a853", "#e8c97a", "#b8922e", "#722f37", "#8c3e47", "#f5f0e8", "#FFD700"];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeCount = 0;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height) {
          p.opacity -= 0.02;
        }

        if (p.opacity > 0) {
          activeCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          // Draw different shapes
          if (p.size > 6) {
            // Star-like shape
            ctx.beginPath();
            for (let j = 0; j < 5; j++) {
              const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
              const method = j === 0 ? "moveTo" : "lineTo";
              ctx[method](Math.cos(angle) * p.size, Math.sin(angle) * p.size);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            // Rectangle
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          }

          ctx.restore();
        }
      });

      if (activeCount > 0) {
        animationId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

// ============================================
// Gold Particle Background
// ============================================

function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      opacityDir: number;
    }[] = [];

    const count = Math.min(60, Math.floor(window.innerWidth / 20));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        opacityDir: Math.random() > 0.5 ? 0.003 : -0.003,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacityDir;

        if (p.opacity >= 0.6 || p.opacity <= 0.05) {
          p.opacityDir *= -1;
        }

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        // Draw glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `rgba(212, 168, 83, ${p.opacity})`);
        gradient.addColorStop(0.5, `rgba(232, 201, 122, ${p.opacity * 0.3})`);
        gradient.addColorStop(1, "rgba(212, 168, 83, 0)");

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 201, 122, ${p.opacity * 1.5})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

// ============================================
// Date formatting helper
// ============================================

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatEventTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    WEDDING: "Mariage",
    ENGAGEMENT: "Fiançailles",
    BIRTHDAY: "Anniversaire",
    BAPTISM: "Baptême",
    CONFERENCE: "Conférence",
    CEREMONY: "Cérémonie",
    PRIVATE_PARTY: "Soirée Privée",
    VIP: "Événement VIP",
    GRADUATION: "Diplômation",
    RELIGIOUS: "Cérémonie Religieuse",
    FAMILY: "Réunion Familiale",
    PROFESSIONAL: "Événement Professionnel",
    GALA: "Gala",
    COCKTAIL: "Cocktail",
    MEETING: "Réunion",
    CUSTOM: "Événement Spécial",
  };
  return labels[type] || "Événement";
}

// ============================================
// Main RSVP Page Component
// ============================================

export default function RSVPPage({ params }: { params: Promise<{ link: string }> }) {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [plusOneEnabled, setPlusOneEnabled] = useState(false);
  const [plusOneName, setPlusOneName] = useState("");
  const [dietaryReq, setDietaryReq] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [link, setLink] = useState<string>("");

  // Public RSVP state variables
  const [isPublicLink, setIsPublicLink] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    params.then((p) => setLink(p.link));
  }, [params]);

  // Fetch invitation data
  const fetchInvitation = useCallback(async () => {
    if (!link) return;

    try {
      const res = await fetch(`/api/invitations/${link}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setPageState("notfound");
          setErrorMessage("Invitation non trouvée");
        } else if (res.status === 410) {
          setPageState("expired");
          setErrorMessage("Cette invitation a expiré");
        } else {
          setPageState("error");
          setErrorMessage(data.error || "Une erreur est survenue");
        }
        return;
      }

      const inv: InvitationData = data.invitation;
      setInvitation(inv);

      // Check if this is a public self-service link
      if ((inv as any).isPublicLink) {
        setIsPublicLink(true);
        setPageState("invitation");
        return;
      }

      // Pre-fill form from existing guest data
      if (inv.guest.plusOne) setPlusOneEnabled(true);
      if (inv.guest.plusOneName) setPlusOneName(inv.guest.plusOneName);
      if (inv.guest.dietaryReq) setDietaryReq(inv.guest.dietaryReq);

      // Set page state based on guest status
      if (inv.guest.status === "CONFIRMED" || inv.guest.status === "PRESENT") {
        setPageState("confirmed");
      } else if (inv.guest.status === "DECLINED") {
        setPageState("declined");
      } else {
        setPageState("invitation");
      }
    } catch {
      setPageState("error");
      setErrorMessage("Impossible de charger l'invitation");
    }
  }, [link]);

  useEffect(() => {
    fetchInvitation();
  }, [fetchInvitation]);

  // RSVP submission
  const handleRSVP = async (response: "accept" | "decline") => {
    if (!link || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        response,
        dietaryReq: dietaryReq || null,
        message: guestMessage || null,
      };

      if (invitation?.event.allowPlusOne) {
        body.plusOne = plusOneEnabled;
        body.plusOneName = plusOneEnabled ? plusOneName : null;
      }

      if (isPublicLink) {
        if (!firstName.trim() || !lastName.trim()) {
          setErrorMessage("Le prénom et le nom sont requis.");
          setIsSubmitting(false);
          return;
        }
        body.firstName = firstName;
        body.lastName = lastName;
        body.email = email || null;
        body.phone = phone || null;
      }

      const res = await fetch(`/api/invitations/${link}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Erreur lors de la réponse");
        setIsSubmitting(false);
        return;
      }

      if (data.invitation) {
        setInvitation(data.invitation);
        setIsPublicLink(false); // Reset public state to individual invite so QR displays
      }

      if (response === "accept") {
        setShowConfetti(true);
        setPageState("confirmed");
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        setPageState("declined");
      }
    } catch {
      setErrorMessage("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // Loading State
  // ============================================
  if (pageState === "loading") {
    return (
      <div className="min-h-screen gradient-premium flex items-center justify-center">
        <GoldParticles />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto" />
            <Sparkles className="w-6 h-6 text-gold-light absolute -top-2 -right-2 animate-glow" />
          </div>
          <p className="mt-4 text-cream-dark/70 text-sm font-sans">Chargement de votre invitation...</p>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // Error States
  // ============================================
  if (pageState === "notfound" || pageState === "expired" || pageState === "error") {
    return (
      <div className="min-h-screen gradient-premium flex items-center justify-center p-4">
        <GoldParticles />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-dark rounded-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <AlertCircle className="w-16 h-16 text-gold mx-auto mb-4" />
          </motion.div>
          <h1 className="font-heading text-2xl text-cream mb-3">
            {pageState === "expired" ? "Invitation Expirée" : "Invitation Introuvable"}
          </h1>
          <p className="text-cream-dark/60 text-sm mb-6">
            {pageState === "expired"
              ? "Cette invitation a malheureusement expiré. Veuillez contacter l'organisateur pour plus d'informations."
              : errorMessage || "Le lien que vous avez utilisé n'est pas valide ou l'invitation n'existe pas."}
          </p>
          <div className="divider-gold mb-6" />
          <p className="text-cream-dark/40 text-xs">
            Créé par <span className="gradient-gold-text font-semibold">HenoBuild</span>
          </p>
        </motion.div>
      </div>
    );
  }

  // At this point, invitation must exist
  const event = invitation!.event;
  const guest = invitation!.guest;

  // ============================================
  // Main Invitation Page
  // ============================================
  return (
    <div className="min-h-screen gradient-premium relative overflow-hidden">
      <GoldParticles />
      {showConfetti && <ConfettiEffect />}

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen py-6 px-4 sm:py-10">
        {/* Top decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-24 h-[2px] gradient-gold mb-6"
        />

        {/* "Vous êtes invité(e)" header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mb-2"
        >
          <p className="text-gold-light/60 text-xs uppercase tracking-[0.3em] font-sans mb-1">
            {getEventTypeLabel(event.type)}
          </p>
          <h2 className="font-heading text-cream-dark/80 text-lg sm:text-xl italic">
            Vous êtes invité(e)
          </h2>
        </motion.div>

        {/* Guest name */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mb-6"
        >
          {isPublicLink && pageState === "invitation" ? (
            <h1 className="font-heading text-3xl sm:text-4xl gradient-gold-text font-bold">
              Bienvenue
            </h1>
          ) : (
            <h1 className="font-heading text-3xl sm:text-4xl gradient-gold-text font-bold">
              {guest.firstName} {guest.lastName}
            </h1>
          )}
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-lg"
        >
          <div className="glass-dark rounded-2xl overflow-hidden card-premium card-premium-glow">
            {/* Cover Image */}
            {event.coverImage && (
              <div className="relative h-40 sm:h-48 overflow-hidden">
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-heading text-xl sm:text-2xl text-white font-bold leading-tight">
                    {event.title}
                  </h3>
                </div>
              </div>
            )}

            {/* Card Content */}
            <div className="p-5 sm:p-6">
              {/* Event title (if no cover image) */}
              {!event.coverImage && (
                <div className="text-center mb-5">
                  <h3 className="font-heading text-2xl sm:text-3xl gradient-gold-text font-bold">
                    {event.title}
                  </h3>
                </div>
              )}

              {/* Host */}
              {event.hostName && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-white/5 border border-gold/10"
                >
                  <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-cream-dark/50 text-xs">Organisé par</p>
                    <p className="text-cream font-medium text-sm">
                      {event.hostName}
                      {event.hostTitle && (
                        <span className="text-cream-dark/40 ml-1 text-xs">• {event.hostTitle}</span>
                      )}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Event details grid */}
              <div className="space-y-3 mb-5">
                {/* Date */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-cream text-sm font-medium capitalize">
                      {formatEventDate(event.date)}
                    </p>
                    {event.endDate && (
                      <p className="text-cream-dark/50 text-xs mt-0.5">
                        jusqu&apos;au {formatEventDate(event.endDate)}
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Time */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-cream text-sm font-medium">
                      {formatEventTime(event.date)}
                      {event.endDate && ` — ${formatEventTime(event.endDate)}`}
                    </p>
                  </div>
                </motion.div>

                {/* Location */}
                {(event.location || event.venue || event.address) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-cream text-sm font-medium">
                        {event.venue || event.location}
                      </p>
                      {(event.address || event.city) && (
                        <p className="text-cream-dark/50 text-xs mt-0.5">
                          {[event.address, event.city, event.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Dress Code */}
                {event.dressCode && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-cream-dark/50 text-xs">Code vestimentaire</p>
                      <p className="text-cream text-sm font-medium">{event.dressCode}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mb-5"
                >
                  <div className="divider-gold mb-4" />
                  <p className="text-cream-dark/60 text-sm leading-relaxed">
                    {event.description}
                  </p>
                </motion.div>
              )}

              {/* Personal message */}
              {invitation!.message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  className="mb-5 p-4 rounded-xl border border-gold/20 bg-gold/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gold" />
                    <p className="text-gold text-xs font-semibold uppercase tracking-wider">
                      Message personnel
                    </p>
                  </div>
                  <p className="text-cream/80 text-sm italic leading-relaxed">
                    &ldquo;{invitation!.message}&rdquo;
                  </p>
                </motion.div>
              )}

              {/* QR Code */}
              {(!isPublicLink || pageState === "confirmed") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4 }}
                  className="flex flex-col items-center mb-5"
                >
                  <div className="bg-white p-3 rounded-xl shadow-lg shadow-gold/10">
                    <QRCodeSVG
                      value={invitation!.qrCodeData || invitation!.uniqueLink}
                      size={120}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#0a0a0a"
                      imageSettings={{
                        src: "/henobuildEvents.png",
                        height: 24,
                        width: 24,
                        excavate: true,
                      }}
                    />
                  </div>
                  <p className="text-cream-dark/40 text-xs mt-2 text-center">
                    Présentez ce QR code à l&apos;entrée
                  </p>
                </motion.div>
              )}

              {(!isPublicLink || pageState === "confirmed") && <div className="divider-gold mb-5" />}

              {/* ============================================
                  RSVP Section
                  ============================================ */}
              <AnimatePresence mode="wait">
                {/* ----- Already Confirmed State ----- */}
                {pageState === "confirmed" && (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-gold mb-4"
                    >
                      <CheckCircle2 className="w-8 h-8 text-black" />
                    </motion.div>
                    <h3 className="font-heading text-xl gradient-gold-text font-bold mb-2">
                      Présence Confirmée
                    </h3>
                    <p className="text-cream-dark/60 text-sm mb-4">
                      Merci {guest.firstName} ! Votre présence a bien été enregistrée.
                      {guest.plusOne && guest.plusOneName && (
                        <span className="block mt-1">
                          Accompagné(e) par <span className="text-cream font-medium">{guest.plusOneName}</span>
                        </span>
                      )}
                    </p>
                    {guest.dietaryReq && (
                      <p className="text-cream-dark/40 text-xs">
                        Régime alimentaire enregistré : {guest.dietaryReq}
                      </p>
                    )}
                    <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-green-400 text-xs flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Nous avons hâte de vous accueillir !
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ----- Declined State ----- */}
                {pageState === "declined" && (
                  <motion.div
                    key="declined"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream-dark/10 border border-cream-dark/20 mb-4"
                    >
                      <X className="w-7 h-7 text-cream-dark/50" />
                    </motion.div>
                    <h3 className="font-heading text-xl text-cream-dark/70 mb-2">
                      Invitation Déclinée
                    </h3>
                    <p className="text-cream-dark/50 text-sm">
                      Nous comprenons votre choix, {guest.firstName}. Merci de nous avoir informé(e).
                    </p>
                  </motion.div>
                )}

                {/* ----- RSVP Form ----- */}
                {pageState === "invitation" && (
                  <motion.div
                    key="rsvp-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h3 className="font-heading text-lg text-cream text-center mb-4">
                      Confirmer votre présence
                    </h3>

                    {/* Public self-registration fields */}
                    {isPublicLink && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4 mb-5 p-4 rounded-xl bg-white/5 border border-gold/10 text-left"
                      >
                        <p className="text-xs text-gold font-semibold uppercase tracking-wider mb-2 text-center">
                          Vos informations personnelles
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-cream-dark/60 text-[10px] uppercase">Prénom *</label>
                            <input
                              type="text"
                              required
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Jean"
                              className="w-full bg-white/5 border border-gold/10 rounded-lg px-3 py-2 text-cream text-sm placeholder:text-cream-dark/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-cream-dark/60 text-[10px] uppercase">Nom *</label>
                            <input
                              type="text"
                              required
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Dupont"
                              className="w-full bg-white/5 border border-gold/10 rounded-lg px-3 py-2 text-cream text-sm placeholder:text-cream-dark/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-cream-dark/60 text-[10px] uppercase">Email</label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="jean@example.com"
                              className="w-full bg-white/5 border border-gold/10 rounded-lg px-3 py-2 text-cream text-sm placeholder:text-cream-dark/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-cream-dark/60 text-[10px] uppercase">Téléphone</label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+33 6 12 34 56"
                              className="w-full bg-white/5 border border-gold/10 rounded-lg px-3 py-2 text-cream text-sm placeholder:text-cream-dark/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Plus One Toggle */}
                    {event.allowPlusOne && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-4 p-3 rounded-xl bg-white/5 border border-gold/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gold" />
                            <span className="text-cream text-sm">
                              Venir accompagné(e)
                            </span>
                          </div>
                          <button
                            onClick={() => setPlusOneEnabled(!plusOneEnabled)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                              plusOneEnabled ? "bg-gold" : "bg-white/10"
                            }`}
                            role="switch"
                            aria-checked={plusOneEnabled}
                            aria-label="Activer l'accompagnant"
                          >
                            <motion.div
                              layout
                              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                              animate={{ left: plusOneEnabled ? "22px" : "2px" }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </div>

                        <AnimatePresence>
                          {plusOneEnabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-3 overflow-hidden"
                            >
                              <input
                                type="text"
                                value={plusOneName}
                                onChange={(e) => setPlusOneName(e.target.value)}
                                placeholder="Nom de l'accompagnant(e)"
                                className="w-full bg-white/5 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm placeholder:text-cream-dark/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Dietary Requirements */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mb-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <UtensilsCrossed className="w-4 h-4 text-gold/60" />
                        <label className="text-cream-dark/60 text-xs">
                          Régime alimentaire / allergies
                        </label>
                      </div>
                      <input
                        type="text"
                        value={dietaryReq}
                        onChange={(e) => setDietaryReq(e.target.value)}
                        placeholder="Végétarien, sans gluten, allergies..."
                        className="w-full bg-white/5 border border-gold/10 rounded-lg px-3 py-2 text-cream text-sm placeholder:text-cream-dark/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
                      />
                    </motion.div>

                    {/* Optional message */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="mb-6"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gold/60" />
                        <label className="text-cream-dark/60 text-xs">
                          Message pour l&apos;organisateur (optionnel)
                        </label>
                      </div>
                      <textarea
                        value={guestMessage}
                        onChange={(e) => setGuestMessage(e.target.value)}
                        placeholder="Un petit mot..."
                        rows={2}
                        className="w-full bg-white/5 border border-gold/10 rounded-lg px-3 py-2 text-cream text-sm placeholder:text-cream-dark/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all resize-none"
                      />
                    </motion.div>

                    {/* Error message */}
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                      >
                        <p className="text-red-400 text-xs text-center">{errorMessage}</p>
                      </motion.div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRSVP("accept")}
                        disabled={isSubmitting}
                        className="w-full btn-gold rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Heart className="w-5 h-5" />
                            <span className="font-semibold">Confirmer votre présence</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRSVP("decline")}
                        disabled={isSubmitting}
                        className="w-full rounded-xl py-2.5 px-6 flex items-center justify-center gap-2 text-sm text-cream-dark/50 border border-cream-dark/10 hover:border-cream-dark/20 hover:text-cream-dark/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        <span>Décliner l&apos;invitation</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Bottom decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="w-24 h-[2px] gradient-gold mt-6 mb-4"
        />

        {/* HenoBuild Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center"
        >
          <p className="text-cream-dark/30 text-xs">
            Créé par{" "}
            <span className="gradient-gold-text font-semibold">HenoBuild</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
