require("dotenv").config({ path: "./config/.env" });
const app = require("./app");
const { connectDatabase } = require("./config/database");
let server;
const shutdown = (error) => {
  if (error) console.error(error);
  if (server) server.close(() => process.exit(error ? 1 : 0));
  else process.exit(error ? 1 : 0);
};
connectDatabase()
  .then(() => {
    if (!process.env.PORT) {
      throw new Error("PORT environment variable is required");
    }
    server = app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`),
    );
  })
  .catch(shutdown);
process.on("unhandledRejection", shutdown);
process.on("uncaughtException", shutdown);
