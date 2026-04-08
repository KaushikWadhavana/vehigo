const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "vehigo-b62e5.appspot.com", // ✅ REQUIRED
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };
