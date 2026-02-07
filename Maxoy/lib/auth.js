export const AUTH_COOKIE = "maxoy_auth";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function setAuthCookie(value) {
  if (typeof document === "undefined") return;
  if (value) {
    document.cookie = `${AUTH_COOKIE}=${value}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}`;
  } else {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
  }
}
