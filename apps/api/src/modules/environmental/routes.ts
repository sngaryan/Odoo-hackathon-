import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate.js";
import {
  getFactors,
  createFactor,
  getTransactions,
  createTransaction,
  getGoals,
  createGoal,
  updateGoal,
  getDepartments,
} from "./controllers.js";

export const environmentalRouter = Router();

environmentalRouter.use(authenticate);

// Departments
environmentalRouter.get("/departments", authorize("ADMIN", "ESG_MANAGER"), getDepartments);

// Factors
environmentalRouter.get("/factors", getFactors);
environmentalRouter.post("/factors", authorize("ADMIN", "ESG_MANAGER"), createFactor);

// Transactions
environmentalRouter.get("/transactions", getTransactions);
environmentalRouter.post("/transactions", authorize("ADMIN", "ESG_MANAGER"), createTransaction);

// Goals
environmentalRouter.get("/goals", getGoals);
environmentalRouter.post("/goals", authorize("ADMIN", "ESG_MANAGER"), createGoal);
environmentalRouter.patch("/goals/:id", authorize("ADMIN", "ESG_MANAGER"), updateGoal);
