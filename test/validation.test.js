const assert = require("node:assert/strict");
const test = require("node:test");

const {
  getUnexpectedProductFields,
  validateProduct,
} = require("../utils/productValidation");

const validProduct = {
  name: "UPS Battery",
  slug: "ups-battery",
  brand: "Power Brand",
  sku: "UPS-001",
  price: "1000",
  stock: "4",
  category: "Standby UPS",
  description: "A reliable battery backup for office equipment.",
};

const errorFor = (input) => {
  try {
    validateProduct(input);
    return null;
  } catch (error) {
    return error;
  }
};

test("accepts multipart numeric strings and normalizes them", () => {
  const value = validateProduct(validProduct);
  assert.equal(value.price, 1000);
  assert.equal(value.stock, 4);
});

test("rejects malformed product values", () => {
  assert.equal(errorFor({ ...validProduct, slug: "Bad Slug" }).errors.slug !== undefined, true);
  assert.equal(errorFor({ ...validProduct, price: "-1" }).errors.price !== undefined, true);
  assert.equal(errorFor({ ...validProduct, stock: "1.5" }).errors.stock !== undefined, true);
  assert.equal(
    errorFor({ ...validProduct, salePrice: "1001" }).errors.salePrice !== undefined,
    true,
  );
  assert.equal(
    errorFor({ ...validProduct, description: "short" }).errors.description !== undefined,
    true,
  );
});

test("rejects protected or unexpected product fields through the request allowlist", () => {
  assert.deepEqual(getUnexpectedProductFields({ name: "x", reviews: [] }), [
    "reviews",
  ]);
});
