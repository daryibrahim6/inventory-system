require("dotenv/config");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const itemRoutes = require("./routes/items");
const transactionRoutes = require("./routes/transactions");
const dashboardRoutes = require("./routes/dashboard");
const authenticateToken = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/categories", authenticateToken, categoryRoutes);
app.use("/api/items", authenticateToken, itemRoutes);
app.use("/api/transactions", authenticateToken, transactionRoutes);
app.use("/api/dashboard", authenticateToken, dashboardRoutes);

app.get("/api/inventory", authenticateToken, (req, res) => {
  res.json({ message: "Inventory data", user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

module.exports = app;
