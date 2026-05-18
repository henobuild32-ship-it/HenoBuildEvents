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

const publicRsvpSchema = z.object({
  response: z.enum(["accept", "decline"]),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
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
      // Check if it's a public event link (by slug or ID)
      const event = await db.event.findFirst({
        where: {
          OR: [
            { slug: link },
            { id: link }
          ]
        },
        select: {
          id: true,
          title: true,
          allowPlusOne: true,
          maxGuests: true,
          organizerId: true,
        },
      });

      if (!event) {
        return NextResponse.json(
          { error: "Invitation non trouvée" },
          { status: 404 }
        );
      }

      const body = await request.json();
      const validated = publicRsvpSchema.parse(body);

      const newStatus = validated.response === "accept" ? "CONFIRMED" : "DECLINED";
      const uniqueToken = "inv-" + Math.random().toString(36).substring(2, 10);
      const qrCodeData = "qr-" + Math.random().toString(36).substring(2, 12);

      // Create new guest
      const guest = await db.guest.create({
        data: {
          eventId: event.id,
          firstName: validated.firstName,
          lastName: validated.lastName,
          email: validated.email || null,
          phone: validated.phone || null,
          status: newStatus,
          plusOne: validated.plusOne ?? false,
          plusOneName: validated.plusOne ? validated.plusOneName : null,
          dietaryReq: validated.dietaryReq || null,
          notes: validated.message || null,
          qrCode: qrCodeData,
          confirmedAt: newStatus === "CONFIRMED" ? new Date() : null,
        },
      });

      // Create new invitation
      const newInvitation = await db.invitation.create({
        data: {
          eventId: event.id,
          guestId: guest.id,
          uniqueLink: uniqueToken,
          qrCodeData: qrCodeData,
          isUsed: true,
          usedAt: new Date(),
          isSent: true,
          sentAt: new Date(),
        },
      });

      // Create notification for organizer
      await db.notification.create({
        data: {
          userId: event.organizerId,
          eventId: event.id,
          guestId: guest.id,
          type: validated.response === "accept" ? "RSVP_CONFIRMED" : "RSVP_DECLINED",
          title: validated.response === "accept" ? "RSVP Public Confirmé" : "RSVP Public Décliné",
          message: `${guest.firstName} ${guest.lastName} s'est inscrit(e) et a ${validated.response === "accept" ? "confirmé" : "décliné"} sa présence pour "${event.title}"`,
        },
      });

      const returnedInvitation = {
        id: newInvitation.id,
        uniqueLink: newInvitation.uniqueLink,
        qrCodeData: newInvitation.qrCodeData,
        isUsed: true,
        usedAt: newInvitation.usedAt,
        message: validated.message || null,
        expiresAt: null,
        event: {
          id: event.id,
          title: event.title,
          allowPlusOne: event.allowPlusOne,
        },
        guest: {
          id: guest.id,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          status: guest.status,
          plusOne: guest.plusOne,
          plusOneName: guest.plusOneName,
          dietaryReq: guest.dietaryReq,
        },
      };

      return NextResponse.json({
        message: validated.response === "accept"
          ? "Votre présence a été confirmée avec succès"
          : "Votre réponse a été enregistrée",
        status: newStatus,
        invitation: returnedInvitation,
      }, { status: 201 });
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
