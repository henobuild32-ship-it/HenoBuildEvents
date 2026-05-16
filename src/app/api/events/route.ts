import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

const createEventSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  type: z.enum([
    "WEDDING", "ENGAGEMENT", "BIRTHDAY", "BAPTISM", "CONFERENCE",
    "CEREMONY", "PRIVATE_PARTY", "VIP", "GRADUATION", "RELIGIOUS",
    "FAMILY", "PROFESSIONAL", "GALA", "COCKTAIL", "MEETING", "CUSTOM",
  ]).default("CUSTOM"),
  theme: z.enum([
    "LUXURIOUS", "MODERN", "ROMANTIC", "AFRICAN", "VIP",
    "MINIMALIST", "RUSTIC", "BOHEMIAN", "VINTAGE", "TROPICAL",
    "ELEGANT", "FESTIVE", "CUSTOM",
  ]).default("MODERN"),
  date: z.string().transform((v) => new Date(v)),
  endDate: z.string().transform((v) => new Date(v)).optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  venue: z.string().optional(),
  coverImage: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  dressCode: z.string().optional(),
  hostName: z.string().optional(),
  hostTitle: z.string().optional(),
  isPrivate: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  maxGuests: z.number().int().positive().optional(),
  allowPlusOne: z.boolean().default(false),
  rsvpDeadline: z.string().transform((v) => new Date(v)).optional(),
  notes: z.string().optional(),
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    + "-" + Math.random().toString(36).substring(2, 8);
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await db.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

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
    const validated = createEventSchema.parse(body);

    const baseSlug = generateSlug(validated.title);
    const slug = await ensureUniqueSlug(baseSlug);

    const event = await db.event.create({
      data: {
        ...validated,
        slug,
        organizerId: session.userId,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'événement" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get("organizerId");

    if (!organizerId) {
      return NextResponse.json(
        { error: "organizerId est requis" },
        { status: 400 }
      );
    }

    const events = await db.event.findMany({
      where: { organizerId },
      include: {
        _count: {
          select: {
            guests: true,
            tables: true,
            invitations: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    const enrichedEvents = events.map((event) => ({
      ...event,
      guestCount: event._count.guests,
      tableCount: event._count.tables,
      invitationCount: event._count.invitations,
    }));

    return NextResponse.json({ events: enrichedEvents });
  } catch (error) {
    console.error("List events error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des événements" },
      { status: 500 }
    );
  }
}
