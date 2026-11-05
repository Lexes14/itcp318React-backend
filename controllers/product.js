const Product = require("../models/product");
const Order = require("../models/order");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const APIFeatures = require("../utils/apiFeatures");
const { uploadBuffer, deleteImage } = require("../utils/cloudinary");
const { maskProfanity } = require("../utils/profanityFilter");
const { validateImages, validationError, isPlainObject } = require("../utils/validation");
const {
  getUnexpectedProductFields,
  validateProduct,
} = require("../utils/productValidation");

const parseProductBody = (body) => {
  const input = { ...body };
  if (typeof input.specs === "string") {
    try {
      input.specs = JSON.parse(input.specs);
    } catch {
      throw validationError({ specs: "Specs must be valid JSON" });
    }
  }
  if (input.specs !== undefined && !isPlainObject(input.specs))
    throw validationError({ specs: "Specs must be an object" });
  const unknown = getUnexpectedProductFields(input);
  if (unknown.length)
    throw validationError(
      Object.fromEntries(unknown.map((field) => [field, `${field} cannot be updated`])),
    );
  return input;
};

const validateProductRequest = (req, { partial = false, current } = {}) => {
  const input = parseProductBody(req.body);
  const value = validateProduct(input, { partial });
  if (current) validateProduct({ ...current, ...input });
  const imageErrors = validateImages(req.files || []);
  if (Object.keys(imageErrors).length) throw validationError(imageErrors);
  return value;
};
exports.getProducts = catchAsyncErrors(async (req, res) => {
  const resPerPage = 12;
  const base = new APIFeatures(Product.find(), req.query).search().filter();
  const filteredProductsCount = await Product.countDocuments(
    base.query.getFilter(),
  );
  const productsCount = await Product.countDocuments();
  const products = await base.pagination(resPerPage).query;
  res.json({
    success: true,
    products,
    productsCount,
    resPerPage,
    filteredProductsCount,
  });
});
exports.getProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));
  res.json({ success: true, product });
});
exports.newProduct = catchAsyncErrors(async (req, res) => {
  const productData = validateProductRequest(req);
  const images = await Promise.all(
    (req.files || []).map(async (file) => {
      const image = await uploadBuffer(
        file.buffer,
        "ups-battery-store/products",
      );
      return { public_id: image.public_id, url: image.secure_url };
    }),
  );
  const product = await Product.create({
    ...productData,
    images,
  });
  res.status(201).json({ success: true, product });
});
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));
  const productData = validateProductRequest(req, {
    partial: true,
    current: product.toObject(),
  });
  const images = await Promise.all(
    (req.files || []).map(async (file) => {
      const image = await uploadBuffer(
        file.buffer,
        "ups-battery-store/products",
      );
      return { public_id: image.public_id, url: image.secure_url };
    }),
  );
  const updates = productData;
  if (images.length) updates.images = [...product.images, ...images];
  Object.assign(product, updates);
  await product.save();
  res.json({ success: true, product });
});
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));
  await Promise.all(
    product.images
      .filter(
        (image) => image.public_id && !image.public_id.startsWith("upload-"),
      )
      .map((image) => deleteImage(image.public_id)),
  );
  res.json({ success: true });
});
exports.bulkDeleteProducts = catchAsyncErrors(async (req, res, next) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (!ids.length)
    return next(new ErrorHandler("Select at least one product", 400));
  const products = await Product.find({ _id: { $in: ids } });
  await Product.deleteMany({ _id: { $in: ids } });
  await Promise.all(
    products.flatMap((product) =>
      product.images
        .filter(
          (image) => image.public_id && !image.public_id.startsWith("upload-"),
        )
        .map((image) => deleteImage(image.public_id)),
    ),
  );
  res.json({ success: true, deleted: products.length });
});
exports.deleteProductImage = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));
  const image = product.images.id(req.params.imageId);
  if (!image) return next(new ErrorHandler("Image not found", 404));
  product.images.pull(image._id);
  await product.save();
  if (image.public_id && !image.public_id.startsWith("upload-"))
    await deleteImage(image.public_id);
  res.json({ success: true, images: product.images });
});
exports.getAdminProducts = catchAsyncErrors(async (req, res) =>
  res.json({ success: true, products: await Product.find() }),
);
exports.createOrUpdateReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.body.productId);
  if (!product) return next(new ErrorHandler("Product not found", 404));
  const deliveredOrder = await Order.findOne({
    user: req.user._id,
    orderStatus: "Delivered",
    "orderItems.product": product._id,
  });
  if (!deliveredOrder)
    return next(
      new ErrorHandler(
        "You can review this product after receiving your order",
        403,
      ),
    );
  const review = {
    user: req.user._id,
    name: maskProfanity(req.user.name),
    rating: Number(req.body.rating),
    comment: maskProfanity(req.body.comment),
  };
  const existing = product.reviews.find(
    (item) => item.user.toString() === req.user._id.toString(),
  );
  if (existing) Object.assign(existing, review);
  else product.reviews.push(review);
  product.numOfReviews = product.reviews.length;
  product.ratings =
    product.reviews.reduce((sum, item) => sum + item.rating, 0) /
    product.numOfReviews;
  await product.save();
  res.json({ success: true });
});
exports.getProductReviews = catchAsyncErrors(async (req, res) => {
  const product = await Product.findById(req.query.id).lean();
  const reviews = product
    ? product.reviews.map((review) => ({
        ...review,
        name: maskProfanity(review.name),
        comment: maskProfanity(review.comment),
      }))
    : [];
  res.json({ success: true, reviews });
});
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.body.productId);
  if (!product) return next(new ErrorHandler("Product not found", 404));
  product.reviews = product.reviews.filter(
    (review) => review._id.toString() !== req.body.id,
  );
  product.numOfReviews = product.reviews.length;
  product.ratings = product.numOfReviews
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.numOfReviews
    : 0;
  await product.save();
  res.json({ success: true });
});
exports.getAdminReviews = catchAsyncErrors(async (req, res) => {
  const products = await Product.find(
    { "reviews.0": { $exists: true } },
    "name reviews",
  ).lean();
  const reviews = products.flatMap((product) =>
    product.reviews.map((review) => ({
      ...review,
      name: maskProfanity(review.name),
      comment: maskProfanity(review.comment),
      productId: product._id,
      productName: product.name,
    })),
  );
  res.json({ success: true, reviews });
});
