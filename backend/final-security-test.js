const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const fetch = require('node-fetch');

// Initialize Admin
const serviceAccount = {
  projectId: "xarc-adfdd",
  clientEmail: "firebase-adminsdk-fbsvc@xarc-adfdd.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDRnqxat5vIphFc\nD0AZd8p3q2y+QtfpZrVy1bJToFjdWAIBtobkfnQwgMgn8hDchwjzJsBAQ+YP9pA+\ncDdt9mme6bigJCnX0euaGtPoWrVg2vvQF8xqhDnvRae5cCVYDBBAvdPT12wfD6FK\nSfJcaBxMR6v3Y6aKhm61EvzoG77gLgMeBEIMG7SIbkNcE5OqT0Mc82DPcEFLHu0v\nN2LaUQy0KjXaH2JPRs4+Lcru4i12McFzBGi4+e12NiQTsK/gvHgD0vPoFc1DWBYc\nMtcHkFYjAao4XICZtD7E0aq4l03A4q0on/ULIXDbuVg3JkkPwdcwUvN9JqNywYaB\nbar9vvw3AgMBAAECggEABRc5z4iYZSRGiHPRj+Zgdma++ofpDA2m6Aw+JNj6D4Lg\nDM0AANovvC9q4DCsYPUU+vXv9h+WalpuLY+c6QC/Y+qZ+Nmn/BcCOV95a5hewbFp\nXo5iNBwHkPYIf4pnsPgdO1VHQn4y1AMVkBZODbLbLRPe60a/Ed73hVJAVIRUyGDw\n0lCKBkzqy5MkayKIDQUORSKGtGXdNozmNbdDlboM8A2rFWvWSuJ785zPHLEdilpE\n005C4eW32F6XltU9tv+ob1tYa2TX/rTHkc40WYMtCCrNePE3MADDrMuzb6dOm7L3\nRQNs25xnF0vURYuZktLoKNkYZuWXJnsoQw5lGOI4EQKBgQDzp+3cTXwZluPmqTZz\n6MBNWlW+vkgXb1dHvqeiexDKC3X5RSc1zDnwqIuVtWq/DuHE9Tj+bsSUmhUwHJq6\nTr2Qz+Zp/VqsTEF3MTD1Huk9MlwhYxf5Qi8gIs+YixRjAe6Hiuz1v06osJwfYnJW\nVL654y5kfRqqBsZUFFEqEbNovQKBgQDcPVDTbyS8pEfm+vZYxGeBqgoRam45v2OL\nBs9+daKGpbYc0RsXSwQLooHsJxf7IapR76BXzKczuQ8CZ6wJFyWpRn0TzXJ2BxzR\nM0uGNWtu301SL9+P1NuTu+htYkcKbmgvZhBfQAoxR8oaToPWKSU/kYZohwdVmzhT\nuAYGaQjqAwKBgEdGUWNHW00VAZfA2gfwBwjZqwmAGhCY5lw7Xkg+XbvsvFbtrrmj\nAzPt6d8iUZaQIOT/outytZiOtjH7vBtR20wYNNu+XB7Ys7HNNvgNUccwCxlNJn8o\nqCZraHTEAnOv5fnKXuTIUJcyCol3v+CXK6+u0CxfGESydKO1ycRXpza1AoGAcw0k\n+A8LpfA8D5HytxSC7d2iPM7Ynho5Kht4sZtKOATBSfSCrnxltJ5EONWDVZGUpBEG\nNleW0RJPoPX/jRAmgHNuS7X7oWS9zRt6zLWDVfwZLGIN69lKi7aSCPJaIjzi+D/d\nNaUCrhPOpEd335zG9JpVGK3RSws3NaTgoOCl43kCgYEAiWvXd0DYd2wZ/O4VB6Lj\nXe4klZOfwN4qqWwgKEcgj/M5T99bl08Z5hbiQDatugDLVhrRzKTmQSqGLOr2HDiP\nE7+6zMRmzZRFfpVra/4Wltiwm4sgPYOI7UfbKcNmUeQmeSItoyxq/QPPPGbIdrCL\nkn65DpVo/IUnqOYuk8AU5As=\n-----END PRIVATE KEY-----\n"
};
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Initialize Client
const clientApp = initializeApp({
  apiKey: "AIzaSyCxKKCmPIaEexHCHCV9DEVdVksLSauqx5U",
  authDomain: "xarc-adfdd.firebaseapp.com",
  projectId: "xarc-adfdd"
});
const clientAuth = getAuth(clientApp);

