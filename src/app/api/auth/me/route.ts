import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  photo: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Token d'authentification requis" },
        { status: 401 }
      );
    }

    const session = validateToken(token);
    if (!session) {
      return NextResponse.json(
        { error: "Session expirée ou invalide" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        photo: true,
        role: true,
        bio: true,
        company: true,
        address: true,
        city: true,
        country: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des informations utilisateur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Token d'authentification requis" },
        { status: 401 }
      );
    }

    const session = validateToken(token);
    if (!session) {
      return NextResponse.json(
        { error: "Session expirée ou invalide" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    // If email is being updated, check uniqueness
    if (validated.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: validated.email,
          id: { not: session.userId },
        },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const user = await db.user.update({
      where: { id: session.userId },
      data: validated,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        photo: true,
        role: true,
        bio: true,
        company: true,
        address: true,
        city: true,
        country: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
