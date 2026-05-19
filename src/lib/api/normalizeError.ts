export type NormalizedApiError = {
  message: string;
  code: string;
  details: string | null;
  hint: string | null;
};

export function normalizeError(error: unknown): NormalizedApiError {
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
      message: error.message || "Unknown Error instance",
      code: "ERROR_INSTANCE",
      details: error.stack ?? null,
      hint: null,
    };
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;

    let serialized = "Unable to serialize error object";
    try {
      serialized = JSON.stringify(error);
    } catch {
      serialized = "Unable to serialize error object";
    }

    return {
      message:
        typeof record.message === "string"
          ? record.message
          : typeof record.error_description === "string"
            ? record.error_description
            : typeof record.error === "string"
              ? record.error
              : "Unknown object error",
      code:
        typeof record.code === "string"
          ? record.code
          : "UNKNOWN_OBJECT_ERROR",
      details:
        typeof record.details === "string"
          ? record.details
          : serialized && serialized !== "{}"
            ? serialized
            : "Received empty object error",
      hint:
        typeof record.hint === "string"
          ? record.hint
          : null,
    };
  }

  return {
    message: String(error),
    code: "UNKNOWN_THROWN_VALUE",
    details: null,
    hint: null,
  };
}
