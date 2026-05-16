import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

const createGuestSchema = z.object({
  eventId: z.string().min(1, "L'ID de l'événement est requis"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  status: z.enum(["INVITED", "CONFIRMED", "DECLINED", "PRESENT"]).default("INVITED"),
  tableId: z.string().optional().nullable(),
  tableNumber: z.number().int().optional().nullable(),
  seatNumber: z.number().int().optional().nullable(),
  plusOne: z.boolean().default(false),
  plusOneName: z.string().optional().nullable(),
  dietaryReq: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
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
    const validated = createGuestSchema.parse(body);

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

    // Auto-assign QR code
    const qrCode = uuidv4();

    const guest = await db.guest.create({
      data: {
        ...validated,
        qrCode,
        invitedAt: new Date(),
        tableId: validated.tableId ?? undefined,
        tableNumber: validated.tableNumber ?? undefined,
        seatNumber: validated.seatNumber ?? undefined,
      },
    });

    // If table assigned, update occupancy
    if (validated.tableId) {
      await db.table.update({
        where: { id: validated.tableId },
        data: { currentOccupancy: { increment: 1 } },
      });
    }

    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create guest error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout de l'invité" },
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

    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { eventId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const guests = await db.guest.findMany({
      where,
      include: {
        table: {
          select: { id: true, name: true, number: true },
        },
        invitation: {
          select: { id: true, uniqueLink: true, isSent: true, isUsed: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({ guests });
  } catch (error) {
    console.error("List guests error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des invités" },
      { status: 500 }
    );
  }
}
