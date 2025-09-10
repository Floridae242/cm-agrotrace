import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email & password required" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name: name || "", email, passwordHash: hash, role: role || "FARMER" },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = jwt.sign({ sub: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({ user, token });
  } catch (e) {
    console.error("REGISTER_ERROR", e);
    return res.status(500).json({ message: "Register failed" });
  }
}
