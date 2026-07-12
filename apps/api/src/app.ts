import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/routes.js";
import { socialRouter } from "./modules/social/routes.js";
import { gamificationRouter } from "./modules/gamification/routes.js";

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
app.use("/social", socialRouter);
app.use("/gamification", gamificationRouter);
