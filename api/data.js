const { MongoClient } = require("mongodb");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Reuse the MongoDB connection across warm serverless invocations.
let cachedClientPromise = null;
function getClient() {
  if (!cachedClientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    cachedClientPromise = client.connect();
  }
  return cachedClientPromise;
}

async function verifyUid(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("missing-token");
  }
  const idToken = authHeader.slice(7);
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded.uid;
}

function isUsableEntry(e) {
  return !!e && typeof e.percentage === "number" && !isNaN(e.percentage) && !!e.timestamp && !isNaN(new Date(e.timestamp).getTime());
}
function isUsableDevice(d) {
  return !!d && typeof d.id === "string" && typeof d.name === "string";
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  let uid;
  try {
    uid = await verifyUid(req.headers.authorization);
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let client;
  try {
    client = await getClient();
  } catch (e) {
    console.error("mongo connect failed", e);
    res.status(500).json({ error: "Database connection failed" });
    return;
  }

  const collection = client.db("CellTrace").collection("backups");

  try {
    if (req.method === "GET") {
      const doc = await collection.findOne({ uid });
      const devices = doc && Array.isArray(doc.devices) ? doc.devices.filter(isUsableDevice) : [];
      const entries = doc && Array.isArray(doc.entries) ? doc.entries.filter(isUsableEntry) : [];
      res.status(200).json({ devices, entries, updatedAt: doc ? doc.updatedAt : null });
      return;
    }

    if (req.method === "POST") {
      // Vercel auto-parses JSON bodies for Node.js functions, but guard against
      // it arriving as a raw string just in case.
      let parsed = req.body;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed || "{}"); } catch (e) { parsed = {}; }
      }
      parsed = parsed || {};
      const devices = (Array.isArray(parsed.devices) ? parsed.devices : []).filter(isUsableDevice);
      const entries = (Array.isArray(parsed.entries) ? parsed.entries : []).filter(isUsableEntry);
      const updatedAt = new Date().toISOString();
      await collection.updateOne(
        { uid },
        { $set: { uid, devices, entries, updatedAt } },
        { upsert: true }
      );
      res.status(200).json({ devices, entries, updatedAt });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("handler error", e);
    res.status(500).json({ error: "Server error" });
  }
};
