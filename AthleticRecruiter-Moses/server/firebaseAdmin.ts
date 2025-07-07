// firebaseAdmin.ts
import admin from "firebase-admin";

const serviceAccount = {
  projectId: "recruittrack-a600b",
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  // replace literal `\n` sequences with real newlines:
  privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  ),
};

if (
  !serviceAccount.projectId ||
  !serviceAccount.clientEmail ||
  !serviceAccount.privateKey
) {
  console.error("🔥 Missing Firebase Admin credentials! Check your env-vars.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.projectId,
});

console.log(
  "✅ Firebase Admin initialized for project:",
  serviceAccount.projectId,
);

export default admin;
