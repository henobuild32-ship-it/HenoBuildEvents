import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

const createInvitationSchema = z.object({
  eventId: z.string().min(1, "L'ID de l'événement est requis"),
  guestId: z.string().min(1, "L'ID de l'invité est requis"),
  message: z.string().optional().nullable(),
  expiresAt: z.string().transform((v) => new Date(v)).optional().nullable(),
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
    const validated = createInvitationSchema.parse(body);

    // Verify event exists and user owns it
    const event = await db.event.findUnique({
      where: { id: validated.eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    if (event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Verify guest exists and belongs to this event
    const guest = await db.guest.findUnique({
      where: { id: validated.guestId },
    });

    if (!guest || guest.eventId !== validated.eventId) {
      return NextResponse.json(
        { error: "Invité non trouvé ou n'appartient pas à cet événement" },
        { status: 404 }
      );
    }

    // Check if invitation already exists for this guest
    const existingInvitation = await db.invitation.findUnique({
      where: { guestId: validated.guestId },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Une invitation existe déjà pour cet invité" },
        { status: 409 }
      );
    }

    // Generate unique link and QR code data
    const uniqueLink = uuidv4();
    const qrCodeData = JSON.stringify({
      eventId: validated.eventId,
      guestId: validated.guestId,
      code: guest.qrCode,
      link: uniqueLink,
    });

    const invitation = await db.invitation.create({
      data: {
        eventId: validated.eventId,
        guestId: validated.guestId,
        uniqueLink,
        qrCodeData,
        message: validated.message,
        expiresAt: validated.expiresAt,
      },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            qrCode: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            hostName: true,
          },
        },
      },
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create invitation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'invitation" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId est requis" },
        { status: 400 }
      );
    }

    const invitations = await db.invitation.findMany({
      where: { eventId },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("List invitations error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des invitations" },
      { status: 500 }
    );
  }
}
