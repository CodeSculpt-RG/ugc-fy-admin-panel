export const ADMIN_ERRORS = {
  WRONG_PASSWORD: "Invalid email or password.",
  EMAIL_NOT_INVITED: "This email does not have admin access.",
  SUSPENDED_ADMIN: "This admin account is currently suspended.",
  REVOKED_ADMIN: "This admin account no longer has access.",
  BANNED_EMAIL_IP: "Access temporarily blocked due to suspicious activity.",
  ENV_CONFIG_ERROR: "Authentication system is not configured correctly.",
  NETWORK_ERROR: "Unable to connect. Please try again.",
  UNAUTHORIZED: "You are not authorized to view this resource.",
  GENERIC_ERROR: "An unexpected error occurred. Please try again.",
};

export function getPublicErrorMessage(code: string): string {
  switch (code) {
    case "INVALID_PASSWORD":
    case "WRONG_PASSWORD":
      return ADMIN_ERRORS.WRONG_PASSWORD;
    case "NOT_INVITED":
    case "EMAIL_NOT_INVITED":
      return ADMIN_ERRORS.EMAIL_NOT_INVITED;
    case "SUSPENDED":
    case "SUSPENDED_ADMIN":
      return ADMIN_ERRORS.SUSPENDED_ADMIN;
    case "REVOKED":
    case "REVOKED_ADMIN":
      return ADMIN_ERRORS.REVOKED_ADMIN;
    case "BANNED":
    case "BANNED_EMAIL_IP":
      return ADMIN_ERRORS.BANNED_EMAIL_IP;
    case "ENV_CONFIG_ERROR":
      return ADMIN_ERRORS.ENV_CONFIG_ERROR;
    case "NETWORK_ERROR":
      return ADMIN_ERRORS.NETWORK_ERROR;
    case "UNAUTHORIZED":
      return ADMIN_ERRORS.UNAUTHORIZED;
    default:
      return ADMIN_ERRORS.GENERIC_ERROR;
  }
}
