const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const router = express.Router();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalItems,
      totalCategories,
      totalInventoryValue,
      lowStockItems,
      monthlyTransactions,
    ] = await Promise.all([
      prisma.item.count(),

      prisma.category.count(),

      prisma.$queryRaw`SELECT COALESCE(SUM(stock::float * price::float), 0)::float as total FROM items`
        .then((result) => Number(result[0].total)),

      prisma.item.findMany({
        orderBy: { stock: "asc" },
        take: 5,
        select: {
          id: true,
          code: true,
          name: true,
          stock: true,
          unit: true,
          category: { select: { name: true } },
        },
      }),

      prisma.stockTransaction.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ]);

    res.json({
      totalItems,
      totalCategories,
      totalInventoryValue,
      lowStockItems,
      monthlyTransactions,
      period: {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Gagal mengambil data dashboard" });
  }
});

module.exports = router;
