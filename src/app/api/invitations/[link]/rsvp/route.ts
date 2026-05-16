import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const rsvpSchema = z.object({
  response: z.enum(["accept", "decline"]),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().optional().nullable(),
  dietaryReq: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ link: string }> }
) {
  try {
    const { link } = await params;

    const invitation = await db.invitation.findUnique({
      where: { uniqueLink: link },
      include: {
        guest: true,
        event: {
          select: {
            id: true,
            title: true,
            allowPlusOne: true,
            maxGuests: true,
            organizerId: true,
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
        { error: "Cette invitation a expiré" },
        { status: 410 }
      );
    }

    // Check if already used
    if (invitation.isUsed) {
      return NextResponse.json(
        { error: "Cette invitation a déjà été utilisée" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = rsvpSchema.parse(body);

    // Update guest status
    const newStatus = validated.response === "accept" ? "CONFIRMED" : "DECLINED";

    const guestUpdateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (newStatus === "CONFIRMED") {
      guestUpdateData.confirmedAt = new Date();
    }

    // Handle plus one
    if (validated.plusOne !== undefined && invitation.event.allowPlusOne) {
      guestUpdateData.plusOne = validated.plusOne;
    }
    if (validated.plusOneName !== undefined) {
      guestUpdateData.plusOneName = validated.plusOneName;
    }
    if (validated.dietaryReq !== undefined) {
      guestUpdateData.dietaryReq = validated.dietaryReq;
    }

    // Update guest
    await db.guest.update({
      where: { id: invitation.guestId },
      data: guestUpdateData,
    });

    // Mark invitation as used
    await db.invitation.update({
      where: { id: invitation.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    // Create notification for organizer
    await db.notification.create({
      data: {
        userId: invitation.event.organizerId,
        eventId: invitation.event.id,
        guestId: invitation.guestId,
        type: validated.response === "accept" ? "RSVP_CONFIRMED" : "RSVP_DECLINED",
        title: validated.response === "accept" ? "RSVP Confirmé" : "RSVP Décliné",
        message: `${invitation.guest.firstName} ${invitation.guest.lastName} a ${validated.response === "accept" ? "confirmé" : "décliné"} son invitation pour "${invitation.event.title}"`,
      },
    });

    return NextResponse.json({
      message:
        validated.response === "accept"
          ? "Votre présence a été confirmée avec succès"
          : "Votre réponse a été enregistrée",
      status: newStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de votre réponse" },
      { status: 500 }
    );
  }
}
