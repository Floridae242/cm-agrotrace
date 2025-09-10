import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name || "",
        email,
        passwordHash: hash,   // ⚠️ ต้องตรงกับ schema.prisma (เช็กว่า field ชื่ออะไร)
        role: "FARMER"
      },
      select: { id: true, email: true, name: true, role: true }
    });

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error("REGISTER_ERROR", err);
    return res.status(500).json({ message: "Register failed" });
  }
}
