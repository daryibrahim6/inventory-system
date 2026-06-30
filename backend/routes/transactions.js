const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const ExcelJS = require("exceljs");

const router = express.Router();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

router.post("/stock-in", async (req, res) => {
  try {
    const { itemId, quantity, note } = req.body;

    if (!itemId || !quantity) {
      return res.status(400).json({ error: "itemId dan quantity wajib diisi" });
    }

    if (parseInt(quantity) <= 0) {
      return res.status(400).json({ error: "Quantity harus lebih dari 0" });
    }

    const item = await prisma.item.findUnique({
      where: { id: parseInt(itemId) },
    });
    if (!item) {
      return res.status(404).json({ error: "Item tidak ditemukan" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.item.update({
        where: { id: parseInt(itemId) },
        data: { stock: { increment: parseInt(quantity) } },
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          itemId: parseInt(itemId),
          type: "in",
          quantity: parseInt(quantity),
          note: note || null,
          createdById: req.user.id,
        },
      });

      return { item: updatedItem, transaction };
    });

    res.status(201).json({
      message: "Barang masuk berhasil",
      item: result.item,
      transaction: result.transaction,
    });
  } catch (err) {
    console.error("Stock in error:", err);
    res.status(500).json({ error: "Gagal memproses barang masuk" });
  }
});

router.post("/stock-out", async (req, res) => {
  try {
    const { itemId, quantity, note } = req.body;

    if (!itemId || !quantity) {
      return res.status(400).json({ error: "itemId dan quantity wajib diisi" });
    }

    if (parseInt(quantity) <= 0) {
      return res.status(400).json({ error: "Quantity harus lebih dari 0" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: parseInt(itemId) },
      });

      if (!item) {
        throw new Error("ITEM_NOT_FOUND");
      }

      if (item.stock < parseInt(quantity)) {
        throw new Error(`STOK_TIDAK_CUKUP:${item.stock}:${quantity}`);
      }

      const updatedItem = await tx.item.update({
        where: { id: parseInt(itemId) },
        data: { stock: { decrement: parseInt(quantity) } },
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          itemId: parseInt(itemId),
          type: "out",
          quantity: parseInt(quantity),
          note: note || null,
          createdById: req.user.id,
        },
      });

      return { item: updatedItem, transaction };
    });

    res.status(201).json({
      message: "Barang keluar berhasil",
      item: result.item,
      transaction: result.transaction,
    });
  } catch (err) {
    console.error("Stock out error:", err);

    if (err.message === "ITEM_NOT_FOUND") {
      return res.status(404).json({ error: "Item tidak ditemukan" });
    }

    if (err.message && err.message.startsWith("STOK_TIDAK_CUKUP:")) {
      const parts = err.message.split(":");
      const stokTersedia = parseInt(parts[1]);
      const jumlahDiminta = parseInt(parts[2]);
      return res.status(400).json({
        error: `Stok tidak cukup. Stok tersedia: ${stokTersedia}, jumlah diminta: ${jumlahDiminta}`,
      });
    }

    res.status(500).json({ error: "Gagal memproses barang keluar" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const { itemId, type, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (itemId) {
      const parsedItemId = parseInt(itemId);
      if (isNaN(parsedItemId)) {
        return res.status(400).json({ error: "itemId harus berupa angka" });
      }
      where.itemId = parsedItemId;
    }

    if (type) {
      if (type !== "in" && type !== "out") {
        return res.status(400).json({ error: "type harus 'in' atau 'out'" });
      }
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({ error: "startDate format tidak valid" });
        }
        where.createdAt.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ error: "endDate format tidak valid" });
        }
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.item = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        include: { item: true, createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.stockTransaction.count({ where }),
    ]);

    res.json({
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Gagal mengambil riwayat transaksi" });
  }
});

router.get("/export", async (req, res) => {
  try {
    const { itemId, type, startDate, endDate } = req.query;

    const where = {};
    if (itemId) where.itemId = parseInt(itemId);
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const transactions = await prisma.stockTransaction.findMany({
      where,
      include: { item: true, createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Riwayat Transaksi");

    sheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Tanggal", key: "date", width: 15 },
      { header: "Jenis", key: "type", width: 10 },
      { header: "Kode Barang", key: "itemCode", width: 15 },
      { header: "Nama Barang", key: "itemName", width: 25 },
      { header: "Jumlah", key: "quantity", width: 10 },
      { header: "Keterangan", key: "note", width: 30 },
      { header: "Dibuat Oleh", key: "createdBy", width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };

    transactions.forEach((tx, idx) => {
      sheet.addRow({
        no: idx + 1,
        date: new Date(tx.createdAt).toLocaleDateString("id-ID"),
        type: tx.type === "in" ? "Masuk" : "Keluar",
        itemCode: tx.item?.code || "-",
        itemName: tx.item?.name || "-",
        quantity: tx.quantity,
        note: tx.note || "-",
        createdBy: tx.createdBy?.name || "-",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=riwayat-transaksi.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: "Gagal export data" });
  }
});

module.exports = router;
