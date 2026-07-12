export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(404, "NOT_FOUND", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this action.") {
    super(403, "FORBIDDEN", message);
  }
}

export class InvalidStateError extends AppError {
  constructor(message = "Invalid state transition.") {
    super(409, "INVALID_STATE", message);
  }
}
