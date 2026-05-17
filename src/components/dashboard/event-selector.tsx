"use client"

import { CalendarDays, Sparkles } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

export function EventSelector() {
  const { events, currentEventId, setCurrentEventId, setCurrentEvent, setActiveSection } = useStore()

  const handleSelect = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    if (event) {
      setCurrentEventId(event.id)
      setCurrentEvent(event)
    }
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Aucun événement</span>
        <Button
          size="sm"
          onClick={() => setActiveSection("creer-evenement")}
          className="btn-gold rounded-full text-xs h-7 px-3"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Créer
        </Button>
      </div>
    )
  }

  const currentEvent = events.find((e) => e.id === currentEventId)

  return (
    <div className="flex items-center gap-2">
      <Select value={currentEventId || ""} onValueChange={handleSelect}>
        <SelectTrigger className="w-[200px] sm:w-[260px] bg-background/50 border-gold/20 focus:border-gold/50 h-9 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
            <SelectValue placeholder="Sélectionner un événement" />
          </div>
        </SelectTrigger>
        <SelectContent className="border-gold/20">
          {events.map((event) => (
            <SelectItem key={event.id} value={event.id} className="text-sm">
              <div className="flex items-center gap-2">
                <span className="truncate">{event.title}</span>
                {event.id === currentEventId && (
                  <Badge className="gradient-gold text-black text-[9px] border-0 px-1.5 py-0 h-4">
                    Actif
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentEvent && (
        <Badge
          variant="outline"
          className="hidden sm:flex border-gold/30 text-gold bg-gold/10 text-[10px] shrink-0"
        >
          {new Date(currentEvent.date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </Badge>
      )}
    </div>
  )
}
