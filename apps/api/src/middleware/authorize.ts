import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

/**
 * Express middleware to restrict route access to specific roles.
 * Expects `req.user` to be populated by the `authenticate` middleware.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Missing or invalid authentication." },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have access to this resource." },
      });
      return;
    }

    next();
  };
}
