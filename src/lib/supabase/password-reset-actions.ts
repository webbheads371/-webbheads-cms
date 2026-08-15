"use server"

import { db } from "@/db"
import { staff, client_users } from "@/db/schema"
import { eq, and, gt } from "drizzle-orm"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function requestPasswordReset(email: string) {
  if (!email || !email.trim()) {
    return { error: "Email is required" }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const resetToken = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 3600 * 1000) // 1 hour from now

  try {
    // 1. Check staff table
    const [staffMember] = await db
      .select({ id: staff.id, email: staff.email })
      .from(staff)
      .where(eq(staff.email, normalizedEmail))

    if (staffMember) {
      await db
        .update(staff)
        .set({
          reset_token: resetToken,
          reset_token_expires: expiresAt,
        })
        .where(eq(staff.id, staffMember.id))

      // TODO / SECURITY WARNING: Currently returning the resetLink & token in the response for local testing/development.
      // BEFORE GOING TO PRODUCTION: Wire an email delivery service (e.g. Resend, SendGrid, or Nodemailer)
      // to send the reset link to `staffMember.email` and DO NOT return `resetLink` or `token` to the client response,
      // to prevent unauthorized password resets by third parties.
      return {
        ok: true,
        token: resetToken,
        resetLink: `/reset-password?token=${resetToken}`,
        message: "Password reset link generated successfully.",
      }
    }

    // 2. Check client_users table
    const [clientUser] = await db
      .select({ id: client_users.id, email: client_users.email })
      .from(client_users)
      .where(eq(client_users.email, normalizedEmail))

    if (clientUser) {
      await db
        .update(client_users)
        .set({
          reset_token: resetToken,
          reset_token_expires: expiresAt,
        })
        .where(eq(client_users.id, clientUser.id))

      // TODO / SECURITY WARNING: See note above regarding production email delivery.
      return {
        ok: true,
        token: resetToken,
        resetLink: `/reset-password?token=${resetToken}`,
        message: "Password reset link generated successfully.",
      }
    }

    return {
      ok: true,
      message: "If an account with that email exists, a password reset link has been generated.",
    }
  } catch (err: any) {
    return { error: err.message || "Failed to request password reset" }
  }
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  if (!token) return { error: "Reset token is required" }
  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters long" }
  }

  const now = new Date()

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // 1. Check staff table for valid, unexpired token
    const [staffMember] = await db
      .select({ id: staff.id, expires: staff.reset_token_expires })
      .from(staff)
      .where(eq(staff.reset_token, token))

    if (staffMember && staffMember.expires && staffMember.expires > now) {
      await db
        .update(staff)
        .set({
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null,
        })
        .where(eq(staff.id, staffMember.id))

      return { ok: true, message: "Password updated successfully! You can now log in." }
    }

    // 2. Check client_users table for valid, unexpired token
    const [clientUser] = await db
      .select({ id: client_users.id, expires: client_users.reset_token_expires })
      .from(client_users)
      .where(eq(client_users.reset_token, token))

    if (clientUser && clientUser.expires && clientUser.expires > now) {
      await db
        .update(client_users)
        .set({
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null,
        })
        .where(eq(client_users.id, clientUser.id))

      return { ok: true, message: "Password updated successfully! You can now log in." }
    }

    return { error: "Invalid or expired reset link. Please request a new one." }
  } catch (err: any) {
    return { error: err.message || "Failed to reset password" }
  }
}
