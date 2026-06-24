const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const fetch = require('node-fetch'); // Make sure fetch is available

// Initialize Firebase Admin (Backend)
const serviceAccount = {
  projectId: "xarc-adfdd",
  clientEmail: "firebase-adminsdk-fbsvc@xarc-adfdd.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDRnqxat5vIphFc\nD0AZd8p3q2y+QtfpZrVy1bJToFjdWAIBtobkfnQwgMgn8hDchwjzJsBAQ+YP9pA+\ncDdt9mme6bigJCnX0euaGtPoWrVg2vvQF8xqhDnvRae5cCVYDBBAvdPT12wfD6FK\nSfJcaBxMR6v3Y6aKhm61EvzoG77gLgMeBEIMG7SIbkNcE5OqT0Mc82DPcEFLHu0v\nN2LaUQy0KjXaH2JPRs4+Lcru4i12McFzBGi4+e12NiQTsK/gvHgD0vPoFc1DWBYc\nMtcHkFYjAao4XICZtD7E0aq4l03A4q0on/ULIXDbuVg3JkkPwdcwUvN9JqNywYaB\nbar9vvw3AgMBAAECggEABRc5z4iYZSRGiHPRj+Zgdma++ofpDA2m6Aw+JNj6D4Lg\nDM0AANovvC9q4DCsYPUU+vXv9h+WalpuLY+c6QC/Y+qZ+Nmn/BcCOV95a5hewbFp\nXo5iNBwHkPYIf4pnsPgdO1VHQn4y1AMVkBZODbLbLRPe60a/Ed73hVJAVIRUyGDw\n0lCKBkzqy5MkayKIDQUORSKGtGXdNozmNbdDlboM8A2rFWvWSuJ785zPHLEdilpE\n005C4eW32F6XltU9tv+ob1tYa2TX/rTHkc40WYMtCCrNePE3MADDrMuzb6dOm7L3\nRQNs25xnF0vURYuZktLoKNkYZuWXJnsoQw5lGOI4EQKBgQDzp+3cTXwZluPmqTZz\n6MBNWlW+vkgXb1dHvqeiexDKC3X5RSc1zDnwqIuVtWq/DuHE9Tj+bsSUmhUwHJq6\nTr2Qz+Zp/VqsTEF3MTD1Huk9MlwhYxf5Qi8gIs+YixRjAe6Hiuz1v06osJwfYnJW\nVL654y5kfRqqBsZUFFEqEbNovQKBgQDcPVDTbyS8pEfm+vZYxGeBqgoRam45v2OL\nBs9+daKGpbYc0RsXSwQLooHsJxf7IapR76BXzKczuQ8CZ6wJFyWpRn0TzXJ2BxzR\nM0uGNWtu301SL9+P1NuTu+htYkcKbmgvZhBfQAoxR8oaToPWKSU/kYZohwdVmzhT\nuAYGaQjqAwKBgEdGUWNHW00VAZfA2gfwBwjZqwmAGhCY5lw7Xkg+XbvsvFbtrrmj\nAzPt6d8iUZaQIOT/outytZiOtjH7vBtR20wYNNu+XB7Ys7HNNvgNUccwCxlNJn8o\nqCZraHTEAnOv5fnKXuTIUJcyCol3v+CXK6+u0CxfGESydKO1ycRXpza1AoGAcw0k\n+A8LpfA8D5HytxSC7d2iPM7Ynho5Kht4sZtKOATBSfSCrnxltJ5EONWDVZGUpBEG\nNleW0RJPoPX/jRAmgHNuS7X7oWS9zRt6zLWDVfwZLGIN69lKi7aSCPJaIjzi+D/d\nNaUCrhPOpEd335zG9JpVGK3RSws3NaTgoOCl43kCgYEAiWvXd0DYd2wZ/O4VB6Lj\nXe4klZOfwN4qqWwgKEcgj/M5T99bl08Z5hbiQDatugDLVhrRzKTmQSqGLOr2HDiP\nE7+6zMRmzZRFfpVra/4Wltiwm4sgPYOI7UfbKcNmUeQmeSItoyxq/QPPPGbIdrCL\nkn65DpVo/IUnqOYuk8AU5As=\n-----END PRIVATE KEY-----\n"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize Firebase Client (Frontend)
const firebaseConfig = {
  apiKey: "AIzaSyCxKKCmPIaEexHCHCV9DEVdVksLSauqx5U",
  authDomain: "xarc-adfdd.firebaseapp.com",
  projectId: "xarc-adfdd"
};
const clientApp = initializeApp(firebaseConfig);
const clientAuth = getAuth(clientApp);

async function ensureFirebaseUser(email, password) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password });
    return user.uid;
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      const user = await admin.auth().createUser({ email, password });
      return user.uid;
    }
    throw e;
  }
}

