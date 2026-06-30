const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const router = express.Router();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.category.count({ where }),
    ]);

    res.json({
      data: categories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data kategori" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!category) {
      return res.status(404).json({ error: "Kategori tidak ditemukan" });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data kategori" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nama kategori wajib diisi" });
    }
    const category = await prisma.category.create({
      data: { name },
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Gagal membuat kategori" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nama kategori wajib diisi" });
    }
    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: { name },
    });
    res.json(category);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Kategori tidak ditemukan" });
    }
    res.status(500).json({ error: "Gagal mengupdate kategori" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: "Kategori berhasil dihapus" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Kategori tidak ditemukan" });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Kategori masih digunakan oleh item lain" });
    }
    res.status(500).json({ error: "Gagal menghapus kategori" });
  }
});

module.exports = router;
