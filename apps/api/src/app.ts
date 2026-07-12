import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/routes.js";
import { governanceRouter } from "./modules/governance/routes.js";
import { socialRouter } from "./modules/social/routes.js";
import { gamificationRouter } from "./modules/gamification/routes.js";
import { environmentalRouter } from "./modules/environmental/routes.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    data: {
      status: "ok",
      service: "ecosphere-api",
    },
  });
});

app.use("/auth", authRouter);
app.use("/api/v1", governanceRouter);
app.use("/social", socialRouter);
app.use("/gamification", gamificationRouter);
app.use("/api/v1/environmental", environmentalRouter);

// Register global error handler middleware
app.use(errorHandler);
