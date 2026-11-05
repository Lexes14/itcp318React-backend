const { parseNumber, validationError } = require("./validation");

const CATEGORIES = [
  "Line-Interactive UPS",
  "Online Double-Conversion UPS",
  "Standby UPS",
  "Replacement Batteries",
  "Surge Protectors",
  "Power Inverters",
  "Voltage Regulators (AVR)",
  "Solar Batteries",
  "Rack Accessories",
  "Cables & Connectors",
];

const PRODUCT_FIELDS = [
  "name",
  "slug",
  "brand",
  "model",
  "sku",
  "price",
  "salePrice",
  "stock",
  "category",
  "description",
  "specs",
  "compatibleModels",
];

const getUnexpectedProductFields = (input) =>
  Object.keys(input).filter((field) => !PRODUCT_FIELDS.includes(field));

const validateProduct = (input, { partial = false } = {}) => {
  const errors = {};
  const value = { ...input };
  const required = (field) =>
    !partial || Object.prototype.hasOwnProperty.call(input, field);

  if (!partial || required("name")) {
    if (typeof input.name !== "string" || !input.name.trim())
      errors.name = "Name is required";
    else if (input.name.trim().length > 120)
      errors.name = "Name must be at most 120 characters";
    else value.name = input.name.trim();
  }
  if (!partial || required("slug")) {
    if (
      typeof input.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim())
    )
      errors.slug = "Slug must contain lowercase letters, numbers, and hyphens";
    else value.slug = input.slug.trim();
  }
  if (!partial || required("brand")) {
    if (typeof input.brand !== "string" || !input.brand.trim())
      errors.brand = "Brand is required";
    else if (input.brand.trim().length > 80)
      errors.brand = "Brand must be at most 80 characters";
    else value.brand = input.brand.trim();
  }
  for (const field of ["model", "sku"]) {
    if (partial && !required(field)) continue;
    if (field === "model" && (input[field] === undefined || input[field] === ""))
      continue;
    if (typeof input[field] !== "string" || (field === "sku" && !input[field].trim()))
      errors[field] = field === "sku" ? "sku is required" : `${field} is invalid`;
    else if (input[field].trim().length > (field === "sku" ? 60 : 80))
      errors[field] = `${field} must be at most ${field === "sku" ? 60 : 80} characters`;
    else value[field] = input[field].trim();
  }
  if (!partial || required("description")) {
    if (typeof input.description !== "string" || !input.description.trim())
      errors.description = "Description is required";
    else if (input.description.trim().length < 10)
      errors.description = "Description must be at least 10 characters";
    else if (input.description.trim().length > 2000)
      errors.description = "Description must be at most 2000 characters";
    else value.description = input.description.trim();
  }
  if (!partial || required("category")) {
    if (!CATEGORIES.includes(input.category))
      errors.category = "Category is invalid";
  }

  for (const field of ["price", "stock"]) {
    if (partial && !required(field)) continue;
    const parsed = parseNumber(input[field], field, errors, {
      integer: field === "stock",
    });
    if (parsed !== undefined) value[field] = parsed;
  }
  if (!partial || required("salePrice")) {
    if (input.salePrice !== undefined && input.salePrice !== "") {
      const parsed = parseNumber(input.salePrice, "salePrice", errors);
      if (parsed !== undefined) value.salePrice = parsed;
    } else if (!partial) {
      delete value.salePrice;
    }
  }
  const price = value.price;
  const salePrice = value.salePrice;
  if (
    price !== undefined &&
    salePrice !== undefined &&
    salePrice > price
  )
    errors.salePrice = "Sale price cannot be greater than price";

  if (Object.keys(errors).length) throw validationError(errors);
  return value;
};

module.exports = {
  CATEGORIES,
  PRODUCT_FIELDS,
  getUnexpectedProductFields,
  validateProduct,
};
