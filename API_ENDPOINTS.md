# API Endpoints

Base URL: `http://localhost:3001/api`

## Authentication

### Register

```
POST /api/auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "Register berhasil",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "staff",
    "createdAt": "2026-06-30T10:00:00.000Z"
  }
}
```

---

### Login

```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "staff"
}
```

---

## Categories

**Auth Required:** Header `Authorization: Bearer <token>`

### Get All Categories

```
GET /api/categories?search=&page=1&limit=10
```

**Query Parameters:**
| Parameter | Tipe | Default | Deskripsi |
|-----------|------|---------|-----------|
| `search` | string | - | Cari berdasarkan nama |
| `page` | number | 1 | Halaman |
| `limit` | number | 10 | Jumlah per halaman |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Makanan",
      "createdAt": "2026-06-30T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### Get Category by ID

```
GET /api/categories/:id
```

---

### Create Category

```
POST /api/categories
```

**Body:**
```json
{
  "name": "Minuman"
}
```

---

### Update Category

```
PUT /api/categories/:id
```

**Body:**
```json
{
  "name": "Makanan & Minuman"
}
```

---

### Delete Category

```
DELETE /api/categories/:id
```

---

## Items

**Auth Required:** Header `Authorization: Bearer <token>`

### Get All Items

```
GET /api/items?search=&categoryId=&page=1&limit=10
```

**Query Parameters:**
| Parameter | Tipe | Default | Deskripsi |
|-----------|------|---------|-----------|
| `search` | string | - | Cari berdasarkan kode/nama |
| `categoryId` | number | - | Filter berdasarkan kategori |
| `page` | number | 1 | Halaman |
| `limit` | number | 10 | Jumlah per halaman |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "code": "MKN001",
      "name": "Nasi Goreng",
      "categoryId": 1,
      "unit": "Porsi",
      "stock": 10,
      "price": "25000",
      "createdAt": "2026-06-30T10:00:00.000Z",
      "category": {
        "id": 1,
        "name": "Makanan"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### Get Item by ID

```
GET /api/items/:id
```

---

### Create Item

```
POST /api/items
```

**Body:**
```json
{
  "code": "MKN001",
  "name": "Nasi Goreng",
  "categoryId": 1,
  "unit": "Porsi",
  "stock": 10,
  "price": 25000
}
```

**Validation:**
- `categoryId` harus exist di tabel categories
- `code` harus unik

---

### Update Item

```
PUT /api/items/:id
```

**Body:**
```json
{
  "name": "Nasi Goreng Spesial",
  "price": 30000
}
```

---

### Delete Item

```
DELETE /api/items/:id
```

---

## Transactions

**Auth Required:** Header `Authorization: Bearer <token>`

### Stock In (Barang Masuk)

```
POST /api/transactions/stock-in
```

**Body:**
```json
{
  "itemId": 1,
  "quantity": 10,
  "note": "Restok dari supplier",
  "date": "2026-06-30"
}
```

---

### Stock Out (Barang Keluar)

```
POST /api/transactions/stock-out
```

**Body:**
```json
{
  "itemId": 1,
  "quantity": 5,
  "note": "Penjualan",
  "date": "2026-06-30"
}
```

**Error (400) - stok tidak cukup:**
```json
{
  "error": "Stok tidak cukup. Stok tersedia: 15, jumlah diminta: 20"
}
```

---

### Riwayat Transaksi

```
GET /api/transactions/history?itemId=1&type=in&startDate=2026-06-01&endDate=2026-06-30&search=&page=1&limit=20
```

**Query Parameters:**
| Parameter | Tipe | Default | Deskripsi |
|-----------|------|---------|-----------|
| `itemId` | number | - | Filter berdasarkan item |
| `type` | string | - | `"in"` atau `"out"` |
| `startDate` | string | - | Format: `YYYY-MM-DD` |
| `endDate` | string | - | Format: `YYYY-MM-DD` |
| `search` | string | - | Cari berdasarkan nama barang |
| `page` | number | 1 | Halaman |
| `limit` | number | 20 | Jumlah per halaman |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "itemId": 1,
      "type": "in",
      "quantity": 10,
      "note": "Restok dari supplier",
      "createdAt": "2026-06-30T10:00:00.000Z",
      "item": {
        "name": "Nasi Goreng"
      },
      "createdBy": {
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### Export Riwayat Transaksi ke Excel

```
GET /api/transactions/export?itemId=1&type=in&startDate=2026-06-01&endDate=2026-06-30
```

Download file Excel (.xlsx) dengan format:
- Kolom: No, Tanggal, Jenis, Kode Barang, Nama Barang, Jumlah, Keterangan, Dibuat Oleh

---

## Dashboard

**Auth Required:** Header `Authorization: Bearer <token>`

### Get Dashboard Data

```
GET /api/dashboard
```

**Response (200):**
```json
{
  "totalItems": 5,
  "totalCategories": 3,
  "totalInventoryValue": 1250000,
  "lowStockItems": [
    {
      "id": 1,
      "code": "MKN001",
      "name": "Nasi Goreng",
      "stock": 2,
      "unit": "Porsi",
      "category": {
        "name": "Makanan"
      }
    }
  ],
  "monthlyTransactionsIn": 10,
  "monthlyTransactionsOut": 5,
  "period": {
    "start": "2026-06-01T00:00:00.000Z",
    "end": "2026-06-30T23:59:59.999Z"
  }
}
```

---

### Low Stock Alert

```
GET /api/dashboard/low-stock-alert?threshold=5
```

**Query Parameters:**
| Parameter | Tipe | Default | Deskripsi |
|-----------|------|---------|-----------|
| `threshold` | number | 5 | Batas stok minimum |

**Response (200):**
```json
{
  "threshold": 5,
  "count": 3,
  "items": [
    {
      "id": 1,
      "code": "MKN001",
      "name": "Nasi Goreng",
      "stock": 2,
      "unit": "Porsi",
      "category": {
        "name": "Makanan"
      }
    }
  ]
}
```

---

## Role-Based Access Control

Role pengguna:
- `admin` - Akses penuh (CRUD semua data)
- `staff` - Akses terbatas (hanya melihat dan membuat transaksi)

Untuk menggunakan role admin pada register:
```json
POST /api/auth/register
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

---

## Error Codes

| Kode | Deskripsi |
|------|-----------|
| 400 | Bad Request - Data tidak valid |
| 401 | Unauthorized - Token tidak ada/invalid/expired |
| 403 | Forbidden - Akses ditolak (role tidak sesuai) |
| 404 | Not Found - Resource tidak ditemukan |
| 500 | Internal Server Error |
