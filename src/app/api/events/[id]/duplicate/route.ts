import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

// ─── POST: Duplicate an event with its tables and timeline ─────────
export async function POST(
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

    // Find the original event
    const original = await db.event.findUnique({
      where: { id },
      include: {
        tables: true,
        timelineItems: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    if (original.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Create the duplicated event
    const duplicated = await db.event.create({
      data: {
        title: `${original.title} (copie)`,
        description: original.description,
        type: original.type,
        theme: original.theme,
        date: original.date,
        endDate: original.endDate,
        location: original.location,
        address: original.address,
        city: original.city,
        country: original.country,
        venue: original.venue,
        coverImage: original.coverImage,
        primaryColor: original.primaryColor,
        secondaryColor: original.secondaryColor,
        accentColor: original.accentColor,
        dressCode: original.dressCode,
        hostName: original.hostName,
        hostTitle: original.hostTitle,
        isPrivate: original.isPrivate,
        isPublished: false, // Draft by default
        maxGuests: original.maxGuests,
        allowPlusOne: original.allowPlusOne,
        notes: original.notes,
        organizerId: session.userId,
        tables: {
          create: original.tables.map((table) => ({
            name: table.name,
            number: table.number,
            capacity: table.capacity,
            isVip: table.isVip,
            positionX: table.positionX,
            positionY: table.positionY,
            notes: table.notes,
          })),
        },
        timelineItems: {
          create: original.timelineItems.map((item) => ({
            title: item.title,
            startTime: item.startTime,
            duration: item.duration,
            description: item.description,
            location: item.location,
            color: item.color,
            status: "A_VENIR",
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        tables: true,
        timelineItems: true,
      },
    });

    return NextResponse.json({ event: duplicated }, { status: 201 });
  } catch (error) {
    console.error("Duplicate event error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la duplication de l'événement" },
      { status: 500 }
    );
  }
}
