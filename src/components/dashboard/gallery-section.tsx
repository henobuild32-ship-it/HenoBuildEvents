"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera, Upload, Image as ImageIcon, Film, Star, X, ChevronLeft,
  ChevronRight, Download, Trash2, FolderOpen, Plus, Search, Grid3X3,
  Sparkles, Check
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

// ========================
// Types
// ========================

interface GalleryAlbum {
  id: string
  name: string
  description?: string | null
  coverImage?: string | null
  isPublic: boolean
  createdAt: string
  _count?: { items: number }
}

interface GalleryItem {
  id: string
  type: "PHOTO" | "VIDEO"
  url: string
  thumbnailUrl?: string | null
  caption?: string | null
  fileName?: string | null
  fileSize?: number | null
  isFeatured: boolean
  albumId?: string | null
  album?: { id: string; name: string } | null
  createdAt: string
}

type FilterTab = "all" | "photos" | "videos" | "featured"

// ========================
// Placeholder gradients for empty gallery
// ========================

const PLACEHOLDER_GRADIENTS = [
  "from-amber-400 via-orange-300 to-yellow-200",
  "from-rose-400 via-pink-300 to-red-200",
  "from-emerald-400 via-teal-300 to-green-200",
  "from-violet-400 via-purple-300 to-indigo-200",
  "from-sky-400 via-blue-300 to-cyan-200",
  "from-fuchsia-400 via-pink-300 to-rose-200",
  "from-lime-400 via-green-300 to-emerald-200",
  "from-amber-500 via-yellow-300 to-orange-200",
]

const PLACEHOLDER_ICONS = ["💒", "🎊", "🥂", "🎉", "💍", "🌹", "✨", "🎵"]

// ========================
// Upload Dialog Component
// ========================

