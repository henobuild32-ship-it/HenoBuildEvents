import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

// ─── GET: List timeline items for an event ─────────────────────────
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const session = validateToken(token);
    if (!session) {
      return NextResponse.json({ error: "Session expirée ou invalide" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "eventId est requis" }, { status: 400 });
    }

    // Verify ownership
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }
    if (event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const items = await db.timelineItem.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Get timeline error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du programme" },
      { status: 500 }
    );
  }
}

// ─── POST: Create a new timeline item ──────────────────────────────
const createTimelineSchema = z.object({
  eventId: z.string().min(1),
  title: z.string().min(1, "Le titre est requis"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm requis"),
  duration: z.number().int().min(1).default(60),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  color: z.string().default("#d4a853"),
  status: z.enum(["A_VENIR", "EN_COURS", "TERMINE"]).default("A_VENIR"),
  sortOrder: z.number().int().default(0),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const session = validateToken(token);
    if (!session) {
      return NextResponse.json({ error: "Session expirée ou invalide" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTimelineSchema.parse(body);

    // Verify ownership
    const event = await db.event.findUnique({ where: { id: validated.eventId } });
    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }
    if (event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Auto-assign sortOrder if not provided
    if (!body.sortOrder) {
      const maxOrder = await db.timelineItem.aggregate({
        where: { eventId: validated.eventId },
        _max: { sortOrder: true },
      });
      validated.sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    }

    const item = await db.timelineItem.create({
      data: validated,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create timeline item error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du moment" },
      { status: 500 }
    );
  }
}
