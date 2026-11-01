const admin = require("firebase-admin");

if (!admin.apps.length) {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;
  const explicitCredentials = [
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  ];
  const hasPartialCredentials =
    explicitCredentials.some(Boolean) && !explicitCredentials.every(Boolean);

  if (explicitCredentials.every(Boolean)) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    if (hasPartialCredentials)
      console.warn(
        "Incomplete explicit Firebase credentials found; using GOOGLE_APPLICATION_CREDENTIALS.",
      );
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    throw new Error(
      "Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }
}

module.exports = admin;
