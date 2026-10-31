const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middlewares/error");
const auth = require("./routes/auth");
const product = require("./routes/product");
const order = require("./routes/order");
const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://itcp318React-backend.onrender.com",
    credentials: true,
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
app.use(errorMiddleware);
module.exports = app;
