import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ link: string }> }
) {
  try {
    const { link } = await params;

    const invitation = await db.invitation.findUnique({
      where: { uniqueLink: link },
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            plusOne: true,
            plusOneName: true,
            dietaryReq: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            endDate: true,
            location: true,
            address: true,
            city: true,
            country: true,
            venue: true,
            coverImage: true,
            primaryColor: true,
            secondaryColor: true,
            accentColor: true,
            dressCode: true,
            hostName: true,
            hostTitle: true,
            type: true,
            theme: true,
            allowPlusOne: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation non trouvée" },
        { status: 404 }
      );
    }

    // Check if expired
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: "Cette invitation a expiré", expired: true },
        { status: 410 }
      );
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Get invitation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'invitation" },
      { status: 500 }
    );
  }
}