async function ensureUser(email, password, role, orgId) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password, disabled: false });
    return user.uid;
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      const user = await admin.auth().createUser({ email, password });
      return user.uid;
    }
    throw e;
  }
}

async function fetchApi(path, token, method='GET', body=null, extraHeaders={}) {
  const headers = { ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  
  const res = await fetch(`http://localhost:3001${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch(e) {
    return { status: res.status, data: text };
  }
}

async function run() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const password = "SecurePassword123!";
  const abcUid = await ensureUser('admin@abc.xarc.com', password);
  const traineeUid = await ensureUser('trainee@abc.xarc.com', password);
  
  // Sync in DB
  await prisma.user.updateMany({ where: { email: 'trainee@abc.xarc.com' }, data: { firebaseUid: traineeUid } });

  console.log("=== TEST 1 & 2: REVOCATION AND DISABLED USERS ===");
  const abcCred = await signInWithEmailAndPassword(clientAuth, 'admin@abc.xarc.com', password);
  const abcToken = await abcCred.user.getIdToken();
  console.log("Got valid token for admin@abc.xarc.com");
  
  // Verify token works
  let res = await fetchApi('/admin/dashboard/summary', abcToken);
  console.log(`Initial access: HTTP ${res.status}`);

  // Disable and Revoke
  await admin.auth().updateUser(abcUid, { disabled: true });
  await admin.auth().revokeRefreshTokens(abcUid);
  console.log("User disabled and tokens revoked in Firebase Admin.");

  // Test access again with the SAME token
  res = await fetchApi('/admin/dashboard/summary', abcToken);
  console.log(`Access after revocation: HTTP ${res.status}`);
  if (res.status === 401) {
    console.log("✅ SUCCESS: Revoked/disabled user token correctly blocked!");
  }

  // Restore User
  await admin.auth().updateUser(abcUid, { disabled: false });
  // Need a new token because the old one is revoked
  const newAbcCred = await signInWithEmailAndPassword(clientAuth, 'admin@abc.xarc.com', password);
  const newAbcToken = await newAbcCred.user.getIdToken();

  console.log("\n=== TEST 3: FAKE SESSION COOKIE ===");
  const fakeSessionRes = await fetchApi('/admin/dashboard/summary', null, 'GET', null, {
    'Cookie': '__session=fake-session-token'
  });
  console.log(`Attempt with fake cookie but no Bearer token: HTTP ${fakeSessionRes.status}`);
  if (fakeSessionRes.status === 401) console.log("✅ SUCCESS: Backend rejected fake cookie!");

  console.log("\n=== TEST 4: CROSS-TENANT ACCESS ATTACK ===");
  const crossRes = await fetchApi('/admin/dashboard/summary?organizationId=ORG-XYZ-001', newAbcToken);
  console.log(`ABC user requesting XYZ org ID. Response HTTP ${crossRes.status}`);
  // If it returned 200, check the licenseQuota (ABC has 3, XYZ has 2 in previous tests)
  console.log(`Data returned:`, crossRes.data);
  if (crossRes.data.totalLicensedPCs === 3) {
    console.log("✅ SUCCESS: Backend ignored the ?organizationId=ORG-XYZ-001 query param and returned ABC data!");
  }

  console.log("\n=== TEST 5: ROLE ESCALATION ATTACK ===");
  const traineeCred = await signInWithEmailAndPassword(clientAuth, 'trainee@abc.xarc.com', password);
  const traineeToken = await traineeCred.user.getIdToken();
  
  const roleRes = await fetchApi('/admin/users', traineeToken, 'POST', { role: "ADMIN" });
  console.log(`Trainee attempting to access /admin/users with payload {role: "ADMIN"}: HTTP ${roleRes.status}`);
  if (roleRes.status === 403) console.log("✅ SUCCESS: Trainee blocked with 403 Forbidden!");

  console.log("\n=== TEST 6: AGENT SECURITY VALIDATION ===");
  const { io } = require("socket.io-client");
  const socket = io("ws://localhost:3001", {
    auth: { agentKey: "wrong-key" },
    reconnection: false
  });
  
  socket.on("connect", () => console.log("Agent Connected (Should not happen!)"));
  socket.on("connect_error", (err) => console.log(`Agent Connection Error: ${err.message}`));
  socket.on("disconnect", () => {
    console.log("✅ SUCCESS: Agent disconnected forcefully due to wrong key!");
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 5000);
}

run().catch(console.error);
