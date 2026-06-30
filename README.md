# Inventory Management System

Sistem manajemen inventaris berbasis web untuk mengelola data barang, kategori, dan transaksi stok masuk/keluar.

## Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | React (Vite), React Router |
| Backend | Express.js, REST API |
| Database | PostgreSQL (Prisma Postgres) |
| ORM | Prisma v7.x |
| Auth | JWT (jsonwebtoken) + bcrypt |

## Instalasi

### Prerequisites

- Node.js v18+
- npm atau yarn
- Akun Prisma Postgres (atau PostgreSQL lainnya)

### 1. Clone Repository

```bash
git clone https://github.com/username/inventory-system.git
cd inventory-system
```

### 2. Setup Backend

```bash
cd backend
npm install
```

### 3. Konfigurasi Environment Variables

Buat file `.env` di folder `backend/`:

```bash
cp .env.example .env
```

Isi file `.env` dengan values yang sesuai:

```env
DATABASE_URL="postgres://USER:PASSWORD@host:5432/dbname?sslmode=require"
JWT_SECRET="your-secret-key-here"
```

**PENTING:** Jangan pernah commit file `.env` ke repository!

### 4. Jalankan Migration

```bash
npx prisma migrate dev
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Jalankan Backend

```bash
node app.js
```

Backend berjalan di `http://localhost:3001`

### 7. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`

## Login Default

Buat akun baru melalui halaman register, atau gunakan akun test:

- Email: `test@example.com`
- Password: `password123`

## Keamanan Token

Token JWT disimpan di **localStorage** (sisi client). Alasan:

- Arsitektur frontend-backend terpisah (cross-origin)
- httpOnly cookie membutuhkan konfigurasi CORS + SameSite yang lebih kompleks
- Untuk scope magang (single user, bukan production), localStorage sudah memadai

**Catatan untuk production:** Gunakan httpOnly cookie dengan SameSite=Strict untuk mitigasi XSS.

## Struktur Project

```
inventory-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── migrations/          # Migration files
│   ├── routes/
│   │   ├── auth.js              # Register & Login
│   │   ├── categories.js        # CRUD Kategori
│   │   ├── items.js             # CRUD Item
│   │   ├── transactions.js      # Transaksi Stok
│   │   └── dashboard.js         # Dashboard API
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   ├── prisma.config.ts         # Prisma config (v7)
│   ├── app.js                   # Express entry point
│   ├── .env                     # Environment variables (NOT committed)
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── Login.jsx            # Halaman login
│   │   ├── Dashboard.jsx        # Dashboard
│   │   └── App.jsx              # Router
│   └── package.json
└── README.md
```

## API Endpoints

Lihat [API_ENDPOINTS.md](./API_ENDPOINTS.md) untuk daftar lengkap endpoint.

## Kendala & Solusi

### 1. Prisma v7 - Perubahan Konfigurasi Datasource URL

**Kendala:** Prisma v7 tidak lagi mendukung property `url` di `schema.prisma`. Muncul error P1012.

**Solusi:** Pindahkan konfigurasi URL ke `prisma.config.ts`:

```typescript
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

### 2. Prisma v7 - PrismaClient Membutuhkan Driver Adapter

**Kendala:** `new PrismaClient()` tanpa parameter menghasilkan error di Prisma v7.

**Solusi:** Gunakan driver adapter `@prisma/adapter-pg`:

```javascript
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

### 3. Prisma v7 - Generator Provider

**Kendala:** Generator `prisma-client` menghasilkan TypeScript, bukan JavaScript.

**Solusi:** Gunakan provider `prisma-client-js` untuk project CommonJS:

```prisma
generator client {
  provider = "prisma-client-js"
}
```

## License

MIT
