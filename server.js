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
    server = app.listen(Number(process.env.PORT) || 4001, () =>
      console.log(`Server running on port ${process.env.PORT || 4001}`),
    );
  })
  .catch(shutdown);
process.on("unhandledRejection", shutdown);
process.on("uncaughtException", shutdown);
