const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "userAuthBearer";
const LEGACY_AUTH_COOKIE_NAME = "token";

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

const getAuthCookieOptions = (extra = {}) => {
  const secure = parseBoolean(
    process.env.AUTH_COOKIE_SECURE,
    process.env.NODE_ENV === "production",
  );
  const sameSite = (process.env.AUTH_COOKIE_SAME_SITE ||
    (secure ? "none" : "lax")).toLowerCase();

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    ...(process.env.AUTH_COOKIE_DOMAIN
      ? { domain: process.env.AUTH_COOKIE_DOMAIN }
      : {}),
    ...extra,
  };
};

const getAuthCookieClearOptions = () => {
  const { httpOnly, secure, sameSite, path, domain } =
    getAuthCookieOptions();
  return { httpOnly, secure, sameSite, path, ...(domain ? { domain } : {}) };
};

module.exports = {
  AUTH_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getAuthCookieClearOptions,
};
