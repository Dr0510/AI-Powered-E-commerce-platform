// Error handling and logging utilities

const isDev = process.env.NODE_ENV === "development";

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message, details = null) {
    super(message, 404, details);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details = null) {
    super(message, 401, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details = null) {
    super(message, 403, details);
    this.name = "ForbiddenError";
  }
}

export function logError(error, context = {}) {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    message: error.message,
    stack: isDev ? error.stack : undefined,
    context,
    name: error.name,
    statusCode: error.statusCode || 500,
  };

  // In production, send to monitoring service (e.g., Sentry)
  if (!isDev) {
    // TODO: Send to error tracking service
    console.error("[ERROR]", JSON.stringify(errorLog));
  } else {
    console.error("[DEV ERROR]", errorLog);
  }

  return errorLog;
}

export function errorResponse(error) {
  const statusCode = error.statusCode || 500;
  const message = isDev ? error.message : "An error occurred";
  const details = isDev ? error.details : undefined;

  return Response.json(
    {
      message,
      ...(details && { details }),
      ...(isDev && error.stack && { stack: error.stack }),
    },
    { status: statusCode }
  );
}

export function handleApiError(fn) {
  return async function wrappedFn(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { function: fn.name });
      
      if (error instanceof AppError) {
        return errorResponse(error);
      }

      // Handle database errors
      if (error.message?.includes("database") || error.code?.startsWith("PGSQL")) {
        return Response.json(
          { message: "Database error occurred" },
          { status: 500 }
        );
      }

      // Handle fetch errors
      if (error.message?.includes("fetch")) {
        return Response.json(
          { message: "Network error occurred" },
          { status: 503 }
        );
      }

      return Response.json(
        { message: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
