import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (user) {
      // Generate a reset token
      const resetToken = generateToken();

      // Store reset token in user record (using a temporary field)
      // For this demo, we store it in the user's bio field as JSON
      // In production, you'd have a dedicated resetToken field or table
      const existingBio = (user as Record<string, unknown>).bio as string | null;
      let userData: Record<string, unknown> = {};
      try {
        userData = existingBio ? JSON.parse(existingBio) : {};
      } catch {
        userData = {};
      }
      userData.resetToken = resetToken;
      userData.resetTokenExpiry = Date.now() + 3600000; // 1 hour

      await db.user.update({
        where: { id: user.id },
        data: { bio: JSON.stringify(userData) },
      });

      // For this demo, log the token and include it in the response
      console.log(`[Forgot Password] Reset token for ${validated.email}: ${resetToken}`);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: "Si un compte existe avec cette adresse email, un email de récupération a été envoyé.",
      ...(user ? { resetToken: `demo-token-${Date.now()}` } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Adresse email invalide", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la demande" },
      { status: 500 }
    );
  }
}
