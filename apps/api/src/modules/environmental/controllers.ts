import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import type { AuthenticatedUser } from "../../middleware/authenticate.js";

const prisma = new PrismaClient();

// Schemas
const factorSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  factorKgCo2e: z.number().positive(),
  active: z.boolean().default(true),
});

const transactionSchema = z.object({
  factorId: z.string(),
  source: z.string().min(1),
  description: z.string(),
  quantity: z.number().positive(),
  occurredOn: z.string().datetime(),
});

const goalSchema = z.object({
  name: z.string().min(1),
  targetKgCo2e: z.number().positive(),
  deadline: z.string().datetime(),
  status: z.enum(["ON_TRACK", "AT_RISK", "COMPLETED"]).default("ON_TRACK"),
});

const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  targetKgCo2e: z.number().positive().optional(),
  currentKgCo2e: z.number().min(0).optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(["ON_TRACK", "AT_RISK", "COMPLETED"]).optional(),
});

// Controllers

export async function getFactors(req: Request, res: Response) {
  try {
    const factors = await prisma.emissionFactor.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ data: factors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch factors" } });
  }
}

export async function createFactor(req: Request, res: Response) {
  try {
    const data = factorSchema.parse(req.body);
    const factor = await prisma.emissionFactor.create({ data });
    res.json({ data: factor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ error: { code: "VALIDATION_ERROR", message: error.issues } });
    } else {
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create factor" } });
    }
  }
}

export async function getTransactions(req: Request, res: Response) {
  try {
    const departmentId = req.query.departmentId as string | undefined;
    
    const where = departmentId ? { departmentId } : {};
    
    const transactions = await prisma.carbonTransaction.findMany({
      where,
      include: {
        emissionFactor: true,
        department: true,
        createdBy: true,
      },
      orderBy: { occurredOn: "desc" },
    });
    res.json({ data: transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch transactions" } });
  }
}

export async function createTransaction(req: Request, res: Response) {
  try {
    const user = req.user as AuthenticatedUser;
    const data = transactionSchema.parse(req.body);
    
    if (!user.departmentId) {
       res.status(400).json({ error: { code: "INVALID_STATE", message: "User has no department" } });
       return;
    }

    const factor = await prisma.emissionFactor.findUnique({
      where: { id: data.factorId },
    });

    if (!factor) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Emission factor not found" } });
      return;
    }

    const calculatedKgCo2e = Number(factor.factorKgCo2e) * data.quantity;

    const transaction = await prisma.carbonTransaction.create({
      data: {
        departmentId: user.departmentId,
        factorId: factor.id,
        createdById: user.sub,
        source: data.source,
        description: data.description,
        quantity: data.quantity,
        factorValueSnapshot: factor.factorKgCo2e,
        calculatedKgCo2e,
        occurredOn: new Date(data.occurredOn),
      },
      include: {
        emissionFactor: true,
        department: true,
      }
    });
    
    const goals = await prisma.environmentalGoal.findMany({
      where: { departmentId: user.departmentId, status: { not: "COMPLETED" } }
    });
    
    for (const goal of goals) {
      const newCurrent = Number(goal.currentKgCo2e) + calculatedKgCo2e;
      const target = Number(goal.targetKgCo2e);
      const newStatus = (newCurrent / target) >= 0.8 ? "AT_RISK" : "ON_TRACK";
      
      await prisma.environmentalGoal.update({
        where: { id: goal.id },
        data: { 
          currentKgCo2e: newCurrent,
          status: newStatus
        }
      });
    }

    res.json({ data: transaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ error: { code: "VALIDATION_ERROR", message: error.issues } });
    } else {
      console.error(error);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create transaction" } });
    }
  }
}

export async function getGoals(req: Request, res: Response) {
  try {
    const departmentId = req.query.departmentId as string | undefined;
    const where = departmentId ? { departmentId } : {};
    const goals = await prisma.environmentalGoal.findMany({
      where,
      include: { department: true },
      orderBy: { deadline: "asc" },
    });
    res.json({ data: goals });
  } catch (error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch goals" } });
  }
}

export async function createGoal(req: Request, res: Response) {
  try {
    const user = req.user as AuthenticatedUser;
    const data = goalSchema.parse(req.body);
    
    if (!user.departmentId) {
       res.status(400).json({ error: { code: "INVALID_STATE", message: "User has no department" } });
       return;
    }

    const goal = await prisma.environmentalGoal.create({
      data: {
        departmentId: user.departmentId,
        name: data.name,
        targetKgCo2e: data.targetKgCo2e,
        currentKgCo2e: 0,
        deadline: new Date(data.deadline),
        status: data.status,
      }
    });

    res.json({ data: goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ error: { code: "VALIDATION_ERROR", message: error.issues } });
    } else {
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create goal" } });
    }
  }
}

export async function updateGoal(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const data = updateGoalSchema.parse(req.body);

    const existing = await prisma.environmentalGoal.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Goal not found" } });
      return;
    }

    const goal = await prisma.environmentalGoal.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.targetKgCo2e !== undefined && { targetKgCo2e: data.targetKgCo2e }),
        ...(data.currentKgCo2e !== undefined && { currentKgCo2e: data.currentKgCo2e }),
        ...(data.deadline !== undefined && { deadline: new Date(data.deadline) }),
        ...(data.status !== undefined && { status: data.status }),
      }
    });

    res.json({ data: goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ error: { code: "VALIDATION_ERROR", message: error.issues } });
    } else {
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to update goal" } });
    }
  }
}
