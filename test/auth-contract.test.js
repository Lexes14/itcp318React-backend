const assert = require("node:assert/strict");
const test = require("node:test");

const {
  AUTH_COOKIE_NAME,
  getAuthCookieClearOptions,
  getAuthCookieOptions,
} = require("../config/authCookie");
const { getAuthToken } = require("../utils/authToken");

test("uses the final HttpOnly cookie name and shared clear attributes", () => {
  assert.equal(AUTH_COOKIE_NAME, "userAuthBearer");

  const options = getAuthCookieOptions();
  const clearOptions = getAuthCookieClearOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.path, "/");
  assert.equal(clearOptions.path, options.path);
  assert.equal(clearOptions.sameSite, options.sameSite);
  assert.equal(clearOptions.secure, options.secure);
});

test("prefers the new cookie, accepts the legacy cookie, and falls back to Bearer", () => {
  assert.equal(
    getAuthToken({
      cookies: { userAuthBearer: "cookie-token", token: "legacy-token" },
      headers: { authorization: "Bearer header-token" },
    }),
    "cookie-token",
  );
  assert.equal(
    getAuthToken({
      cookies: { token: "legacy-token" },
      headers: { authorization: "Bearer header-token" },
    }),
    "legacy-token",
  );
  assert.equal(
    getAuthToken({
      cookies: {},
      headers: { authorization: "Bearer header-token" },
    }),
    "header-token",
  );
});
