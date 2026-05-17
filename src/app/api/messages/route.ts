import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

const createMessageSchema = z.object({
  eventId: z.string().min(1, "L'ID de l'événement est requis"),
  content: z.string().min(1, "Le contenu du message est requis"),
  subject: z.string().optional(),
  isAnnouncement: z.boolean().default(false),
  recipientId: z.string().optional().nullable(), // Guest ID – null means broadcast
});

// GET /api/messages?eventId=xxx — List messages for an event
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const session = validateToken(token);
    if (!session) {
      return NextResponse.json(
        { error: "Session expirée ou invalide" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId est requis" },
        { status: 400 }
      );
    }

    // Verify the user owns the event
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    if (event.organizerId !== session.userId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Optional filters
    const isAnnouncement = searchParams.get("isAnnouncement");
    const isRead = searchParams.get("isRead");

    const where: Record<string, unknown> = { eventId };

    if (isAnnouncement !== null && isAnnouncement !== undefined) {
      where.isAnnouncement = isAnnouncement === "true";
    }

    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === "true";
    }

    const messages = await db.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("List messages error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages — Send a new message
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const session = validateToken(token);
    if (!session) {
      return NextResponse.json(
        { error: "Session expirée ou invalide" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createMessageSchema.parse(body);

    // Verify the event exists and the user owns it
    const event = await db.event.findUnique({
      where: { id: validated.eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    if (event.organizerId !== session.userId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // If recipient is specified, verify the guest belongs to the event
    if (validated.recipientId) {
      const guest = await db.guest.findUnique({
        where: { id: validated.recipientId },
        select: { eventId: true },
      });

      if (!guest || guest.eventId !== validated.eventId) {
        return NextResponse.json(
          { error: "Destinataire non trouvé dans cet événement" },
          { status: 400 }
        );
      }
    }

    const message = await db.message.create({
      data: {
        eventId: validated.eventId,
        senderId: session.userId,
        content: validated.content,
        subject: validated.subject ?? null,
        isAnnouncement: validated.isAnnouncement,
        recipientId: validated.recipientId ?? null,
        status: "SENT",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            photo: true,
          },
        },
      },
    });

    // Create notifications for announcement messages
    if (validated.isAnnouncement) {
      const guests = await db.guest.findMany({
        where: { eventId: validated.eventId },
        select: { id: true },
      });

      if (guests.length > 0) {
        await db.notification.createMany({
          data: guests.map((guest) => ({
            userId: session.userId,
            eventId: validated.eventId,
            guestId: guest.id,
            type: "MESSAGE_RECEIVED",
            title: validated.subject ?? "Nouvelle annonce",
            message:
              validated.content.length > 100
                ? validated.content.substring(0, 100) + "..."
                : validated.content,
          })),
        });
      }
    } else if (validated.recipientId) {
      // Create notification for the specific recipient
      await db.notification.create({
        data: {
          userId: session.userId,
          eventId: validated.eventId,
          guestId: validated.recipientId,
          type: "MESSAGE_RECEIVED",
          title: validated.subject ?? "Nouveau message",
          message:
            validated.content.length > 100
              ? validated.content.substring(0, 100) + "..."
              : validated.content,
        },
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create message error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
