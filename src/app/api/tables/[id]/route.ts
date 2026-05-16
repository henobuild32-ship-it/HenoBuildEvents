import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

const updateTableSchema = z.object({
  name: z.string().min(1).optional(),
  number: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  isVip: z.boolean().optional(),
  positionX: z.number().nullable().optional(),
  positionY: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existingTable = await db.table.findUnique({
      where: { id },
      include: { event: { select: { organizerId: true } } },
    });

    if (!existingTable) {
      return NextResponse.json({ error: "Table non trouvée" }, { status: 404 });
    }

    if (existingTable.event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateTableSchema.parse(body);

    // Validate capacity against current occupancy
    if (validated.capacity && validated.capacity < existingTable.currentOccupancy) {
      return NextResponse.json(
        {
          error: `La capacité ne peut pas être inférieure au nombre d'invités déjà assignés (${existingTable.currentOccupancy})`,
        },
        { status: 400 }
      );
    }

    // Check unique constraint on table number if changing
    if (validated.number && validated.number !== existingTable.number) {
      const duplicate = await db.table.findUnique({
        where: {
          eventId_number: {
            eventId: existingTable.eventId,
            number: validated.number,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Une table avec ce numéro existe déjà pour cet événement" },
          { status: 409 }
        );
      }
    }

    const table = await db.table.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ table });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update table error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la table" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existingTable = await db.table.findUnique({
      where: { id },
      include: { event: { select: { organizerId: true } } },
    });

    if (!existingTable) {
      return NextResponse.json({ error: "Table non trouvée" }, { status: 404 });
    }

    if (existingTable.event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Unassign all guests from this table before deleting
    await db.guest.updateMany({
      where: { tableId: id },
      data: { tableId: null, tableNumber: null, seatNumber: null },
    });

    await db.table.delete({ where: { id } });

    return NextResponse.json({ message: "Table supprimée avec succès" });
  } catch (error) {
    console.error("Delete table error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la table" },
      { status: 500 }
    );
  }
}
