import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum([
    "WEDDING", "ENGAGEMENT", "BIRTHDAY", "BAPTISM", "CONFERENCE",
    "CEREMONY", "PRIVATE_PARTY", "VIP", "GRADUATION", "RELIGIOUS",
    "FAMILY", "PROFESSIONAL", "GALA", "COCKTAIL", "MEETING", "CUSTOM",
  ]).optional(),
  theme: z.enum([
    "LUXURIOUS", "MODERN", "ROMANTIC", "AFRICAN", "VIP",
    "MINIMALIST", "RUSTIC", "BOHEMIAN", "VINTAGE", "TROPICAL",
    "ELEGANT", "FESTIVE", "CUSTOM",
  ]).optional(),
  date: z.string().transform((v) => new Date(v)).optional(),
  endDate: z.string().transform((v) => new Date(v)).nullable().optional(),
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  secondaryColor: z.string().nullable().optional(),
  accentColor: z.string().nullable().optional(),
  dressCode: z.string().nullable().optional(),
  hostName: z.string().nullable().optional(),
  hostTitle: z.string().nullable().optional(),
  isPrivate: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  maxGuests: z.number().int().positive().nullable().optional(),
  allowPlusOne: z.boolean().optional(),
  rsvpDeadline: z.string().transform((v) => new Date(v)).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await db.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            photo: true,
          },
        },
        _count: {
          select: {
            guests: true,
            tables: true,
            invitations: true,
            galleryItems: true,
          },
        },
        guests: {
          select: { status: true },
        },
        invitations: {
          select: { isSent: true, isUsed: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Calculate stats
    const guestStats = {
      total: event._count.guests,
      invited: event.guests.filter((g) => g.status === "INVITED").length,
      confirmed: event.guests.filter((g) => g.status === "CONFIRMED").length,
      declined: event.guests.filter((g) => g.status === "DECLINED").length,
      present: event.guests.filter((g) => g.status === "PRESENT").length,
    };

    const invitationStats = {
      total: event._count.invitations,
      sent: event.invitations.filter((i) => i.isSent).length,
      used: event.invitations.filter((i) => i.isUsed).length,
    };

    const { guests: _guests, invitations: _invitations, _count, ...eventData } = event;

    return NextResponse.json({
      event: {
        ...eventData,
        guestCount: _count.guests,
        tableCount: _count.tables,
        invitationCount: _count.invitations,
        galleryItemCount: _count.galleryItems,
        guestStats,
        invitationStats,
      },
    });
  } catch (error) {
    console.error("Get event error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'événement" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Verify ownership
    const existing = await db.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }
    if (existing.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateEventSchema.parse(body);

    const event = await db.event.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update event error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'événement" },
      { status: 500 }
    );
  }
}

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

    const existing = await db.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }
    if (existing.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    await db.event.delete({ where: { id } });

    return NextResponse.json({ message: "Événement supprimé avec succès" });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'événement" },
      { status: 500 }
    );
  }
}
