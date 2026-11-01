require("dotenv").config({ path: "./config/.env" });
const app = require("./app");
const { connectDatabase } = require("./config/database");
let server;
const shutdown = (error) => {
  if (error) {
    console.error("Server shutdown error:", error);
    console.error(error.stack);
  }
  if (server) server.close(() => process.exit(error ? 1 : 0));
  else process.exit(error ? 1 : 0);
};
connectDatabase()
  .then(() => {
    if (!process.env.PORT) {
      throw new Error("PORT environment variable is required");
    }
    server = app.listen(process.env.PORT, "0.0.0.0", () =>
      console.log(`Server running on port ${process.env.PORT}`),
    );
  })
  .catch((error) => {
    console.error("Database startup failed:", error);
    console.error(error.stack);
    shutdown(error);
  });
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  console.error(error.stack);
  shutdown(error);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  console.error(error.stack);
  shutdown(error);
});
