import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Log error details for development and troubleshooting
  console.error("API Error Handler Caught:", err);

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Input validation failed.",
        fields: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Handle default internal server error without leaking technical database/stack details
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? "An unexpected error occurred.";
  res.status(status).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: status === 500 ? "An unexpected error occurred." : message,
    },
  });
};
