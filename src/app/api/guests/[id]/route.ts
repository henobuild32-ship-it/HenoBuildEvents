import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

const updateGuestSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
  status: z.enum(["INVITED", "CONFIRMED", "DECLINED", "PRESENT"]).optional(),
  tableId: z.string().nullable().optional(),
  tableNumber: z.number().int().nullable().optional(),
  seatNumber: z.number().int().nullable().optional(),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().nullable().optional(),
  dietaryReq: z.string().nullable().optional(),
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

    const existingGuest = await db.guest.findUnique({
      where: { id },
      include: { event: { select: { organizerId: true } } },
    });

    if (!existingGuest) {
      return NextResponse.json({ error: "Invité non trouvé" }, { status: 404 });
    }

    if (existingGuest.event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateGuestSchema.parse(body);

    // Handle table reassignment
    const oldTableId = existingGuest.tableId;
    const newTableId = validated.tableId !== undefined ? validated.tableId : oldTableId;

    // Update confirmed/present timestamps
    const statusUpdate: Record<string, unknown> = {};
    if (validated.status === "CONFIRMED" && existingGuest.status !== "CONFIRMED") {
      statusUpdate.confirmedAt = new Date();
    }
    if (validated.status === "PRESENT" && existingGuest.status !== "PRESENT") {
      statusUpdate.checkedInAt = new Date();
    }

    const guest = await db.guest.update({
      where: { id },
      data: {
        ...validated,
        ...statusUpdate,
      },
    });

    // Update table occupancy if table changed
    if (oldTableId !== newTableId) {
      // Decrement old table
      if (oldTableId) {
        await db.table.update({
          where: { id: oldTableId },
          data: { currentOccupancy: { decrement: 1 } },
        });
      }
      // Increment new table
      if (newTableId) {
        await db.table.update({
          where: { id: newTableId },
          data: { currentOccupancy: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({ guest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update guest error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'invité" },
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

    const existingGuest = await db.guest.findUnique({
      where: { id },
      include: { event: { select: { organizerId: true } } },
    });

    if (!existingGuest) {
      return NextResponse.json({ error: "Invité non trouvé" }, { status: 404 });
    }

    if (existingGuest.event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Update table occupancy if guest was assigned to a table
    if (existingGuest.tableId) {
      await db.table.update({
        where: { id: existingGuest.tableId },
        data: { currentOccupancy: { decrement: 1 } },
      });
    }

    await db.guest.delete({ where: { id } });

    return NextResponse.json({ message: "Invité supprimé avec succès" });
  } catch (error) {
    console.error("Delete guest error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'invité" },
      { status: 500 }
    );
  }
}
