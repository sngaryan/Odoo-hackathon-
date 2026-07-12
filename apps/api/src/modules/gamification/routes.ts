import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
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

// 3. Submit proof for a challenge
gamificationRouter.post("/challenges/:id/submit", authenticate, async (req, res) => {
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
    });

    if (existingSubmission) {
      res.status(400).json({ error: { message: "You have already submitted proof for this challenge." } });
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

    res.status(201).json({ data: submission });
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
        },
        orderBy: { submittedAt: "desc" },
      });
      res.json({ data: submissions });
    } else {
      const submissions = await prisma.challengeSubmission.findMany({
        where: { userId: req.user.sub },
        include: { challenge: true },
        orderBy: { submittedAt: "desc" },
      });
      res.json({ data: submissions });
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
    const submission = await prisma.challengeSubmission.findUnique({
      where: { id },
      include: { challenge: true, user: true },
    });

    if (!submission) {
      res.status(404).json({ error: { message: "Submission not found." } });
      return;
    }

    if (submission.status === "APPROVED") {
      res.status(400).json({ error: { message: "Submission is already approved." } });
      return;
    }

    const updated = await prisma.challengeSubmission.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: req.user.sub,
      },
    });

    // Update user XP
    const newXp = submission.user.xp + submission.challenge.xpReward;
    await prisma.user.update({
      where: { id: submission.userId },
      data: { xp: newXp },
    });

    // Award badge reward if any
    if (submission.challenge.badgeRewardId) {
      const existingBadge = await prisma.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId: submission.userId,
            badgeId: submission.challenge.badgeRewardId,
          },
        },
      });

      if (!existingBadge) {
        await prisma.userBadge.create({
          data: {
            userId: submission.userId,
            badgeId: submission.challenge.badgeRewardId,
          },
        });
      }
    }

    // Check other threshold badges
    await checkAndAwardXpBadges(submission.userId, newXp);

    res.json({ data: updated });
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
