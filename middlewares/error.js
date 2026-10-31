const ErrorHandler = require("../utils/errorHandler");

module.exports = (error, req, res, next) => {
  let handled = error;
  if (error.name === "CastError")
    handled = new ErrorHandler("Resource not found", 404);
  if (error.code === 11000)
    handled = new ErrorHandler(
      `Duplicate value: ${Object.keys(error.keyValue || {}).join(", ")}`,
      400,
    );
  if (error.name === "ValidationError")
    handled = new ErrorHandler(
      Object.values(error.errors)
        .map((item) => item.message)
        .join(", "),
      400,
    );
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
    handled = new ErrorHandler("Invalid or expired token", 401);
  const status = handled.statusCode || 500;
  res
    .status(status)
    .json({
      success: false,
      message: handled.message || "Internal server error",
    });
};
