"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Camera, Upload, Image as ImageIcon, Film, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"

interface GalleryItem {
  id: string
  type: "PHOTO" | "VIDEO"
  url: string
  caption?: string
  isFeatured: boolean
  createdAt: string
}

export function GallerySection() {
  const { auth, currentEventId, events } = useStore()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const currentEvent = events.find((e) => e.id === currentEventId)

  useEffect(() => {
    if (currentEventId) fetchGallery()
  }, [currentEventId])

  const fetchGallery = async () => {
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
    } finally {
      setIsLoading(false)
    }
  }

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
        <Button className="btn-gold rounded-full" disabled={!currentEventId}>
          <Upload className="h-4 w-4 mr-2" />
          Téléverser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <ImageIcon className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold font-heading">{photoCount}</p>
            <p className="text-xs text-muted-foreground">Photos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Film className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold font-heading">{videoCount}</p>
            <p className="text-xs text-muted-foreground">Vidéos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold font-heading">{featuredCount}</p>
            <p className="text-xs text-muted-foreground">En vedette</p>
          </CardContent>
        </Card>
      </div>

      {/* Gallery grid */}
      {!currentEventId ? (
        <div className="text-center py-16">
          <Camera className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Sélectionnez un événement pour voir la galerie</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Camera className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">Galerie vide</h3>
          <p className="text-muted-foreground mb-6">Téléversez des photos et vidéos de votre événement</p>
          <Button className="btn-gold rounded-full">
            <Upload className="h-4 w-4 mr-2" />
            Téléverser
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-square rounded-xl overflow-hidden border border-border/50 hover:border-gold/20 transition-all cursor-pointer"
            >
              <div className="w-full h-full bg-gradient-to-br from-gold/5 to-muted/30 flex items-center justify-center">
                {item.type === "PHOTO" ? (
                  <ImageIcon className="h-8 w-8 text-gold/30" />
                ) : (
                  <Film className="h-8 w-8 text-gold/30" />
                )}
              </div>
              {item.isFeatured && (
                <Badge className="absolute top-2 right-2 gradient-gold text-black text-[10px] border-0">
                  <Star className="h-3 w-3 mr-1" /> Vedette
                </Badge>
              )}
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-xs text-white truncate">{item.caption}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
