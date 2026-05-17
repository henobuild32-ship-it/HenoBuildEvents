import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

const createGalleryItemSchema = z.object({
  eventId: z.string().min(1, "L'ID de l'événement est requis"),
  type: z.enum(["PHOTO", "VIDEO"]).default("PHOTO"),
  url: z.string().min(1, "L'URL est requise"),
  thumbnailUrl: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().positive().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  isFeatured: z.boolean().default(false),
  albumId: z.string().optional().nullable(),
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
    const validated = createGalleryItemSchema.parse(body);

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

    // If albumId provided, verify it belongs to the event
    if (validated.albumId) {
      const album = await db.galleryAlbum.findUnique({
        where: { id: validated.albumId },
      });
      if (!album || album.eventId !== validated.eventId) {
        return NextResponse.json({ error: "Album non trouvé" }, { status: 404 });
      }
    }

    // If marking as featured, unfeature other items of same type in the event
    if (validated.isFeatured) {
      await db.galleryItem.updateMany({
        where: { eventId: validated.eventId, isFeatured: true },
        data: { isFeatured: false },
      });
    }

    const galleryItem = await db.galleryItem.create({
      data: validated,
    });

    return NextResponse.json({ galleryItem }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create gallery item error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout de l'élément à la galerie" },
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

    const type = searchParams.get("type");
    const albumId = searchParams.get("albumId");
    const albums = searchParams.get("albums");
    const isFeatured = searchParams.get("isFeatured");

    // If requesting albums list
    if (albums === "true") {
      const galleryAlbums = await db.galleryAlbum.findMany({
        where: { eventId },
        include: {
          _count: { select: { items: true } },
          uploadedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ albums: galleryAlbums });
    }

    const where: Record<string, unknown> = { eventId };
    if (type) where.type = type;
    if (albumId) where.albumId = albumId;
    if (isFeatured === "true") where.isFeatured = true;

    const galleryItems = await db.galleryItem.findMany({
      where,
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        album: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ galleryItems });
  } catch (error) {
    console.error("List gallery items error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la galerie" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de l'élément requis" }, { status: 400 });
    }

    // Find the gallery item
    const item = await db.galleryItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Élément non trouvé" }, { status: 404 });
    }

    // Verify ownership via event
    const event = await db.event.findUnique({ where: { id: item.eventId } });
    if (!event || event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    await db.galleryItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete gallery item error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'élément" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { id, isFeatured, caption, albumId } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de l'élément requis" }, { status: 400 });
    }

    const item = await db.galleryItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Élément non trouvé" }, { status: 404 });
    }

    // Verify ownership via event
    const event = await db.event.findUnique({ where: { id: item.eventId } });
    if (!event || event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // If featuring, unfeature others first
    if (isFeatured === true) {
      await db.galleryItem.updateMany({
        where: { eventId: item.eventId, isFeatured: true },
        data: { isFeatured: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isFeatured === "boolean") updateData.isFeatured = isFeatured;
    if (caption !== undefined) updateData.caption = caption;
    if (albumId !== undefined) updateData.albumId = albumId;

    const updated = await db.galleryItem.update({
      where: { id },
      data: updateData,
      include: { album: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ galleryItem: updated });
  } catch (error) {
    console.error("Update gallery item error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'élément" },
      { status: 500 }
    );
  }
}
