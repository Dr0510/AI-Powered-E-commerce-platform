// Logging utility for debugging and monitoring

const isDev = process.env.NODE_ENV === "development";

export const logLevels = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

function formatLog(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    level,
    message,
    ...data,
  };

  if (isDev) {
    const colors = {
      DEBUG: "\x1b[36m", // cyan
      INFO: "\x1b[32m",  // green
      WARN: "\x1b[33m",  // yellow
      ERROR: "\x1b[31m", // red
      RESET: "\x1b[0m",
    };
    console.log(
      `${colors[level]}[${level}]${colors.RESET} ${message}`,
      Object.keys(data).length > 0 ? data : ""
    );
  } else {
    console.log(JSON.stringify(log));
  }
}

export function logDebug(message, data) {
  if (isDev) {
    formatLog(logLevels.DEBUG, message, data);
  }
}

export function logInfo(message, data) {
  formatLog(logLevels.INFO, message, data);
}

export function logWarn(message, data) {
  formatLog(logLevels.WARN, message, data);
}

export function logError(message, error, data) {
  formatLog(logLevels.ERROR, message, {
    errorMessage: error?.message,
    errorStack: isDev ? error?.stack : undefined,
    ...data,
  });
}

export function logApiCall(method, path, statusCode, duration) {
  logInfo(`${method} ${path}`, {
    statusCode,
    durationMs: duration,
  });
}

export function logDatabase(query, duration, params = {}) {
  if (isDev) {
    logDebug(`Database query: ${query}`, {
      durationMs: duration,
      params: Object.keys(params).length > 0 ? params : undefined,
    });
  }
}
