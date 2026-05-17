import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

// PUT /api/messages/[id]/read — Mark a message as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existingMessage = await db.message.findUnique({
      where: { id },
      include: { event: { select: { organizerId: true } } },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 }
      );
    }

    // Only the event organizer can mark messages as read
    if (existingMessage.event.organizerId !== session.userId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    if (existingMessage.isRead) {
      return NextResponse.json({ message: existingMessage });
    }

    const message = await db.message.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
        status: "READ",
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

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Mark message as read error:", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage du message comme lu" },
      { status: 500 }
    );
  }
}
