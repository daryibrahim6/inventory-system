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
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Categories

**Auth Required:** Semua endpoint butuh header `Authorization: Bearer <token>`

### Get All Categories

```
GET /api/categories
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Makanan",
    "createdAt": "2026-06-30T10:00:00.000Z"
  }
]
```

---

### Get Category by ID

```
GET /api/categories/:id
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Makanan",
  "createdAt": "2026-06-30T10:00:00.000Z"
}
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

**Response (201):**
```json
{
  "id": 2,
  "name": "Minuman",
  "createdAt": "2026-06-30T10:00:00.000Z"
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

**Response (200):**
```json
{
  "id": 1,
  "name": "Makanan & Minuman",
  "createdAt": "2026-06-30T10:00:00.000Z"
}
```

---

### Delete Category

```
DELETE /api/categories/:id
```

**Response (200):**
```json
{
  "message": "Kategori berhasil dihapus"
}
```

---

## Items

**Auth Required:** Semua endpoint butuh header `Authorization: Bearer <token>`

### Get All Items

```
GET /api/items
```

**Response (200):**
```json
[
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
]
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

**Response (201):**
```json
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
```

**Error (400) - categoryId not found:**
```json
{
  "error": "Kategori tidak ditemukan"
}
```

**Error (400) - duplicate code:**
```json
{
  "error": "Item dengan code \"MKN001\" sudah ada"
}
```

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

**Auth Required:** Semua endpoint butuh header `Authorization: Bearer <token>`

### Stock In (Barang Masuk)

```
POST /api/transactions/stock-in
```

**Body:**
```json
{
  "itemId": 1,
  "quantity": 10,
  "note": "Restok dari supplier"
}
```

**Response (201):**
```json
{
  "message": "Barang masuk berhasil",
  "item": {
    "id": 1,
    "stock": 20
  },
  "transaction": {
    "id": 1,
    "itemId": 1,
    "type": "in",
    "quantity": 10,
    "note": "Restok dari supplier"
  }
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
  "note": "Penjualan"
}
```

**Response (201):**
```json
{
  "message": "Barang keluar berhasil",
  "item": {
    "id": 1,
    "stock": 15
  },
  "transaction": {
    "id": 2,
    "itemId": 1,
    "type": "out",
    "quantity": 5,
    "note": "Penjualan"
  }
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
GET /api/transactions/history?itemId=1&type=in&startDate=2026-06-01&endDate=2026-06-30
```

**Query Parameters (semua optional):**
| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `itemId` | number | Filter berdasarkan item |
| `type` | string | `"in"` atau `"out"` |
| `startDate` | string | Format: `YYYY-MM-DD` |
| `endDate` | string | Format: `YYYY-MM-DD` |

**Response (200):**
```json
[
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
]
```

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
  "monthlyTransactions": 15,
  "period": {
    "start": "2026-06-01T00:00:00.000Z",
    "end": "2026-06-30T23:59:59.999Z"
  }
}
```

---

## Error Codes

| Kode | Deskripsi |
|------|-----------|
| 400 | Bad Request - Data tidak valid |
| 401 | Unauthorized - Token tidak ada/invalid/expired |
| 404 | Not Found - Resource tidak ditemukan |
| 500 | Internal Server Error |
