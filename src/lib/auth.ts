import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret";
export const SESSION_COOKIE = "socialora_session";

export type SessionPayload = { userId: string; email: string; name: string };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/** Reads + verifies the session cookie inside Server Components / Route Handlers. */
export function getSession(): SessionPayload | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Same as getSession but throws a 401-friendly error for API routes. */
export function requireSession(): SessionPayload {
  const session = getSession();
  if (!session) {
    const err = new Error("UNAUTHENTICATED");
    (err as any).status = 401;
    throw err;
  }
  return session;
}

/** Confirms the current user belongs to the workspace, returns their role. */
export async function requireMembership(userId: string, workspaceId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) {
    const err = new Error("FORBIDDEN");
    (err as any).status = 403;
    throw err;
  }
  return membership;
}

export const ROLE_RANK: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  SPECIALIST: 2,
  CREATOR: 1,
  CLIENT: 0,
};

/** Throws unless the membership's role is at or above `minRole`. */
export function requireRoleAtLeast(role: string, minRole: keyof typeof ROLE_RANK) {
  if ((ROLE_RANK[role] ?? -1) < ROLE_RANK[minRole]) {
    const err = new Error("INSUFFICIENT_ROLE");
    (err as any).status = 403;
    throw err;
  }
}
