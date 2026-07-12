import { Router } from "express";
import { Prisma } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import {
  createSubmissionEvidence,
  deleteSubmissionEvidence,
  formatEvidence,
} from "../../lib/evidence.js";
import { uploadPhotos } from "../../lib/storage.js";
import { prisma } from "../../prisma.js";

export const gamificationRouter = Router();

const createChallengeSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["COMMUTE", "ENERGY", "WASTE", "WATER", "OTHER"]),
  xpReward: z.number().int().min(0),
  badgeRewardId: z.string().optional().nullable(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
});

const submitChallengeProofSchema = z.object({
  proofText: z.string().min(10, "Proof description must be at least 10 characters long."),
});

const rejectChallengeSubmissionSchema = z.object({
  reviewFeedback: z.string().trim().min(3, "Feedback must be at least 3 characters long.").max(1000),
});

const redeemRewardSchema = z.object({
  rewardItemId: z.string().min(1),
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
async function checkAndAwardXpBadges(
  tx: Prisma.TransactionClient,
  userId: string,
  currentXp: number,
) {
  const xpBadges = await tx.badge.findMany({
    where: { xpThreshold: { gt: 0 } },
  });

  const earnedBadgeIds = xpBadges
    .filter((badge) => currentXp >= badge.xpThreshold)
    .map((badge) => badge.id);

  if (earnedBadgeIds.length > 0) {
    await tx.userBadge.createMany({
      data: earnedBadgeIds.map((badgeId) => ({ userId, badgeId })),
      skipDuplicates: true,
    });
  }
}

// 1. Get all challenges
gamificationRouter.get("/challenges", authenticate, async (req, res) => {
  try {
    const challenges = await prisma.challenge.findMany({
      include: {
        badgeReward: true,
        submissions: {
          where: { userId: req.user.sub },
        },
      },
      orderBy: { endDate: "asc" },
    });
    res.json({ data: challenges });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 2. Create a challenge (ADMIN/ESG_MANAGER only)
gamificationRouter.post("/challenges", authenticate, async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "ESG_MANAGER") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "Only managers or admins can create challenges." },
    });
    return;
  }

  const parsedBody = createChallengeSchema.safeParse(req.body);
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
    const { badgeRewardId, ...rest } = parsedBody.data;
    const challenge = await prisma.challenge.create({
      data: {
        ...rest,
        badgeRewardId: badgeRewardId || null,
      },
    });
    res.status(201).json({ data: challenge });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 3. Submit proof for a challenge (multipart: proofText + optional photos)
gamificationRouter.post(
  "/challenges/:id/submit",
  authenticate,
  handlePhotoUpload,
  async (req, res) => {
  const id = req.params.id as string;

  const parsedBody = submitChallengeProofSchema.safeParse(req.body);
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
    const challenge = await prisma.challenge.findUnique({
      where: { id },
    });

    if (!challenge) {
      res.status(404).json({ error: { message: "Challenge not found." } });
      return;
    }

    const existingSubmission = await prisma.challengeSubmission.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user.sub,
          challengeId: id,
        },
      },
      include: { evidence: true },
    });

    if (existingSubmission) {
      if (existingSubmission.status !== "REJECTED") {
        res.status(400).json({ error: { message: "You have already submitted proof for this challenge." } });
        return;
      }

      if (existingSubmission.evidence.length > 0) {
        await deleteSubmissionEvidence(existingSubmission.id);
      }

      const updated = await prisma.challengeSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          status: "SUBMITTED",
          proofText: parsedBody.data.proofText,
          reviewFeedback: null,
          submittedAt: new Date(),
          approvedAt: null,
          approvedById: null,
        },
      });

      const evidence = await createSubmissionEvidence(
        existingSubmission.id,
        req.user.sub,
        uploadedFiles,
      );

      res.json({
        data: {
          ...updated,
          evidence,
        },
      });
      return;
    }

    const submission = await prisma.challengeSubmission.create({
      data: {
        userId: req.user.sub,
        challengeId: id,
        status: "SUBMITTED",
        proofText: parsedBody.data.proofText,
      },
    });

    const evidence = await createSubmissionEvidence(
      submission.id,
      req.user.sub,
      uploadedFiles,
    );

    res.status(201).json({
      data: {
        ...submission,
        evidence,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 4. Get submissions (Manager sees all / Employees see their own)
gamificationRouter.get("/submissions", authenticate, async (req, res) => {
  try {
    if (req.user.role === "ADMIN" || req.user.role === "ESG_MANAGER") {
      const submissions = await prisma.challengeSubmission.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, department: true },
          },
          challenge: true,
          evidence: true,
        },
        orderBy: { submittedAt: "desc" },
      });
      res.json({
        data: submissions.map((submission) => ({
          ...submission,
          evidence: submission.evidence.map(formatEvidence),
        })),
      });
    } else {
      const submissions = await prisma.challengeSubmission.findMany({
        where: { userId: req.user.sub },
        include: { challenge: true, evidence: true },
        orderBy: { submittedAt: "desc" },
      });
      res.json({
        data: submissions.map((submission) => ({
          ...submission,
          evidence: submission.evidence.map(formatEvidence),
        })),
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 5. Approve submission (ADMIN/ESG_MANAGER only)
gamificationRouter.post("/submissions/:id/approve", authenticate, async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "ESG_MANAGER") {
    res.status(403).json({ error: { message: "Only managers or admins can approve submissions." } });
    return;
  }

  const id = req.params.id as string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.challengeSubmission.findUnique({
        where: { id },
        include: { challenge: true },
      });

      if (!submission) {
        return { kind: "NOT_FOUND" as const };
      }

      // This conditional update is the concurrency guard: exactly one request can
      // transition a pending submission, and only that request continues to XP/badges.
      const approval = await tx.challengeSubmission.updateMany({
        where: { id, status: "SUBMITTED" },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedById: req.user.sub,
        },
      });

      if (approval.count === 0) {
        return { kind: "ALREADY_REVIEWED" as const };
      }

      const user = await tx.user.update({
        where: { id: submission.userId },
        data: { xp: { increment: submission.challenge.xpReward } },
        select: { xp: true },
      });

      if (submission.challenge.badgeRewardId) {
        await tx.userBadge.createMany({
          data: {
            userId: submission.userId,
            badgeId: submission.challenge.badgeRewardId,
          },
          skipDuplicates: true,
        });
      }

      await checkAndAwardXpBadges(tx, submission.userId, user.xp);

      return {
        kind: "APPROVED" as const,
        submission: await tx.challengeSubmission.findUniqueOrThrow({ where: { id } }),
      };
    });

    if (result.kind === "NOT_FOUND") {
      res.status(404).json({ error: { message: "Submission not found." } });
      return;
    }

    if (result.kind === "ALREADY_REVIEWED") {
      res.status(409).json({ error: { message: "Submission has already been reviewed." } });
      return;
    }

    res.json({ data: result.submission });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 6. Reject submission (ADMIN/ESG_MANAGER only)
gamificationRouter.post("/submissions/:id/reject", authenticate, async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "ESG_MANAGER") {
    res.status(403).json({ error: { message: "Only managers or admins can reject submissions." } });
    return;
  }

  const id = req.params.id as string;
  const parsedBody = rejectChallengeSubmissionSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: { message: parsedBody.error.issues[0]?.message ?? "Reviewer feedback is required." },
    });
    return;
  }

  try {
    const submission = await prisma.challengeSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      res.status(404).json({ error: { message: "Submission not found." } });
      return;
    }

    const updated = await prisma.challengeSubmission.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewFeedback: parsedBody.data.reviewFeedback,
        approvedAt: new Date(),
        approvedById: req.user.sub,
      },
    });

    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 7. Get all badges with user earned status
