// backend/src/routes/lots.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import auth from "../utils/auth.js"; // middleware ยืนยัน JWT (ต้องมี req.user)

const prisma = new PrismaClient();
const router = express.Router();

/** GET: ทั้งหมดของผู้ใช้ที่ล็อกอิน */
router.get("/", auth, async (req, res) => {
  const lots = await prisma.lot.findMany({
    where: { ownerId: req.user.id },
    orderBy: { createdAt: "desc" }
  });
  res.json(lots);
});

/** GET (public): ใช้ในหน้า scan ด้วย lotId (อ่านอย่างเดียว) */
router.get("/public/:lotId", async (req, res) => {
  const lot = await prisma.lot.findUnique({ where: { lotId: req.params.lotId } });
  if (!lot) return res.status(404).json({ error: "LOT_NOT_FOUND" });

  const events = await prisma.event.findMany({
    where: { lotId: lot.id },
    orderBy: { createdAt: "asc" }
  });
  res.json({ lot, events });
});

/** GET QR PNG */
router.get("/:lotId/qr", async (req, res) => {
  const lot = await prisma.lot.findUnique({ where: { lotId: req.params.lotId } });
  if (!lot) return res.status(404).send("NOT_FOUND");
  // gen QR (อิง FRONEND_PUBLIC_BASE)
  const base = process.env.FRONTEND_PUBLIC_BASE || "http://localhost:5173";
  const url = `${base}/scan/${encodeURIComponent(lot.lotId)}`;

  // สร้าง PNG ด้วย qrcode
  const { createQR } = await import("../utils/qrcode.js");
  const png = await createQR(url);
  res.setHeader("Content-Type", "image/png");
  res.send(png);
});

/** POST: สร้างล็อตใหม่ */
router.post("/", auth, async (req, res) => {
  const payload = req.body || {};
  const lot = await prisma.lot.create({
    data: {
      lotId: payload.lotId,
      cropType: payload.cropType,
      variety: payload.variety || "",
      farmName: payload.farmName || "",
      province: payload.province || "",
      district: payload.district || "",
      harvestDate: payload.harvestDate ? new Date(payload.harvestDate) : new Date(),
      brix: payload.brix ?? null,
      moisture: payload.moisture ?? null,
      pesticidePass: payload.pesticidePass ?? null,
      notes: payload.notes || "",
      ownerId: req.user.id,
      hash: payload.hash || "TEMP"
    }
  });
  // สร้าง event แรก
  await prisma.event.create({
    data: {
      lotId: lot.id,
      type: "HARVEST_CREATED",
      locationName: payload.locationName || "",
      note: payload.note || ""
    }
  });
  res.status(201).json(lot);
});

/** PATCH: เพิ่ม event ให้ล็อต (เจ้าของหรือแอดมินเท่านั้น) */
router.post("/:lotId/events", auth, async (req, res) => {
  const lot = await prisma.lot.findUnique({
    where: { lotId: req.params.lotId },
    select: { id: true, ownerId: true }
  });
  if (!lot) return res.status(404).json({ error: "LOT_NOT_FOUND" });

  if (req.user.role !== "ADMIN" && req.user.id !== lot.ownerId) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const e = await prisma.event.create({
    data: {
      lotId: lot.id,
      type: req.body.type,
      locationName: req.body.locationName || "",
      locationFrom: req.body.locationFrom || "",
      locationTo: req.body.locationTo || "",
      tempC: req.body.tempC ?? null,
      humidityPct: req.body.humidityPct ?? null,
      note: req.body.note || ""
    }
  });

  res.status(201).json(e);
});

/** ⛔️ DELETE: ลบล็อต (ใหม่) — เจ้าของล็อตหรือแอดมินเท่านั้น  */
router.delete("/:lotId", auth, async (req, res) => {
  const lot = await prisma.lot.findUnique({
    where: { lotId: req.params.lotId },
    select: { id: true, ownerId: true }
  });
  if (!lot) return res.status(404).json({ error: "LOT_NOT_FOUND" });

  // ตรวจสิทธิ์
  if (req.user.role !== "ADMIN" && req.user.id !== lot.ownerId) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  // ลบ event ทั้งหมดของล็อตนี้ก่อน (ถ้า schema ไม่ได้ตั้ง onDelete: Cascade)
  await prisma.event.deleteMany({ where: { lotId: lot.id } });

  // ลบ lot
  await prisma.lot.delete({ where: { id: lot.id } });

  return res.status(204).send();
});

export default router;

