import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

const createTableSchema = z.object({
  eventId: z.string().min(1, "L'ID de l'événement est requis"),
  name: z.string().min(1, "Le nom de la table est requis"),
  number: z.number().int().positive("Le numéro de table doit être positif"),
  capacity: z.number().int().positive("La capacité doit être positive").default(8),
  isVip: z.boolean().default(false),
  positionX: z.number().optional().nullable(),
  positionY: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const bulkCreateTableSchema = z.object({
  eventId: z.string().min(1, "L'ID de l'événement est requis"),
  count: z.number().int().positive("Le nombre de tables doit être positif"),
  capacity: z.number().int().positive("La capacité doit être positive").default(8),
  prefix: z.string().default("Table "),
  isVip: z.boolean().default(false),
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

    // Check if bulk creation is requested
    if (body && body.isBulk === true) {
      const validated = bulkCreateTableSchema.parse(body);

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

      // Find highest existing table number for this event
      const highestTable = await db.table.findFirst({
        where: { eventId: validated.eventId },
        orderBy: { number: "desc" },
      });
      const startNumber = highestTable ? highestTable.number + 1 : 1;

      const tablesToCreate = [];
      for (let i = 0; i < validated.count; i++) {
        const num = startNumber + i;
        tablesToCreate.push({
          eventId: validated.eventId,
          name: `${validated.prefix}${num}`,
          number: num,
          capacity: validated.capacity,
          isVip: validated.isVip,
        });
      }

      // Create in bulk using createMany
      await db.table.createMany({
        data: tablesToCreate,
      });

      return NextResponse.json({ success: true, count: validated.count }, { status: 201 });
    }

    const validated = createTableSchema.parse(body);

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

    // Check if table number already exists for this event
    const existingTable = await db.table.findUnique({
      where: {
        eventId_number: {
          eventId: validated.eventId,
          number: validated.number,
        },
      },
    });

    if (existingTable) {
      return NextResponse.json(
        { error: "Une table avec ce numéro existe déjà pour cet événement" },
        { status: 409 }
      );
    }

    const table = await db.table.create({
      data: {
        ...validated,
        positionX: validated.positionX ?? undefined,
        positionY: validated.positionY ?? undefined,
      },
    });

    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create table error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la table" },
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

    const tables = await db.table.findMany({
      where: { eventId },
      include: {
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            seatNumber: true,
          },
          orderBy: { seatNumber: "asc" },
        },
        _count: {
          select: { guests: true },
        },
      },
      orderBy: { number: "asc" },
    });

    const enrichedTables = tables.map((table) => ({
      ...table,
      availableSeats: table.capacity - table._count.guests,
    }));

    return NextResponse.json({ tables: enrichedTables });
  } catch (error) {
    console.error("List tables error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tables" },
      { status: 500 }
    );
  }
}
