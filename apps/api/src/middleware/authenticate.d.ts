import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
declare const tokenPayloadSchema: z.ZodObject<{
    sub: z.ZodString;
    role: z.ZodEnum<{
        ADMIN: "ADMIN";
        AUDITOR: "AUDITOR";
        EMPLOYEE: "EMPLOYEE";
        ESG_MANAGER: "ESG_MANAGER";
    }>;
    departmentId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type AuthenticatedUser = z.infer<typeof tokenPayloadSchema>;
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
export declare function getJwtSecret(): string;
export {};
//# sourceMappingURL=authenticate.d.ts.map