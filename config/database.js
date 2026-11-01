const mongoose = require("mongoose");
const dns = require("node:dns");

exports.connectDatabase = async () => {
  if (!process.env.MONGO_URI)
    throw new Error("MONGO_URI environment variable is required");
  const dnsServers = (process.env.DNS_SERVERS || "")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (dnsServers.length) dns.setServers(dnsServers);
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    console.error(error.stack);
    throw error;
  }
};
