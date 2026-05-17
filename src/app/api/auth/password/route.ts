import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateToken, hashPassword } from "@/lib/auth";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(1, "La confirmation du mot de passe est requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

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
    const validated = changePasswordSchema.parse(body);

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

    // Verify current password
    const currentPasswordHash = hashPassword(validated.currentPassword);
    if (user.passwordHash !== currentPasswordHash) {
      return NextResponse.json(
        { error: "Le mot de passe actuel est incorrect" },
        { status: 400 }
      );
    }

    // Update password
    const newPasswordHash = hashPassword(validated.newPassword);
    await db.user.update({
      where: { id: session.userId },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({ message: "Mot de passe modifié avec succès" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    );
  }
}
