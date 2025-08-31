# CM‑AgroTrace (Chiang Mai)

**Software‑only** farm‑to‑market traceability for Smart Agri‑Food & Supply Chain in Chiang Mai, Thailand.  
Built with **Node.js + Express + PostgreSQL (Prisma)** and **React + Vite + Tailwind**.  
No hardware required. Supports QR‑based public verification, lot timelines, and a simple tamper‑evident hash.

## Quick Start (Local)

Requirements: Node 18+, pnpm/npm, PostgreSQL

```bash
# 1) Backend
cd backend
cp .env.example .env
# edit DATABASE_URL and JWT_SECRET
npm i
npm run prisma:generate
npm run prisma:push
npm run seed   # optional demo user + longan lot
npm run dev    # starts at :8080

# 2) Frontend
cd ../frontend
cp .env.example .env
npm i
npm run dev    # starts at :5173
```

Demo login after seeding: `farmer@example.com / test1234`

## Deploy to Render (Monorepo)

1. **Create a Render PostgreSQL** database and copy its `DATABASE_URL`.
2. **Create a Web Service** for `backend/`:
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `node src/server.js`
   - Environment:
     - `DATABASE_URL=…` (from step 1)
     - `JWT_SECRET=<random long secret>`
     - `FRONTEND_PUBLIC_BASE=<your frontend URL>`
   - After first deploy, open Shell and run: `npx prisma db push && node prisma/seed.js` (optional seed). Restart the service.
3. **Create a Static Site** for `frontend/` (or a Web Service):
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add environment: `VITE_API_BASE=<your backend URL>`

## UX highlights

- Thai‑first labels and flows for Chiang Mai smallholders, packhouses, and buyers
- Minimal steps (Create → Print QR → Add Events)
- Public read‑only page (`/scan/:lotId`) for instant trust via QR
- Color and copy emphasize safety signals (e.g., residue test pass/fail)

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `POST /api/lots`
- `GET /api/lots`
- `GET /api/lots/:lotId`
- `POST /api/lots/:lotId/events`
- `GET /api/lots/public/:lotId` (no auth)
- `GET /api/lots/:lotId/qr` (PNG)

## Notes

- Hash is **tamper‑evident** (not blockchain): SHA‑256 of canonical lot fields.
- Extendable: add role‑based permissions, lab report uploads, or export CSV.
- This repo is intentionally simple to fit hackathon timelines and Render free tier.
