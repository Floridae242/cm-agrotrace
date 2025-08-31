// backend/src/routes/lots.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import auth from "../utils/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

/** GET: ล็อตทั้งหมดของผู้ใช้ที่ล็อกอิน */
router.get("/", auth, async (req, res) => {
  try {
    const lots = await prisma.lot.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(lots);
  } catch (err) {
    console.error("Error fetching lots:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/** GET (public): ข้อมูลล็อต + events ใช้สำหรับสแกน */
router.get("/public/:key", async (req, res) => {
  try {
    const key = req.params.key.trim();
    console.log("🔎 Searching lot with key =", key);

    // ✅ insensitive match
    const lot = await prisma.lot.findFirst({
      where: {
        OR: [
          { lotId: { equals: key, mode: "insensitive" } },
          { id: key },
        ],
      },
    });

    if (!lot) return res.status(404).json({ error: "LOT_NOT_FOUND" });

    const events = await prisma.event.findMany({
      where: { lotId: lot.id },
      orderBy: { createdAt: "asc" },
    });

    res.json({ lot, events });
  } catch (err) {
    console.error("Error fetching public lot:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/** GET QR PNG ของล็อต */
router.get("/:key/qr", async (req, res) => {
  try {
    const key = req.params.key.trim();
    const lot = await prisma.lot.findFirst({
      where: {
        OR: [
          { lotId: { equals: key, mode: "insensitive" } },
          { id: key },
        ],
      },
    });
    if (!lot) return res.status(404).send("NOT_FOUND");

    const base = process.env.FRONTEND_PUBLIC_BASE || "http://localhost:5173";
    const url = `${base}/scan/${encodeURIComponent(lot.lotId)}`;

    const { createQR } = await import("../utils/qrcode.js");
    const png = await createQR(url);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  } catch (err) {
    console.error("Error generating QR:", err);
    res.status(500).send("SERVER_ERROR");
  }
});

/** POST: สร้างล็อตใหม่ */
router.post("/", auth, async (req, res) => {
  try {
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
        hash: payload.hash || "TEMP",
      },
    });

    await prisma.event.create({
      data: {
        lotId: lot.id,
        type: "HARVEST_CREATED",
        locationName: payload.locationName || "",
        note: payload.note || "",
      },
    });

    res.status(201).json(lot);
  } catch (err) {
    console.error("Error creating lot:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/** POST: เพิ่ม event ให้ล็อต */
router.post("/:key/events", auth, async (req, res) => {
  try {
    const key = req.params.key.trim();
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
        note: req.body.note || "",
      },
    });

    res.status(201).json(e);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/** DELETE: ลบล็อต */
router.delete("/:key", auth, async (req, res) => {
  try {
    const key = req.params.key.trim();
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

    if (req.user.role !== "ADMIN" && req.user.id !== lot.ownerId) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    await prisma.event.deleteMany({ where: { lotId: lot.id } });
    await prisma.lot.delete({ where: { id: lot.id } });

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting lot:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

export default router;
