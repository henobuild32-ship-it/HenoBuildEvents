import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

// DELETE /api/messages/[id] — Delete a message
export async function DELETE(
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

    // Only the event organizer or the message sender can delete
    if (
      existingMessage.event.organizerId !== session.userId &&
      existingMessage.senderId !== session.userId
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    await db.message.delete({ where: { id } });

    return NextResponse.json({ message: "Message supprimé avec succès" });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du message" },
      { status: 500 }
    );
  }
}
