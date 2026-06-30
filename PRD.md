# PRD — Inventory Management System
**Tugas Magang | Stack: React (Vite) + Express.js + PostgreSQL + Prisma**
**Mode kerja: Solo, deadline ketat (<1 minggu)**

---

## 0. Cara Pakai Dokumen Ini (Baca Dulu Sebelum Vibecoding)

Dokumen ini dipecah jadi **FASE**. Setiap fase = satu sesi prompt ke agent OpenCode.
**Jangan minta agent ngerjain lebih dari satu fase dalam satu prompt** — kalau scope kebesaran, agent gampang generate file berlebihan yang susah lo audit, dan kalau ada bug, lo gak tahu fase mana sumbernya.

Setiap fase punya:
- **Tujuan** — apa yang harus jadi di akhir fase ini
- **Constraint wajib** — hal yang TIDAK BOLEH dilewatkan agent, ini bagian yang paling sering di-skip kalau prompt-nya kurang spesifik
- **Acceptance check** — cara lo verifikasi manual fase ini beneran selesai sebelum lanjut ke fase berikutnya
- **Skill yang dipakai** — skill OpenCode mana yang relevan dipanggil di fase ini

**Aturan keras:** jangan lanjut ke fase berikutnya kalau acceptance check fase sekarang belum lo coba sendiri. Vibecoding cepat itu oke, tapi commit ke fase baru di atas fondasi yang belum diverifikasi itu yang bikin proyek collapse di hari ke-4 atau ke-5.

---

## 1. Rules Penggunaan Skill OpenCode

Instruksikan ke agent (taruh ini di awal tiap sesi atau system prompt OpenCode lo, sesuaikan dengan skill yang lo install):

- **Skill backend/API generation** → pakai untuk semua kerjaan di folder `backend/` (routes, middleware, Prisma schema, controllers).
- **Skill design/UI** → pakai HANYA untuk folder `frontend/`, khususnya saat bikin komponen React, layout dashboard, dan styling. Jangan dipanggil untuk logic backend.
- **Skill database/migration** (kalau ada) → pakai khusus saat kerja dengan `prisma/schema.prisma` dan migration. Jangan biarkan agent jalanin migration tanpa nunjukin schema diff dulu ke lo.
- **Skill testing/debugging** (kalau ada) → pakai saat ada error runtime, BUKAN untuk nulis fitur baru dari nol.
- **Default rule kalau gak yakin skill mana yang cocok:** agent harus tanya dulu ke lo sebelum milih, bukan asal pakai skill yang "kelihatan paling related".

Tambahkan instruksi ini secara eksplisit di tiap prompt fase: *"Gunakan skill yang sesuai konteks (backend/design/database), jangan campur scope antara frontend dan backend dalam satu response."*

---

## 2. Tech Stack Final

| Layer | Tools |
|---|---|
| Frontend | React (Vite), React Router, fetch/axios ke backend |
| Backend | Express.js, REST API |
| Database | PostgreSQL (Prisma Postgres cloud) |
| ORM | Prisma (v7.x — **pakai `prisma.config.ts` untuk datasource url, BUKAN di schema.prisma**) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validasi | express-validator atau manual di controller |

**Catatan versi penting:** Prisma v7 memindahkan konfigurasi `datasource.url` dari `schema.prisma` ke `prisma.config.ts`. Selalu cek dokumentasi versi yang ke-install (`npx prisma -v`) sebelum agent generate config — jangan asumsikan format v5/v6 yang banyak beredar di tutorial lama.

---

## 3. Skema Database (WAJIB, jangan diubah strukturnya tanpa alasan kuat)

```prisma
model User {
  id           Int      @id @default(autoincrement())
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  transactions StockTransaction[]
  @@map("users")
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  items     Item[]
  @@map("categories")
}

model Item {
  id           Int      @id @default(autoincrement())
  code         String   @unique
  name         String
  categoryId   Int      @map("category_id")
  category     Category @relation(fields: [categoryId], references: [id])
  unit         String
  stock        Int      @default(0)
  price        Decimal
  createdAt    DateTime @default(now()) @map("created_at")
  transactions StockTransaction[]
  @@map("items")
}

model StockTransaction {
  id          Int      @id @default(autoincrement())
  itemId      Int      @map("item_id")
  item        Item     @relation(fields: [itemId], references: [id])
  type        String   // "in" | "out"
  quantity    Int
  note        String?
  createdById Int      @map("created_by")
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now()) @map("created_at")
  @@map("stock_transactions")
}
```

---

## FASE 1 — Setup Project & Database

**Tujuan:** Folder `backend` + `frontend` terpisah, Prisma terkoneksi ke PostgreSQL cloud, 4 tabel di atas ke-create lewat migration terstruktur.

**Constraint wajib:**
- `.env` HARUS masuk `.gitignore` sebelum commit pertama
- Migration dijalankan via `npx prisma migrate dev`, BUKAN bikin tabel manual lewat SQL editor
- Connection string TIDAK BOLEH hardcoded di kode manapun, hanya lewat `process.env.DATABASE_URL`

**Acceptance check:**
- `npx prisma studio` menampilkan 4 tabel kosong (users, categories, items, stock_transactions)
- File migration ada di `prisma/migrations/`
- `git status` tidak menampilkan `.env` sebagai file yang akan di-commit

**Skill:** database/migration

---

## FASE 2 — Autentikasi JWT

**Tujuan:** Register, login, middleware proteksi route, logout di sisi client.

