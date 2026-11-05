const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middlewares/error");
const auth = require("./routes/auth");
const product = require("./routes/product");
const order = require("./routes/order");
const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get("/api/v1/health", (req, res) =>
  res.json({ success: true, service: "UPS Battery Store" }),
);
app.use("/api/v1", auth);
app.use("/api/v1", product);
app.use("/api/v1", order);
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);
app.use(errorMiddleware);
module.exports = app;
