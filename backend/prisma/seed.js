import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

dotenv.config();

const prisma = new PrismaClient();

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

async function main() {
  // user demo
  const pass = await bcrypt.hash("test1234", 10);
  const farmer = await prisma.user.upsert({
    where: { email: "farmer@example.com" },
    update: {},
    create: {
      email: "farmer@example.com",
      passwordHash: pass,
      name: "คุณชาวสวน",
      role: "FARMER",
    },
  });

  // lot demo
  const now = new Date();
  const lotId =
    "LOT-" + now.getFullYear() + "-" + (now.getMonth() + 1).toString().padStart(2, "0") + "-LONGAN-DEMO";

  const lot = await prisma.lot.upsert({
    where: { lotId },
    update: {},
    create: {
      lotId,
      cropType: "ลำไย (Longan)",
      variety: "อีดอ",
      farmName: "สวนลำไยภูพิงค์",
      province: "เชียงใหม่",
      district: "อำเภอฝาง",
      harvestDate: new Date(),
      brix: 20.5,
      moisture: 78.0,
      pesticidePass: true,
      notes: "ล็อตทดสอบสำหรับ CM-AgroTrace",
      ownerId: farmer.id,
      hash: "TEMP",
    },
  });

  // อัปเดต hash
  const hash = computeLotHash(lot);
  await prisma.lot.update({ where: { id: lot.id }, data: { hash } });

  // event แรก (ถ้ายังไม่มี)
  const count = await prisma.event.count({ where: { lotId: lot.id } });
  if (count === 0) {
    await prisma.event.create({
      data: {
        lotId: lot.id,
        type: "HARVEST_CREATED",
        locationName: "ฝาง, เชียงใหม่",
        note: "เริ่มล็อตลำไยตัวอย่าง",
      },
    });
  }

  console.log("✅ Seed completed: farmer@example.com / test1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
