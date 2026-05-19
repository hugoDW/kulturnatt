import * as Linking from "expo-linking";

export const VERIFY_EMAIL_PATH = "auth/callback";
export const RESET_PASSWORD_PATH = "auth/reset-password";

export function getAuthRedirectUrl(path: typeof VERIFY_EMAIL_PATH | typeof RESET_PASSWORD_PATH) {
  return Linking.createURL(path);
}