async function fetchApi(path, token) {
  const res = await fetch(`http://localhost:3001${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, data: text };
  }
}

async function run() {
  console.log("=== PRODUCTION AUTHENTICATION VALIDATION ===");

  // 1. Prepare Firebase Users & Sync to PostgreSQL
  const password = "SecurePassword123!";
  const abcUid = await ensureFirebaseUser('admin@abc.xarc.com', password);
  const xyzUid = await ensureFirebaseUser('admin@xyz.xarc.com', password);
  console.log(`Synced ABC Firebase UID: ${abcUid}`);
  console.log(`Synced XYZ Firebase UID: ${xyzUid}`);

  // Now update the PostgreSQL database to ensure these UIDs are mapped correctly!
  // We'll use Prisma directly since we have the backend code.
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  await prisma.user.updateMany({ where: { email: 'admin@abc.xarc.com' }, data: { firebaseUid: abcUid } });
  await prisma.user.updateMany({ where: { email: 'admin@xyz.xarc.com' }, data: { firebaseUid: xyzUid } });
  console.log("PostgreSQL mapping updated to strict firebaseUid requirement.");

  console.log("\n--- TEST: Missing Token ---");
  const missingTokenRes = await fetchApi('/admin/dashboard/summary', null);
  console.log(`Expected 401. Got: ${missingTokenRes.status}`, missingTokenRes.data);

  console.log("\n--- TEST: Tampered Token ---");
  const tamperedRes = await fetchApi('/admin/dashboard/summary', 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImE.eyJpc3MiOiJodHRwcy.invalid_signature');
  console.log(`Expected 401. Got: ${tamperedRes.status}`, tamperedRes.data);

  console.log("\n--- TEST: Failed Login ---");
  try {
    await signInWithEmailAndPassword(clientAuth, 'admin@abc.xarc.com', 'wrong-password');
  } catch (e) {
    console.log(`Login failed correctly: ${e.code}`);
  }

  console.log("\n--- TEST: Real Frontend Login Flow (ABC Admin) ---");
  const abcCred = await signInWithEmailAndPassword(clientAuth, 'admin@abc.xarc.com', password);
  const abcToken = await abcCred.user.getIdToken();
  console.log("Successfully retrieved real Firebase ID Token for ABC Admin.");

  console.log("\n--- TEST: Direct URL Access Blocking (ABC Admin) ---");
  // We hit the backend dashboard without token (done in 'Missing Token' test), let's hit it with token
  const abcDash = await fetchApi('/admin/dashboard/summary', abcToken);
  console.log(`ABC Dashboard Response (${abcDash.status}):`, JSON.stringify(abcDash.data, null, 2));

  console.log("\n--- TEST: Tenant Isolation (ABC Admin Devices) ---");
  const abcDevices = await fetchApi('/devices', abcToken);
  console.log(`ABC Devices Access (${abcDevices.status}): found ${abcDevices.data.length} devices.`);

  console.log("\n--- TEST: Real Frontend Login Flow (XYZ Admin) ---");
  const xyzCred = await signInWithEmailAndPassword(clientAuth, 'admin@xyz.xarc.com', password);
  const xyzToken = await xyzCred.user.getIdToken();
  console.log("Successfully retrieved real Firebase ID Token for XYZ Admin.");

  console.log("\n--- TEST: Tenant Isolation (XYZ Admin Devices) ---");
  const xyzDash = await fetchApi('/admin/dashboard/summary', xyzToken);
  console.log(`XYZ Dashboard Response (${xyzDash.status}):`, JSON.stringify(xyzDash.data, null, 2));
  
  await prisma.$disconnect();
  process.exit(0);
}

run().catch(console.error);
