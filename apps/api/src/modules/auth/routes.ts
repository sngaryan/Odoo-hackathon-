import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { authenticate, getJwtSecret } from "../../middleware/authenticate.js";
import { prisma } from "../../prisma.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const parsedBody = loginSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Email and password are required.",
        fields: parsedBody.error.flatten().fieldErrors,
      },
    });
    return;
  }

  const { email, password } = parsedBody.data;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { department: true },
  });

  if (!user) {
    res.status(401).json({
      error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." },
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    res.status(401).json({
      error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." },
    });
    return;
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      departmentId: user.departmentId,
    },
    getJwtSecret(),
    { expiresIn: "8h" },
  );

  res.json({
    data: {
      token,
      user: toPublicUser(user),
    },
  });
});

authRouter.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    include: { department: true },
  });

  if (!user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "User no longer exists." },
    });
    return;
  }

  res.json({ data: { user: toPublicUser(user) } });
});

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  department: { id: string; name: string; code: string } | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  };
}
