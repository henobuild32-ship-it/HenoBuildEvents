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

// PUT /api/notifications/read-all?userId=xxx - Mark all notifications as read for a user
export async function PUT(request: NextRequest) {
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

    // Ensure the user can only mark their own notifications
    if (userId !== session.userId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier ces notifications" },
        { status: 403 }
      );
    }

    const result = await db.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} notification(s) marquée(s) comme lue(s)`,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications" },
      { status: 500 }
    );
  }
}
