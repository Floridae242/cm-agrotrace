// backend/src/routes/lots.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import auth from "../utils/auth.js"; // ต้องมี middleware นี้อยู่แล้ว

const prisma = new PrismaClient();
const router = express.Router();

/** ลิสต์ล็อตของผู้ใช้ที่ล็อกอิน */
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

/** public: อ่านล็อต + เหตุการณ์ (ใช้บนหน้า scan/รายละเอียด) */
router.get("/public/:key", async (req, res) => {
  try {
    const keyRaw = req.params.key ?? "";
    const key = keyRaw.trim();
    console.log("👉 /public key =", JSON.stringify(keyRaw), "→", key);

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
      orderBy: { timestamp: "asc" }, // สคีมาคุณใช้ timestamp
    });

    res.json({ lot, events });
  } catch (err) {
    console.error("Error fetching public lot:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/** รูป QR ของล็อต (PNG) */
router.get("/:key/qr", async (req, res) => {
  try {
    const key = (req.params.key ?? "").trim();

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

/** สร้างล็อตใหม่ (แนบ event แรกให้ด้วย) */
router.post("/", auth, async (req, res) => {
  try {
    const p = req.body || {};
    const lot = await prisma.lot.create({
      data: {
        lotId: p.lotId,
        cropType: p.cropType,
        variety: p.variety || "",
        farmName: p.farmName || "",
        province: p.province || "",
        district: p.district || "",
        harvestDate: p.harvestDate ? new Date(p.harvestDate) : new Date(),
        brix: p.brix ?? null,
        moisture: p.moisture ?? null,
        pesticidePass: p.pesticidePass ?? null,
        notes: p.notes || "",
        ownerId: req.user.id,
        hash: p.hash || "TEMP",
      },
    });

    await prisma.event.create({
      data: {
        lotId: lot.id,
        type: "HARVEST_CREATED",
        timestamp: new Date(),
        locationName: p.locationName || "",
        fromName: null,
        toName: null,
        temperature: null,
        humidity: null,
        note: p.note || "",
      },
    });

    res.status(201).json(lot);
  } catch (err) {
    console.error("Error creating lot:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/** เพิ่มเหตุการณ์ให้ล็อต */
router.post("/:key/events", auth, async (req, res) => {
  try {
    const key = (req.params.key ?? "").trim();
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

    const p = req.body || {};
    const evt = await prisma.event.create({
      data: {
        lotId: lot.id,
        type: p.type,
        timestamp: p.timestamp ? new Date(p.timestamp) : new Date(),
        locationName: p.locationName || "",
        fromName: p.fromName || null,
        toName: p.toName || null,
        temperature: p.temperature ?? null,
        humidity: p.humidity ?? null,
        note: p.note || "",
      },
    });

    res.status(201).json(evt);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/** ลบล็อต (ลบ event ที่เกี่ยวข้องก่อน) */
router.delete("/:key", auth, async (req, res) => {
  try {
    const key = (req.params.key ?? "").trim();
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
