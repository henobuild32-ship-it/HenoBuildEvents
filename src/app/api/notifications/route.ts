import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

// Validation schema for creating a notification
const createNotificationSchema = z.object({
  userId: z.string().min(1, "L'ID utilisateur est requis"),
  type: z.enum([
    "INVITATION_SENT",
    "RSVP_CONFIRMED",
    "RSVP_DECLINED",
    "EVENT_REMINDER",
    "EVENT_UPDATED",
    "EVENT_CANCELLED",
    "GUEST_ARRIVED",
    "TABLE_ASSIGNED",
    "MESSAGE_RECEIVED",
    "GENERAL",
  ]).default("GENERAL"),
  title: z.string().min(1, "Le titre est requis"),
  message: z.string().min(1, "Le message est requis"),
  eventId: z.string().optional(),
  guestId: z.string().optional(),
  link: z.string().optional(),
});

// Helper to verify auth token
function getAuthSession(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  const session = validateToken(token);
  if (!session) {
    return null;
  }

  return session;
}

// GET /api/notifications?userId=xxx - List notifications for a user
export async function GET(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId est requis" },
        { status: 400 }
      );
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("List notifications error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createNotificationSchema.parse(body);

    // Verify the user exists
    const user = await db.user.findUnique({
      where: { id: validated.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Verify event exists if provided
    if (validated.eventId) {
      const event = await db.event.findUnique({
        where: { id: validated.eventId },
      });
      if (!event) {
        return NextResponse.json(
          { error: "Événement introuvable" },
          { status: 404 }
        );
      }
    }

    // Verify guest exists if provided
    if (validated.guestId) {
      const guest = await db.guest.findUnique({
        where: { id: validated.guestId },
      });
      if (!guest) {
        return NextResponse.json(
          { error: "Invité introuvable" },
          { status: 404 }
        );
      }
    }

    const notification = await db.notification.create({
      data: {
        userId: validated.userId,
        type: validated.type,
        title: validated.title,
        message: validated.message,
        eventId: validated.eventId || null,
        guestId: validated.guestId || null,
        link: validated.link || null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create notification error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification" },
      { status: 500 }
    );
  }
}
