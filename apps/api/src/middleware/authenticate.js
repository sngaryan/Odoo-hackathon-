import jwt from "jsonwebtoken";
import { z } from "zod";
const tokenPayloadSchema = z.object({
    sub: z.string(),
    role: z.enum(["ADMIN", "ESG_MANAGER", "EMPLOYEE", "AUDITOR"]),
    departmentId: z.string().nullable(),
});
export function authenticate(req, res, next) {
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
    }
    catch {
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
//# sourceMappingURL=authenticate.js.map