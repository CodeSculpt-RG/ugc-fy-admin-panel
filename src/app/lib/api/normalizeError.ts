export function normalizeError(error: unknown) {
  if (!error) {
    return {
      message: "Unknown error: empty error object",
      code: "EMPTY_ERROR",
      details: null,
      hint: null,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "ERROR_INSTANCE",
      details: error.stack ?? null,
      hint: null,
    };
  }

  if (typeof error === "object") {
    const err = error as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
      error?: string;
      error_description?: string;
    };

    return {
      message:
        err.message ||
        err.error_description ||
        err.error ||
        "Unknown object error",
      code: err.code || "UNKNOWN_OBJECT_ERROR",
      details: err.details || JSON.stringify(err),
      hint: err.hint || null,
    };
  }

  return {
    message: String(error),
    code: "STRING_ERROR",
    details: null,
    hint: null,
  };
}
