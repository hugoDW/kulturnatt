export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Use at least 8 characters with lowercase, uppercase, a number, and a symbol.";

export function isPasswordCompliant(password: string) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
