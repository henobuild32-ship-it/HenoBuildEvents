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

// GET /api/notifications/count?userId=xxx - Get unread count
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

    const unreadCount = await db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    const totalCount = await db.notification.count({
      where: { userId },
    });

    return NextResponse.json({
      unreadCount,
      totalCount,
    });
  } catch (error) {
    console.error("Get notification count error:", error);
    return NextResponse.json(
      { error: "Erreur lors du comptage des notifications" },
      { status: 500 }
    );
  }
}
