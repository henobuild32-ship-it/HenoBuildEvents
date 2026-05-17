import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken, hashPassword, destroySession } from "@/lib/auth";

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis pour supprimer le compte"),
});

export async function DELETE(request: NextRequest) {
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
    const validated = deleteAccountSchema.parse(body);

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Verify password
    const passwordHash = hashPassword(validated.password);
    if (user.passwordHash !== passwordHash) {
      return NextResponse.json(
        { error: "Le mot de passe est incorrect" },
        { status: 400 }
      );
    }

    // Delete user and all related data (cascading deletes in schema)
    await db.user.delete({
      where: { id: session.userId },
    });

    // Destroy session
    destroySession(token);

    return NextResponse.json({ message: "Compte supprimé avec succès" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte" },
      { status: 500 }
    );
  }
}
