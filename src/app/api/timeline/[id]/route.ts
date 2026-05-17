import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

// ─── GET: Get a single timeline item ───────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await db.timelineItem.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: "Moment non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Get timeline item error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du moment" },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update a timeline item ─────────────────────────────────
const updateTimelineSchema = z.object({
  title: z.string().min(1).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().int().min(1).optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  color: z.string().optional(),
  status: z.enum(["A_VENIR", "EN_COURS", "TERMINE"]).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existing = await db.timelineItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Moment non trouvé" }, { status: 404 });
    }

    // Verify ownership via event
    const event = await db.event.findUnique({ where: { id: existing.eventId } });
    if (!event || event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateTimelineSchema.parse(body);

    const item = await db.timelineItem.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update timeline item error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du moment" },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete a timeline item ────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existing = await db.timelineItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Moment non trouvé" }, { status: 404 });
    }

    // Verify ownership via event
    const event = await db.event.findUnique({ where: { id: existing.eventId } });
    if (!event || event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    await db.timelineItem.delete({ where: { id } });

    return NextResponse.json({ message: "Moment supprimé avec succès" });
  } catch (error) {
    console.error("Delete timeline item error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du moment" },
      { status: 500 }
    );
  }
}
