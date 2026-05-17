import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

// ─── Validation schemas ──────────────────────────────────────────

const createExpenseSchema = z.object({
  eventId: z.string().min(1, "L'ID de l'événement est requis"),
  name: z.string().min(1, "Le nom de la dépense est requis"),
  category: z.enum([
    "TRAITER",
    "DECORATION",
    "LIEU",
    "PHOTOGRAPHIE",
    "MUSIQUE",
    "FLEURISTE",
    "TENUES",
    "TRANSPORT",
    "AUTRES",
  ], { required_error: "La catégorie est requise" }),
  amount: z.number().positive("Le montant doit être supérieur à 0"),
  vendor: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  status: z.enum(["PAID", "PENDING"]).default("PENDING"),
  notes: z.string().optional().nullable(),
});

const updateExpenseSchema = z.object({
  expenseId: z.string().min(1, "L'ID de la dépense est requis"),
  name: z.string().min(1).optional(),
  category: z.enum([
    "TRAITER",
    "DECORATION",
    "LIEU",
    "PHOTOGRAPHIE",
    "MUSIQUE",
    "FLEURISTE",
    "TENUES",
    "TRANSPORT",
    "AUTRES",
  ]).optional(),
  amount: z.number().positive().optional(),
  vendor: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  status: z.enum(["PAID", "PENDING"]).optional(),
  notes: z.string().optional().nullable(),
});

// ─── Helper: verify auth ─────────────────────────────────────────

function getAuthSession(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  const session = validateToken(token);
  if (!session) return null;
  return session;
}

// ─── Category label mapping ──────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  TRAITER: "Traiteur",
  DECORATION: "Décoration",
  LIEU: "Lieu",
  PHOTOGRAPHIE: "Photographie",
  MUSIQUE: "Musique",
  FLEURISTE: "Fleuriste",
  TENUES: "Tenues",
  TRANSPORT: "Transport",
  AUTRES: "Autres",
};

// ─── GET /api/budget?eventId=xxx ─────────────────────────────────
// List expenses for an event + summary

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
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId est requis" },
        { status: 400 }
      );
    }

    // Verify event ownership
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    if (event.organizerId !== session.userId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Fetch expenses
    const expenses = await db.expense.findMany({
      where: { eventId },
      orderBy: { date: "desc" },
    });

    // Compute summary
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPaid = expenses
      .filter((e) => e.status === "PAID")
      .reduce((sum, e) => sum + e.amount, 0);
    const totalPending = expenses
      .filter((e) => e.status === "PENDING")
      .reduce((sum, e) => sum + e.amount, 0);

    // By category
    const byCategory: Record<string, { amount: number; count: number; label: string }> = {};
    for (const expense of expenses) {
      const cat = expense.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { amount: 0, count: 0, label: CATEGORY_LABELS[cat] || cat };
      }
      byCategory[cat].amount += expense.amount;
      byCategory[cat].count += 1;
    }

    return NextResponse.json({
      expenses,
      summary: {
        totalBudget: 30000,
        totalSpent,
        totalPaid,
        totalPending,
        remaining: 30000 - totalSpent,
        expenseCount: expenses.length,
        paidCount: expenses.filter((e) => e.status === "PAID").length,
        pendingCount: expenses.filter((e) => e.status === "PENDING").length,
        byCategory,
      },
    });
  } catch (error) {
    console.error("List budget error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du budget" },
      { status: 500 }
    );
  }
}

// ─── POST /api/budget ────────────────────────────────────────────
// Create an expense

export async function POST(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createExpenseSchema.parse(body);

    // Verify event ownership
    const event = await db.event.findUnique({
      where: { id: validated.eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    if (event.organizerId !== session.userId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const expense = await db.expense.create({
      data: {
        eventId: validated.eventId,
        name: validated.name,
        category: validated.category,
        amount: validated.amount,
        vendor: validated.vendor ?? null,
        date: validated.date ? new Date(validated.date) : null,
        status: validated.status,
        notes: validated.notes ?? null,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la dépense" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/budget?eventId=xxx ───────────────────────────────
// Update an expense (partial update)

export async function PATCH(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateExpenseSchema.parse(body);

    // Verify the expense exists and user owns the event
    const existing = await db.expense.findUnique({
      where: { id: validated.expenseId },
      include: { event: { select: { organizerId: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dépense non trouvée" },
        { status: 404 }
      );
    }

    if (existing.event.organizerId !== session.userId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.amount !== undefined) updateData.amount = validated.amount;
    if (validated.vendor !== undefined) updateData.vendor = validated.vendor;
    if (validated.date !== undefined) updateData.date = validated.date ? new Date(validated.date) : null;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.notes !== undefined) updateData.notes = validated.notes;

    const expense = await db.expense.update({
      where: { id: validated.expenseId },
      data: updateData,
    });

    return NextResponse.json({ expense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update expense error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la dépense" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/budget?expenseId=xxx ────────────────────────────
// Delete an expense

export async function DELETE(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      return NextResponse.json(
        { error: "expenseId est requis" },
        { status: 400 }
      );
    }

    // Verify the expense exists and user owns the event
    const existing = await db.expense.findUnique({
      where: { id: expenseId },
      include: { event: { select: { organizerId: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dépense non trouvée" },
        { status: 404 }
      );
    }

    if (existing.event.organizerId !== session.userId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    await db.expense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la dépense" },
      { status: 500 }
    );
  }
}
