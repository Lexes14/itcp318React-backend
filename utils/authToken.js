const {
  AUTH_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
} = require("../config/authCookie");

const getAuthToken = (req) => {
  const header = req.headers?.authorization;
  return (
    req.cookies?.[AUTH_COOKIE_NAME] ||
    req.cookies?.[LEGACY_AUTH_COOKIE_NAME] ||
    (header?.startsWith("Bearer ") ? header.slice(7) : null)
  );
};

module.exports = { getAuthToken };
