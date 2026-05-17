import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

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

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check notification exists and belongs to the user
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification introuvable" },
        { status: 404 }
      );
    }

    if (notification.userId !== session.userId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à supprimer cette notification" },
        { status: 403 }
      );
    }

    await db.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la notification" },
      { status: 500 }
    );
  }
}
