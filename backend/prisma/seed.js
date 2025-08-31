import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Users
  const pass = await bcrypt.hash("test1234", 10);
  const farmer = await prisma.user.upsert({
    where: { email: "farmer@example.com" },
    update: {},
    create: { email: "farmer@example.com", password: pass, name: "คุณชาวสวน", role: "FARMER" }
  });

  // Create a demo longan lot
  const now = new Date();
  const lotId = "LOT-" + now.getFullYear() + "-" + (now.getMonth()+1).toString().padStart(2, "0") + "-LONGAN-DEMO";
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
      hash: "TEMP"
    }
  });

  // compute & update hash (same logic as server)
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
      ownerId: l.ownerId
    };
    const json = JSON.stringify(obj, Object.keys(obj).sort());
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(json).digest("hex");
  }

  const hash = await computeLotHash(lot);
  await prisma.lot.update({ where: { id: lot.id }, data: { hash } });

  // Event seed
  await prisma.event.create({
    data: {
      lotId: lot.id,
      type: "HARVEST_CREATED",
      locationName: "ฝาง, เชียงใหม่",
      note: "เริ่มล็อตลำไยตัวอย่าง"
    }
  });

  console.log("Seed completed: farmer login farmer@example.com / test1234");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});