**Constraint wajib:**
- Password di-hash pakai bcrypt sebelum disimpan — TIDAK BOLEH plain text, bahkan untuk testing
- JWT punya expiry eksplisit (1 jam), dan field `exp` dicek di middleware
- Middleware mengembalikan `401` untuk token invalid/expired/tidak ada — bukan redirect paksa di level backend (redirect itu urusan frontend)
- Tentukan dan dokumentasikan pilihan penyimpanan token: **cookie httpOnly** direkomendasikan untuk keamanan (mitigasi XSS), tapi kalau pakai `localStorage` karena lebih cepat diimplementasikan dengan arsitektur frontend-backend terpisah, tulis alasannya di README nanti
- `JWT_SECRET` dari `.env`, jangan hardcode

**Acceptance check:**
- Coba register user baru → cek di Prisma Studio, `passwordHash` bukan teks biasa
- Login dengan kredensial benar → dapat token
- Hit endpoint inventory tanpa token → dapat 401
- Hit dengan token expired (bisa test set expiry 10 detik sementara) → dapat 401

**Skill:** backend/API generation

---

## FASE 3 — Master Data (Categories & Items CRUD)

**Tujuan:** CRUD penuh untuk categories dan items, dengan relasi FK tervalidasi.

**Constraint wajib:**
- Semua endpoint CRUD ini WAJIB lewat middleware auth dari Fase 2
- Validasi server: `categoryId` yang dikirim saat create/update item harus benar-benar exist di tabel categories — jangan percaya input frontend begitu saja
- Field `code` pada items harus unique, tangani error duplikat dengan response yang jelas (bukan crash 500 generik)

**Acceptance check:**
- Create category → create item dengan category itu → berhasil
- Create item dengan `categoryId` yang tidak exist → harus reject dengan pesan error, bukan crash atau berhasil dengan FK rusak
- Create item dengan `code` duplikat → reject jelas

**Skill:** backend/API generation (untuk endpoint), design/UI (untuk form & tabel CRUD di frontend)

---

## FASE 4 — Transaksi Barang Masuk & Keluar

**Tujuan:** Endpoint barang masuk/keluar yang update stok secara atomic, riwayat transaksi dengan filter.

**Constraint wajib — INI BAGIAN PALING KRITIS, JANGAN SAMPAI DI-SKIP AGENT:**
- Update stok + insert record transaksi HARUS dalam satu `prisma.$transaction([...])` (setara `BEGIN...COMMIT`). Kalau salah satu gagal, keduanya harus rollback.
- Validasi stok tidak boleh negatif **dilakukan di server, di dalam transaction block yang sama**, sebelum commit — bukan dicek terpisah lalu baru update (itu rawan race condition kalau dua transaksi nyaris bersamaan)
- Response error untuk stok tidak cukup harus jelas: tunjukkan stok tersedia vs jumlah yang diminta
- Filter riwayat (by item, tanggal, jenis) di-implementasikan sebagai query parameter, divalidasi tipe datanya di server

**Acceptance check:**
- Barang masuk → stok bertambah sesuai jumlah, ada record transaksi `type: in`
- Barang keluar dengan jumlah ≤ stok → stok berkurang, record `type: out`
- Barang keluar dengan jumlah > stok → ditolak, stok TIDAK berubah, tidak ada record transaksi yang ke-insert (cek manual di Prisma Studio bahwa tidak ada record "nyangkut")
- Filter riwayat by item dan by tanggal masing-masing berfungsi

**Skill:** backend/API generation

---

## FASE 5 — Dashboard

**Tujuan:** Agregasi data untuk ringkasan: total jenis barang, total kategori, total nilai inventory, 5 stok terendah, jumlah transaksi bulan berjalan.

**Constraint wajib:**
- Total nilai inventory = SUM(stock × price) dihitung di query database (Prisma aggregate atau raw query), bukan di-loop manual di JavaScript kalau datanya bisa besar
- "Bulan berjalan" dihitung dari tanggal server, bukan hardcode bulan tertentu
- 5 stok terendah: urutkan ascending by stock, limit 5 — pastikan item dengan stok 0 juga muncul, bukan ke-filter keluar

**Acceptance check:**
- Angka di dashboard dicocokkan manual dengan isi Prisma Studio (hitung manual minimal untuk total nilai inventory dan jumlah transaksi)

**Skill:** backend/API generation (query), design/UI (tampilan dashboard)

---

## FASE 6 — Dokumentasi & Submission

**Tujuan:** Memenuhi poin 7 di spek tugas (output yang harus diserahkan).

**Checklist:**
- [ ] `README.md` — instalasi, isi `.env` (dengan placeholder, bukan value asli), cara migrate
- [ ] Daftar endpoint API (method, path, auth required, contoh body)
- [ ] Screenshot/video demo: login → CRUD → transaksi → dashboard
- [ ] Catatan kendala & solusi (jujur tulis kendala asli, termasuk yang Prisma v7 config kalau relevan — itu pengalaman nyata debugging, dosen biasanya appreciate transparansi ini)
- [ ] Pastikan `.env` TIDAK ikut ter-commit ke repository sebelum push final ke GitHub

**Skill:** tidak perlu skill khusus, ini kerja manual review.

---

## 4. Yang SENGAJA Tidak Dikerjakan (Scope Cut karena Deadline)

Dari bagian "6. Bonus" di spek tugas — role admin/staff, export Excel/PDF, notifikasi stok minimum, pagination & search lanjutan — **tidak masuk scope** untuk versi submit pertama karena waktu terbatas. Kalau sempat di hari buffer (Fase 6 setelah checklist utama selesai), boleh ditambahkan, tapi prioritas utama adalah Fase 1–5 berjalan benar dan solid, bukan fitur tambahan yang setengah jadi.
