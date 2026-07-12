import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

const tokenPayloadSchema = z.object({
  sub: z.string(),
  role: z.enum(["ADMIN", "ESG_MANAGER", "EMPLOYEE", "AUDITOR"]),
  departmentId: z.string().nullable(),
});

export type AuthenticatedUser = z.infer<typeof tokenPayloadSchema>;

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing bearer token." },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = tokenPayloadSchema.parse(decoded);
    next();
  } catch {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token." },
    });
  }
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

export function authorize(...roles: Array<AuthenticatedUser["role"]>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Missing bearer token." },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: { code: "FORBIDDEN", message: "Insufficient permissions." },
      });
      return;
    }

    next();
  };
}
