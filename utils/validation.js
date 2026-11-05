const ErrorHandler = require("./errorHandler");

const validationError = (errors) =>
  new ErrorHandler("Validation failed", 400, errors);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const parseNumber = (value, field, errors, { integer = false, min = 0 } = {}) => {
  if (value === undefined || value === null || value === "") {
    errors[field] = `${field} is required`;
    return undefined;
  }
  if (
    typeof value === "boolean" ||
    (typeof value === "string" && !/^-?(?:\d+|\d*\.\d+)$/.test(value.trim()))
  ) {
    errors[field] = `${field} must be a valid number`;
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    errors[field] = `${field} must be at least ${min}`;
    return undefined;
  }
  if (integer && !Number.isInteger(parsed)) {
    errors[field] = `${field} must be a whole number`;
    return undefined;
  }
  return parsed;
};

const validateImageBuffer = (file) => {
  if (!file?.buffer) return false;
  const buffer = file.buffer;
  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  const isWebp =
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";
  return isJpeg || isPng || isWebp;
};

const validateImages = (files, { maxCount = 10, field = "images" } = {}) => {
  const errors = {};
  if (!Array.isArray(files)) return errors;
  if (files.length > maxCount)
    errors[field] = `No more than ${maxCount} images are allowed`;
  if (files.some((file) => !validateImageBuffer(file)))
    errors[field] = "Images must be valid JPEG, PNG, or WebP files";
  return errors;
};

module.exports = {
  isPlainObject,
  parseNumber,
  validateImages,
  validationError,
};