gamificationRouter.get("/badges", authenticate, async (req, res) => {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { xpThreshold: "asc" },
    });

    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.user.sub },
    });

    const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

    const result = badges.map((badge) => {
      const earnedRecord = userBadges.find((ub) => ub.badgeId === badge.id);
      return {
        ...badge,
        earned: earnedBadgeIds.has(badge.id),
        earnedAt: earnedRecord ? earnedRecord.earnedAt : null,
      };
    });

    res.json({ data: result });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 8. Get leaderboards
gamificationRouter.get("/leaderboard", authenticate, async (_req, res) => {
  try {
    // A. Employee rankings
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        xp: true,
        department: {
          select: { name: true, code: true },
        },
        badges: {
          select: { badgeId: true },
        },
      },
      orderBy: { xp: "desc" },
    });

    const employees = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      xp: user.xp,
      department: user.department?.name ?? "No department",
      departmentCode: user.department?.code ?? "",
      badgesCount: user.badges.length,
    }));

    // B. Department rankings
    const departments = await prisma.department.findMany({
      include: {
        users: {
          select: { xp: true },
        },
      },
    });

    const departmentStandings = departments.map((dept) => {
      const totalXp = dept.users.reduce((sum, user) => sum + user.xp, 0);
      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        totalXp,
        memberCount: dept.users.length,
      };
    });

    // Sort departments by total XP desc
    departmentStandings.sort((a, b) => b.totalXp - a.totalXp);

    res.json({
      data: {
        employees,
        departments: departmentStandings,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// 9. Rewards catalog and a user's redemption history
gamificationRouter.get("/rewards", authenticate, async (req, res) => {
  try {
    const [items, user] = await Promise.all([
      prisma.rewardItem.findMany({ where: { active: true }, orderBy: { xpCost: "asc" } }),
      prisma.user.findUniqueOrThrow({ where: { id: req.user.sub }, select: { xp: true } }),
    ]);
    res.json({ data: { xpBalance: user.xp, items } });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

gamificationRouter.get("/redemptions", authenticate, async (req, res) => {
  try {
    const redemptions = await prisma.rewardRedemption.findMany({
      where: { userId: req.user.sub },
      include: { rewardItem: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: redemptions });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// XP deduction and the redemption record are one transaction. A conditional
// update prevents concurrent requests from spending the same XP twice.
gamificationRouter.post("/rewards/redeem", authenticate, async (req, res) => {
  const parsedBody = redeemRewardSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: { message: "A reward item is required." } });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.rewardItem.findFirst({
        where: { id: parsedBody.data.rewardItemId, active: true },
      });
      if (!item) return { kind: "NOT_FOUND" as const };
      if (item.stock !== null && item.stock < 1) return { kind: "OUT_OF_STOCK" as const };

      const debit = await tx.user.updateMany({
        where: { id: req.user.sub, xp: { gte: item.xpCost } },
        data: { xp: { decrement: item.xpCost } },
      });
      if (debit.count === 0) return { kind: "INSUFFICIENT_XP" as const };

      if (item.stock !== null) {
        await tx.rewardItem.update({ where: { id: item.id }, data: { stock: { decrement: 1 } } });
      }
      const redemption = await tx.rewardRedemption.create({
        data: { userId: req.user.sub, rewardItemId: item.id, xpSpent: item.xpCost },
        include: { rewardItem: true },
      });
      const user = await tx.user.findUniqueOrThrow({ where: { id: req.user.sub }, select: { xp: true } });
      return { kind: "REDEEMED" as const, redemption, xpBalance: user.xp };
    });

    if (result.kind === "NOT_FOUND") {
      res.status(404).json({ error: { message: "This reward is no longer available." } });
      return;
    }
    if (result.kind === "OUT_OF_STOCK") {
      res.status(409).json({ error: { message: "This reward is out of stock." } });
      return;
    }
    if (result.kind === "INSUFFICIENT_XP") {
      res.status(409).json({ error: { message: "You do not have enough XP for this reward." } });
      return;
    }
    res.status(201).json({ data: result });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});