function UploadDialog({
  open,
  onOpenChange,
  eventId,
  token,
  albums,
  onUploaded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  token: string
  albums: GalleryAlbum[]
  onUploaded: () => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [caption, setCaption] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFiles([])
      setCaption("")
      setIsFeatured(false)
      setSelectedAlbumId(null)
      setPreviews([])
    }
  }, [open])

  // Generate previews for selected files
  useEffect(() => {
    if (files.length === 0) {
      setPreviews([])
      return
    }
    const urls: string[] = []
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          urls.push(e.target.result as string)
          if (urls.length === files.length) setPreviews(urls)
        }
      }
      reader.readAsDataURL(file)
    })
  }, [files])

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    const imageFiles = arr.filter((f) => f.type.startsWith("image/"))
    if (imageFiles.length < arr.length) {
      toast.warning(`${arr.length - imageFiles.length} fichier(s) ignoré(s) — seules les images sont acceptées`)
    }
    if (imageFiles.length === 0) {
      toast.error("Aucune image valide sélectionnée")
      return
    }
    setFiles((prev) => [...prev, ...imageFiles])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleUpload = async () => {
    if (files.length === 0) return
    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()

        await new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            const base64Url = reader.result as string
            try {
              const res = await fetch("/api/gallery", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  eventId,
                  type: "PHOTO",
                  url: base64Url,
                  caption: files.length === 1 ? caption : caption ? `${caption} (${i + 1})` : null,
                  isFeatured: isFeatured && i === 0,
                  albumId: selectedAlbumId,
                  fileName: file.name,
                  fileSize: file.size,
                  mimeType: file.type,
                }),
              })
              if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Erreur d'envoi")
              }
              resolve()
            } catch (err) {
              reject(err)
            }
          }
          reader.onerror = () => reject(new Error("Erreur de lecture du fichier"))
          reader.readAsDataURL(file)
        })
      }

      toast.success(`${files.length} image(s) ajoutée(s) à la galerie`)
      onUploaded()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi")
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass border-gold/20">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Upload className="h-5 w-5 text-gold" />
            Téléverser des images
          </DialogTitle>
          <DialogDescription>
            Ajoutez des photos à la galerie de votre événement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300
              ${isDragging
                ? "border-gold bg-gold/5 scale-[1.02]"
                : "border-border hover:border-gold/40 hover:bg-gold/[0.02]"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <motion.div animate={isDragging ? { scale: 1.1 } : { scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
              <Upload className="h-10 w-10 text-gold/40 mx-auto mb-3" />
            </motion.div>
            <p className="text-sm font-medium text-foreground">
              Glissez-déposez vos images ici
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ou cliquez pour sélectionner • PNG, JPG, WEBP
            </p>
          </div>

          {/* File Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-border/50 group"
                >
                  <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                    className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Légende</Label>
            <Textarea
              id="caption"
              placeholder="Ajouter une légende..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Featured checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={isFeatured}
              onCheckedChange={(checked) => setIsFeatured(checked === true)}
              className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
            <Label htmlFor="featured" className="flex items-center gap-1.5 cursor-pointer">
              <Star className="h-3.5 w-3.5 text-gold" />
              Marquer comme vedette
            </Label>
          </div>

          {/* Album selector */}
          {albums.length > 0 && (
            <div className="space-y-2">
              <Label>Album (optionnel)</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedAlbumId(null)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    !selectedAlbumId
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:border-gold/30"
                  }`}
                >
                  Aucun album
                </button>
                {albums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => setSelectedAlbumId(album.id)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                      selectedAlbumId === album.id
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-muted-foreground hover:border-gold/30"
                    }`}
                  >
                    <FolderOpen className="h-3 w-3 inline mr-1" />
                    {album.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Annuler
          </Button>
          <Button
            className="btn-gold rounded-full"
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full"
                />
                Envoi en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Envoyer {files.length > 0 ? `(${files.length})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========================
// Lightbox Component
// ========================

function ImageLightbox({
  items,
  currentIndex,
  onClose,
  onSetIndex,
  onToggleFeatured,
  onDelete,
}: {
  items: GalleryItem[]
  currentIndex: number
  onClose: () => void
  onSetIndex: (index: number) => void
  onToggleFeatured: (item: GalleryItem) => void
  onDelete: (item: GalleryItem) => void
}) {
  const item = items[currentIndex]

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) onSetIndex(currentIndex + 1)
  }, [currentIndex, items.length, onSetIndex])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onSetIndex(currentIndex - 1)
  }, [currentIndex, onSetIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") goNext()
      if (e.key === "ArrowLeft") goPrev()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose, goNext, goPrev])

  if (!item) return null

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = item.url
    link.download = item.fileName || `gallery-item-${item.id}`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </motion.button>
        )}
        {currentIndex < items.length - 1 && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={(e) => { e.stopPropagation(); goNext() }}
            className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </motion.button>
        )}

        {/* Image */}
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <img
              src={item.url}
              alt={item.caption || "Image de la galerie"}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            {/* Featured badge */}
            {item.isFeatured && (
              <Badge className="absolute top-3 left-3 gradient-gold text-black border-0 shadow-lg">
                <Star className="h-3 w-3 mr-1 fill-current" /> Vedette
              </Badge>
            )}
          </div>

          {/* Caption & Actions bar */}
          <div className="mt-4 flex items-center justify-between w-full max-w-2xl px-2">
            <div className="flex-1">
              {item.caption && (
                <p className="text-white/90 text-sm font-medium">{item.caption}</p>
              )}
              <p className="text-white/40 text-xs mt-0.5">
                {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric"
                })}
                {item.album && ` • ${item.album.name}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFeatured(item)}
                className={`p-2 rounded-full transition-colors ${
                  item.isFeatured
                    ? "bg-gold/20 text-gold"
                    : "bg-white/10 text-white/60 hover:text-gold hover:bg-gold/10"
                }`}
                title={item.isFeatured ? "Retirer des vedettes" : "Marquer comme vedette"}
              >
                <Star className={`h-4 w-4 ${item.isFeatured ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                title="Télécharger"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(item)}
                className="p-2 rounded-full bg-white/10 text-white/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-sm">
          {currentIndex + 1} / {items.length}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ========================
// Gallery Grid Item
// ========================

function GalleryGridItem({
  item,
  index,
  onClick,
  onToggleFeatured,
  onDelete,
}: {
  item: GalleryItem
  index: number
  onClick: () => void
  onToggleFeatured: () => void
  onDelete: () => void
}) {
  // Featured items get larger span
  const isLarge = item.isFeatured
  const colSpan = isLarge ? "md:col-span-2" : ""
  const rowSpan = isLarge ? "md:row-span-2" : ""

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative rounded-xl overflow-hidden border border-border/50 hover:border-gold/30 transition-all duration-300 cursor-pointer card-premium ${colSpan} ${rowSpan}`}
      onClick={onClick}
    >
      {/* Image */}
      <div className={`w-full ${isLarge ? "aspect-[4/3]" : "aspect-square"} bg-muted/30 overflow-hidden`}>
        {item.url.startsWith("data:") || item.url.startsWith("http") ? (
          <img
            src={item.url}
            alt={item.caption || "Image de la galerie"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/5 to-muted/30">
            {item.type === "PHOTO" ? (
              <ImageIcon className="h-8 w-8 text-gold/30" />
            ) : (
              <Film className="h-8 w-8 text-gold/30" />
            )}
          </div>
        )}
      </div>

      {/* Featured badge */}
      {item.isFeatured && (
        <Badge className="absolute top-2 right-2 gradient-gold text-black text-[10px] border-0 shadow-md">
          <Star className="h-3 w-3 mr-0.5 fill-current" /> Vedette
        </Badge>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
        {/* Caption */}
        {item.caption && (
          <p className="text-white text-sm font-medium truncate mb-2">{item.caption}</p>
        )}

        {/* Album info */}
        {item.album && (
          <p className="text-white/60 text-xs flex items-center gap-1 mb-2">
            <FolderOpen className="h-3 w-3" /> {item.album.name}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFeatured() }}
            className={`p-1.5 rounded-full transition-colors ${
              item.isFeatured
                ? "bg-gold/30 text-gold"
                : "bg-white/10 text-white/70 hover:text-gold hover:bg-gold/20"
            }`}
            title={item.isFeatured ? "Retirer des vedettes" : "Marquer comme vedette"}
          >
            <Star className={`h-3.5 w-3.5 ${item.isFeatured ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded-full bg-white/10 text-white/70 hover:text-destructive hover:bg-destructive/20 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ========================
// Placeholder Item for Empty Gallery
// ========================

function PlaceholderItem({ index }: { index: number }) {
  const gradient = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
  const icon = PLACEHOLDER_ICONS[index % PLACEHOLDER_ICONS.length]
  const isLarge = index === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`relative rounded-xl overflow-hidden border border-border/30 ${isLarge ? "md:col-span-2 md:row-span-2" : ""} cursor-default`}
    >
      <div
        className={`w-full ${isLarge ? "aspect-[4/3]" : "aspect-square"} bg-gradient-to-br ${gradient} flex items-center justify-center relative`}
      >
        <span className="text-4xl md:text-5xl opacity-50 filter drop-shadow-sm">
          {icon}
        </span>
        {/* Decorative overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <div className="h-2 w-3/4 rounded-full bg-white/30" />
          <div className="h-1.5 w-1/2 rounded-full bg-white/20 mt-1" />
        </div>
      </div>
    </motion.div>
  )
}

// ========================
// Main Gallery Section
// ========================

export function GallerySection() {
  const { auth, currentEventId, events } = useStore()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null)

  const currentEvent = events.find((e) => e.id === currentEventId)

  // Fetch gallery items
  const fetchGallery = useCallback(async () => {
    if (!currentEventId || !auth.token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/gallery?eventId=${currentEventId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data.galleryItems || [])
      }
    } catch (err) {
      console.error("Failed to fetch gallery:", err)
      toast.error("Erreur lors du chargement de la galerie")
    } finally {
      setIsLoading(false)
    }
  }, [currentEventId, auth.token])

  // Fetch albums
  const fetchAlbums = useCallback(async () => {
    if (!currentEventId || !auth.token) return
    try {
      const res = await fetch(`/api/gallery?eventId=${currentEventId}&albums=true`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAlbums(data.albums || [])
      }
    } catch (err) {
      console.error("Failed to fetch albums:", err)
    }
  }, [currentEventId, auth.token])

  useEffect(() => {
    if (currentEventId) {
      fetchGallery()
      fetchAlbums()
    }
  }, [currentEventId, fetchGallery, fetchAlbums])

  // Toggle featured
  const toggleFeatured = async (item: GalleryItem) => {
    if (!auth.token) return
    try {
      const res = await fetch("/api/gallery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ id: item.id, isFeatured: !item.isFeatured }),
      })
      if (res.ok) {
        toast.success(item.isFeatured ? "Retiré des vedettes" : "Marqué comme vedette ⭐")
        fetchGallery()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
  }

  // Delete item
  const deleteItem = async (item: GalleryItem) => {
    if (!auth.token) return
    try {
      const res = await fetch(`/api/gallery?id=${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      if (res.ok) {
        toast.success("Image supprimée")
        setDeleteTarget(null)
        if (lightboxIndex !== null) setLightboxIndex(null)
        fetchGallery()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    }
  }

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (activeAlbumId && item.albumId !== activeAlbumId) return false
    switch (activeFilter) {
      case "photos": return item.type === "PHOTO"
      case "videos": return item.type === "VIDEO"
      case "featured": return item.isFeatured
      default: return true
    }
  })

  // Stats
  const photoCount = items.filter((i) => i.type === "PHOTO").length
  const videoCount = items.filter((i) => i.type === "VIDEO").length
  const featuredCount = items.filter((i) => i.isFeatured).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Camera className="h-6 w-6 text-gold" />
            Galerie
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentEvent ? currentEvent.title : "Sélectionnez un événement"}
          </p>
        </div>
        <Button
          className="btn-gold rounded-full"
          disabled={!currentEventId}
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Téléverser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-border/50 card-premium">
          <CardContent className="p-4 text-center">
            <ImageIcon className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold font-heading">{photoCount}</p>
            <p className="text-xs text-muted-foreground">Photos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-premium">
          <CardContent className="p-4 text-center">
            <Film className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold font-heading">{videoCount}</p>
            <p className="text-xs text-muted-foreground">Vidéos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 card-premium">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold font-heading">{featuredCount}</p>
            <p className="text-xs text-muted-foreground">En vedette</p>
          </CardContent>
        </Card>
      </div>

      {/* No event selected */}
      {!currentEventId ? (
        <div className="text-center py-16">
          <Camera className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Sélectionnez un événement pour voir la galerie</p>
        </div>
      ) : (
        <>
          {/* Filter Tabs + Albums */}
          <div className="space-y-3">
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterTab)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all" className="gap-1 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                  <Grid3X3 className="h-3.5 w-3.5" />
                  Tout
                </TabsTrigger>
                <TabsTrigger value="photos" className="gap-1 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Photos
                </TabsTrigger>
                <TabsTrigger value="videos" className="gap-1 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                  <Film className="h-3.5 w-3.5" />
                  Vidéos
                </TabsTrigger>
                <TabsTrigger value="featured" className="gap-1 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                  <Star className="h-3.5 w-3.5" />
                  Vedettes
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Album filter pills */}
            {albums.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" /> Albums :
                </span>
                <button
                  onClick={() => setActiveAlbumId(null)}
                  className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-all ${
                    !activeAlbumId
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:border-gold/30"
                  }`}
                >
                  Tous
                </button>
                {albums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => setActiveAlbumId(album.id)}
                    className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-all ${
                      activeAlbumId === album.id
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-muted-foreground hover:border-gold/30"
                    }`}
                  >
                    {album.name}
                    {album._count && (
                      <span className="ml-1 opacity-50">({album._count.items})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className={`aspect-square bg-muted/30 rounded-xl animate-pulse ${
                    i === 1 ? "md:col-span-2 md:row-span-2 md:aspect-auto" : ""
                  }`}
                />
              ))}
            </div>
          ) : filteredItems.length === 0 && items.length === 0 ? (
            /* Empty state with placeholders */
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="relative inline-block">
                  <Sparkles className="h-12 w-12 text-gold/30 mx-auto mb-3" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">Galerie vide</h3>
                <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
                  Votre galerie n&apos;a pas encore d&apos;images. Téléversez des photos ou attendez que vos invités partagent leurs clichés !
                </p>
                <Button
                  className="btn-gold rounded-full"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Téléverser des images
                </Button>
              </div>

              {/* Placeholder grid with gradient images */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 opacity-60">
                {Array.from({ length: 8 }).map((_, i) => (
                  <PlaceholderItem key={i} index={i} />
                ))}
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            /* No items match filter */
            <div className="text-center py-12">
              <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Aucun élément ne correspond à ce filtre</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <GalleryGridItem
                    key={item.id}
                    item={item}
                    index={index}
                    onClick={() => setLightboxIndex(index)}
                    onToggleFeatured={() => toggleFeatured(item)}
                    onDelete={() => setDeleteTarget(item)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}

      {/* Upload Dialog */}
      {currentEventId && auth.token && (
        <UploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          eventId={currentEventId}
          token={auth.token}
          albums={albums}
          onUploaded={fetchGallery}
        />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && filteredItems.length > 0 && (
        <ImageLightbox
          items={filteredItems}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onSetIndex={setLightboxIndex}
          onToggleFeatured={toggleFeatured}
          onDelete={(item) => setDeleteTarget(item)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="glass border-gold/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Supprimer cette image ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;image sera définitivement supprimée de la galerie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteItem(deleteTarget)}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
