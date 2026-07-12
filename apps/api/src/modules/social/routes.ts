import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import {
  createParticipationEvidence,
  deleteParticipationEvidence,
  formatEvidence,
} from "../../lib/evidence.js";
import { uploadPhotos } from "../../lib/storage.js";
import { prisma } from "../../prisma.js";

export const socialRouter = Router();

const createActivitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().transform((val) => new Date(val)),
  location: z.string().min(1),
  volunteeringHours: z.number().min(0),
  xpReward: z.number().int().min(0),
});

const submitProofSchema = z.object({
  proofText: z.string().min(10, "Proof description must be at least 10 characters long."),
});

function handlePhotoUpload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  uploadPhotos(req, res, (error) => {
    if (error) {
      res.status(400).json({
        error: {
          code: "UPLOAD_ERROR",
          message: error.message ?? "Failed to upload photos.",
        },
      });
      return;
    }
    next();
  });
}

// Helper: Award XP-based badges
async function checkAndAwardXpBadges(userId: string, currentXp: number) {
  const xpBadges = await prisma.badge.findMany({
    where: { xpThreshold: { gt: 0 } },
  });

  for (const badge of xpBadges) {
    if (currentXp >= badge.xpThreshold) {
      const existing = await prisma.userBadge.findUnique({
        where: {
          userId_badgeId: { userId, badgeId: badge.id },
        },
      });
      if (!existing) {
        await prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        });
      }
    }
  }
}

// Helper: Award Volunteering Star badge
async function checkAndAwardVolunteeringBadge(userId: string) {
  const badge = await prisma.badge.findUnique({
    where: { name: "Volunteering Star" },
  });
  if (badge) {
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: { userId, badgeId: badge.id },
      },
    });
    if (!existing) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
    }
  }
}

// 1. Get all CSR activities
socialRouter.get("/activities", authenticate, async (req, res) => {
  try {
    const activities = await prisma.csrActivity.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        participations: {
          where: { userId: req.user.sub },
        },
      },
      orderBy: { date: "asc" },
    });
    res.json({ data: activities });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 2. Create a CSR activity (ADMIN/ESG_MANAGER only)
socialRouter.post("/activities", authenticate, async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "ESG_MANAGER") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "Only managers or admins can create CSR activities." },
    });
    return;
  }

  const parsedBody = createActivitySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input fields.",
        fields: parsedBody.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const activity = await prisma.csrActivity.create({
      data: {
        ...parsedBody.data,
        creatorId: req.user.sub,
      },
    });
    res.status(201).json({ data: activity });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 3. Register for a CSR activity
socialRouter.post("/activities/:id/register", authenticate, async (req, res) => {
  const id = req.params.id as string;

  try {
    const activity = await prisma.csrActivity.findUnique({
      where: { id },
    });

    if (!activity) {
      res.status(404).json({ error: { message: "Activity not found." } });
      return;
    }

    const existingParticipation = await prisma.csrParticipation.findUnique({
      where: {
        userId_activityId: {
          userId: req.user.sub,
          activityId: id,
        },
      },
    });

    if (existingParticipation) {
      res.status(400).json({ error: { message: "You are already registered for this activity." } });
      return;
    }

    const participation = await prisma.csrParticipation.create({
      data: {
        userId: req.user.sub,
        activityId: id,
        status: "REGISTERED",
      },
    });

    res.status(201).json({ data: participation });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 4. Submit proof of participation (multipart: proofText + optional photos)
socialRouter.post(
  "/activities/:id/submit-proof",
  authenticate,
  handlePhotoUpload,
  async (req, res) => {
  const id = req.params.id as string;

  const parsedBody = submitProofSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: parsedBody.error.issues[0]?.message ?? "Invalid proof text.",
      },
    });
    return;
  }

  const uploadedFiles = (req.files as Express.Multer.File[] | undefined) ?? [];

  try {
    const participation = await prisma.csrParticipation.findUnique({
      where: {
        userId_activityId: {
          userId: req.user.sub,
          activityId: id,
        },
      },
      include: { evidence: true },
    });

    if (!participation) {
      res.status(404).json({ error: { message: "You must register for the activity before submitting proof." } });
      return;
    }

    if (participation.status === "APPROVED" || participation.status === "PENDING_APPROVAL") {
      res.status(400).json({ error: { message: `Cannot submit proof. Current status is ${participation.status}.` } });
      return;
    }

    if (participation.status === "REJECTED" && participation.evidence.length > 0) {
      await deleteParticipationEvidence(participation.id);
    }

    const updated = await prisma.csrParticipation.update({
      where: { id: participation.id },
      data: {
        status: "PENDING_APPROVAL",
        proofText: parsedBody.data.proofText,
        submittedAt: new Date(),
      },
    });

    const evidence = await createParticipationEvidence(
      participation.id,
      req.user.sub,
      uploadedFiles,
    );

    res.json({
      data: {
        ...updated,
        evidence,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 5. Get participations (Manager sees all / Employees see their own)
socialRouter.get("/participations", authenticate, async (req, res) => {
  try {
    if (req.user.role === "ADMIN" || req.user.role === "ESG_MANAGER") {
      const participations = await prisma.csrParticipation.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, department: true },
          },
          activity: true,
          evidence: true,
        },
        orderBy: { submittedAt: "desc" },
      });
      res.json({
        data: participations.map((participation) => ({
          ...participation,
          evidence: participation.evidence.map(formatEvidence),
        })),
      });
    } else {
      const participations = await prisma.csrParticipation.findMany({
        where: { userId: req.user.sub },
        include: { activity: true, evidence: true },
        orderBy: { createdAt: "desc" },
      });
      res.json({
        data: participations.map((participation) => ({
          ...participation,
          evidence: participation.evidence.map(formatEvidence),
        })),
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 6. Approve participation (ADMIN/ESG_MANAGER only)
socialRouter.post("/participations/:id/approve", authenticate, async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "ESG_MANAGER") {
    res.status(403).json({ error: { message: "Only managers or admins can approve CSR participations." } });
    return;
  }

  const id = req.params.id as string;

  try {
    const participation = await prisma.csrParticipation.findUnique({
      where: { id },
      include: { activity: true, user: true },
    });

    if (!participation) {
      res.status(404).json({ error: { message: "Participation record not found." } });
      return;
    }

    if (participation.status === "APPROVED") {
      res.status(400).json({ error: { message: "Participation is already approved." } });
      return;
    }

    // Update participation status
    const updated = await prisma.csrParticipation.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: req.user.sub,
      },
    });

    // Update user XP
    const newXp = participation.user.xp + participation.activity.xpReward;
    await prisma.user.update({
      where: { id: participation.userId },
      data: { xp: newXp },
    });

    // Award badges
    await checkAndAwardVolunteeringBadge(participation.userId);
    await checkAndAwardXpBadges(participation.userId, newXp);

    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 7. Reject participation (ADMIN/ESG_MANAGER only)
socialRouter.post("/participations/:id/reject", authenticate, async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "ESG_MANAGER") {
    res.status(403).json({ error: { message: "Only managers or admins can reject CSR participations." } });
    return;
  }

  const id = req.params.id as string;

  try {
    const participation = await prisma.csrParticipation.findUnique({
      where: { id },
    });

    if (!participation) {
      res.status(404).json({ error: { message: "Participation record not found." } });
      return;
    }

    const updated = await prisma.csrParticipation.update({
      where: { id },
      data: {
        status: "REJECTED",
        approvedAt: new Date(),
        approvedById: req.user.sub,
      },
    });

    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});
