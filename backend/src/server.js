// backend/src/server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import QRCode from "qrcode";
import { PrismaClient } from "@prisma/client";
import { register } from "./controllers/auth.controller.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const FRONTEND_PUBLIC_BASE =
  (process.env.FRONTEND_PUBLIC_BASE || "http://localhost:5173").replace(/\/$/, "");

/* ---------- middleware ---------- */
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

/* ---------- helpers ---------- */
function computeLotHash(l) {
  const obj = {
    lotId: l.lotId,
    cropType: l.cropType,
    variety: l.variety || "",
    farmName: l.farmName || "",
    province: l.province || "",
    district: l.district || "",
    harvestDate: new Date(l.harvestDate).toISOString(),
    brix: l.brix ?? null,
    moisture: l.moisture ?? null,
    pesticidePass: l.pesticidePass ?? null,
    ownerId: l.ownerId,
  };
  const json = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash("sha256").update(json).digest("hex");
}

function signToken(user) {
  return jwt.sign(
    { uid: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function auth(req, res, next) {
  const authz = req.headers.authorization || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

/* ---------- health ---------- */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/* ---------- auth ---------- */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ error: "missing fields" });

+   const exists = await prisma.user.findUnique({ where: { email } });
+   if (exists) return res.status(409).json({ error: "email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
-     data: { email, password: hash, name, role: role || "FARMER" },
+     data: { email, passwordHash: hash, name, role: role || "FARMER" },
+     select: { id: true, email: true, name: true, role: true }
    });
-   const token = signToken(user);
+   const token = signToken(user);
    res.json({
      token,
-     user: { id: user.id, email: user.email, name: user.name, role: user.role },
+     user
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "registration failed", detail: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid credentials" });
- const ok = await bcrypt.compare(password, user.password);
+ const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });
  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

app.get("/api/me", auth, async (req, res) => {
  const u = await prisma.user.findUnique({ where: { id: req.user.uid } });
  res.json({ id: u.id, email: u.email, name: u.name, role: u.role });
});

/* =========================================================
   PUBLIC routes
   ========================================================= */

// public lot (ค้นได้ทั้ง lotId หรือ id)
app.get("/api/lots/public/:key", async (req, res) => {
  try {
    const key = (req.params.key || "").trim();
    const lot = await prisma.lot.findFirst({
      where: {
        OR: [
          { lotId: { equals: key, mode: "insensitive" } },
          { id: key },
        ],
      },
    });
    if (!lot) return res.status(404).json({ error: "not found" });

    const events = await prisma.event.findMany({
      where: { lotId: lot.id },
      orderBy: { timestamp: "asc" },
    });

    res.json({ lot, events });
  } catch (e) {
    console.error("public lot error:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// รูป QR (PNG) — public
app.get("/api/lots/:lotId/qr", async (req, res) => {
  try {
    const lotId = req.params.lotId;
    const url = `${FRONTEND_PUBLIC_BASE}/scan/${encodeURIComponent(lotId)}`;

    const png = await QRCode.toBuffer(url, { type: "png", margin: 1, width: 256 });
    res.set({
      "Content-Type": "image/png",
      "Content-Length": png.length,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Disposition": 'inline; filename="qr.png"',
    });
    res.send(png);
  } catch (e) {
    console.error("qr error:", e);
    res.status(500).end();
  }
});

/* =========================================================
   PROTECTED routes
   ========================================================= */

app.post("/api/lots", auth, async (req, res) => {
  try {
    const {
      lotId,
      cropType,
      variety,
      farmName,
      province,
      district,
      harvestDate,
      brix,
      moisture,
      pesticidePass,
      notes,
    } = req.body;

    if (!cropType || !harvestDate)
      return res
        .status(400)
        .json({ error: "cropType and harvestDate are required" });

    const generatedLotId =
      lotId && lotId.trim().length
        ? lotId.trim()
        : `LOT-${Date.now().toString(36).toUpperCase()}`;

    const lotDraft = {
      lotId: generatedLotId,
      cropType,
      variety,
      farmName,
      province,
      district,
      harvestDate: new Date(harvestDate),
      brix: brix ?? null,
      moisture: moisture ?? null,
      pesticidePass:
        typeof pesticidePass === "boolean" ? pesticidePass : null,
      notes: notes || "",
      ownerId: req.user.uid,
      hash: "",
    };

    lotDraft.hash = computeLotHash(lotDraft);
    const lot = await prisma.lot.create({ data: lotDraft });

    await prisma.event.create({
      data: {
        lotId: lot.id,
        type: "HARVEST_CREATED",
        timestamp: new Date(),
        locationName: lot.district
          ? `${lot.district}, ${lot.province || ""}`.trim()
          : lot.province || "",
        fromName: null,
        toName: null,
        temperature: null,
        humidity: null,
        note: "สร้างล็อตผลผลิต",
      },
    });

    res.json(lot);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "failed to create lot", detail: e.message });
  }
});

app.get("/api/lots", auth, async (req, res) => {
  const where = req.user.role === "ADMIN" ? {} : { ownerId: req.user.uid };
  const lots = await prisma.lot.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  res.json(lots);
});

app.get("/api/lots/:lotId", auth, async (req, res) => {
  const lotIdParam = req.params.lotId;
  const lot = await prisma.lot.findFirst({
    where: { lotId: lotIdParam },
    include: { events: { orderBy: { timestamp: "asc" } } },
  });
  if (!lot) return res.status(404).json({ error: "not found" });
  if (req.user.role !== "ADMIN" && lot.ownerId !== req.user.uid)
    return res.status(403).json({ error: "forbidden" });
  res.json(lot);
});

app.post("/api/lots/:lotId/events", auth, async (req, res) => {
  try {
    const lot = await prisma.lot.findFirst({
      where: { lotId: req.params.lotId },
    });
    if (!lot) return res.status(404).json({ error: "lot not found" });
    if (req.user.role !== "ADMIN" && lot.ownerId !== req.user.uid)
      return res.status(403).json({ error: "forbidden" });

    const {
      type,
      locationName,
      fromName,
      toName,
      temperature,
      humidity,
      note,
      timestamp,
    } = req.body;

    const event = await prisma.event.create({
      data: {
        lotId: lot.id,
        type,
        locationName: locationName || null,
        fromName: fromName || null,
        toName: toName || null,
        temperature: typeof temperature === "number" ? temperature : null,
        humidity: typeof humidity === "number" ? humidity : null,
        note: note || null,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      },
    });
    res.json(event);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "failed to add event", detail: e.message });
  }
});

// delete lot (รับทั้ง lotId หรือ id)
app.delete("/api/lots/:key", auth, async (req, res) => {
  try {
    const key = (req.params.key || "").trim();
    const lot = await prisma.lot.findFirst({
      where: {
        OR: [
          { lotId: { equals: key, mode: "insensitive" } },
          { id: key },
        ],
      },
      select: { id: true, ownerId: true },
    });
    if (!lot) return res.status(404).json({ error: "LOT_NOT_FOUND" });

    if (req.user.role !== "ADMIN" && req.user.uid !== lot.ownerId) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    await prisma.event.deleteMany({ where: { lotId: lot.id } });
    await prisma.lot.delete({ where: { id: lot.id } });

    return res.json({ ok: true });
  } catch (e) {
    console.error("delete lot error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ---------- start ---------- */
app.listen(PORT, () => {
  console.log(`CM-AgroTrace backend listening on :${PORT}`);
});
