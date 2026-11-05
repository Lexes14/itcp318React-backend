const ErrorHandler = require("../utils/errorHandler");

module.exports = (error, req, res, next) => {
  let handled = error;
  if (error.code === "LIMIT_FILE_SIZE")
    handled = new ErrorHandler("Validation failed", 400, {
      images: "Uploaded file is too large",
    });
  if (
    ["LIMIT_UNEXPECTED_FILE", "LIMIT_FILE_COUNT", "LIMIT_PART_COUNT"].includes(
      error.code,
    )
  )
    handled = new ErrorHandler("Validation failed", 400, {
      images: "Too many or unexpected image files",
    });
  if (error.message === "Unsupported file type")
    handled = new ErrorHandler("Validation failed", 400, {
      images: "Images must be JPEG, PNG, or WebP files",
    });
  if (error.name === "CastError")
    handled = new ErrorHandler("Resource not found", 404);
  if (error.code === 11000)
    handled = new ErrorHandler(
      `Duplicate value: ${Object.keys(error.keyValue || {}).join(", ")}`,
      400,
    );
  if (error.name === "ValidationError")
    handled = new ErrorHandler("Validation failed", 400, {
      ...Object.fromEntries(
        Object.entries(error.errors).map(([field, item]) => [
          field,
          item.message,
        ]),
      ),
    });
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
    handled = new ErrorHandler("Invalid or expired token", 401);
  const status = handled.statusCode || 500;
  res
    .status(status)
    .json({
      success: false,
      message: handled.message || "Internal server error",
      ...(handled.errors ? { errors: handled.errors } : {}),
    });
};
