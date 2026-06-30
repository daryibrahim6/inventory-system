const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const router = express.Router();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

router.get("/", async (req, res) => {
  try {
    const { search, categoryId, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.item.count({ where }),
    ]);

    res.json({
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data item" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true },
    });
    if (!item) {
      return res.status(404).json({ error: "Item tidak ditemukan" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data item" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { code, name, categoryId, unit, stock, price } = req.body;

    if (!code || !name || !categoryId || !unit || price === undefined) {
      return res.status(400).json({ error: "Code, name, categoryId, unit, dan price wajib diisi" });
    }

    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
    });
    if (!category) {
      return res.status(400).json({ error: "Kategori tidak ditemukan" });
    }

    const existingItem = await prisma.item.findUnique({
      where: { code },
    });
    if (existingItem) {
      return res.status(400).json({ error: `Item dengan code "${code}" sudah ada` });
    }

    const item = await prisma.item.create({
      data: {
        code,
        name,
        categoryId: parseInt(categoryId),
        unit,
        stock: stock || 0,
        price: parseFloat(price),
      },
      include: { category: true },
    });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: `Item dengan code "${req.body.code}" sudah ada` });
    }
    res.status(500).json({ error: "Gagal membuat item" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { code, name, categoryId, unit, stock, price } = req.body;

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) },
      });
      if (!category) {
        return res.status(400).json({ error: "Kategori tidak ditemukan" });
      }
    }

    if (code) {
      const existingItem = await prisma.item.findFirst({
        where: {
          code,
          id: { not: parseInt(req.params.id) },
        },
      });
      if (existingItem) {
        return res.status(400).json({ error: `Item dengan code "${code}" sudah ada` });
      }
    }

    const item = await prisma.item.update({
      where: { id: parseInt(req.params.id) },
      data: {
        code,
        name,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        unit,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
      },
      include: { category: true },
    });
    res.json(item);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Item tidak ditemukan" });
    }
    if (err.code === "P2002") {
      return res.status(400).json({ error: `Item dengan code "${req.body.code}" sudah ada` });
    }
    res.status(500).json({ error: "Gagal mengupdate item" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.item.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: "Item berhasil dihapus" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Item tidak ditemukan" });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Item masih memiliki transaksi" });
    }
    res.status(500).json({ error: "Gagal menghapus item" });
  }
});

module.exports = router;
