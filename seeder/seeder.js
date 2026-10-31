require("dotenv").config({ path: "./config/.env" });
const dns = require("node:dns");
const mongoose = require("mongoose");
const Product = require("../models/product");
const products = require("../data/products.json");
const seed = async () => {
  const dnsServers = (process.env.DNS_SERVERS || "")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (dnsServers.length) dns.setServers(dnsServers);
  await mongoose.connect(process.env.MONGO_URI);
  await Product.deleteMany();
  await Product.insertMany(products);
  console.log(`${products.length} products imported`);
  process.exit(0);
};
seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
