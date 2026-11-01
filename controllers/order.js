const Order = require("../models/order");
const Product = require("../models/product");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendEmail");
const receiptPdf = require("../utils/receiptPdf");

const notifyOrder = async (order, user, subject) => {
  if (!user?.email) {
    console.error("Order email skipped: recipient email is not set");
    return;
  }
  const receipt = await receiptPdf(order, user);
  const money = (value) =>
    `PHP ${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  const products = order.orderItems
    .map(
      (item) =>
        `${item.name} x ${item.quantity} - ${money(Number(item.price || 0) * Number(item.quantity || 0))}`,
    )
    .join("\n");
  const message = [
    `Order #${order._id} details`,
    "",
    "Products:",
    products,
    "",
    `Subtotal: ${money(order.itemsPrice)}`,
    `Grand total: ${money(order.totalPrice)}`,
    "",
    "A PDF receipt is attached to this email.",
  ].join("\n");
  await sendEmail({
    email: user.email,
    subject,
    message,
    attachments: [
      {
        filename: `receipt-${order._id}.pdf`,
        content: receipt,
        contentType: "application/pdf",
      },
    ],
  });
};

exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const requestedItems = Array.isArray(req.body.orderItems)
    ? req.body.orderItems
    : [];
  if (!requestedItems.length)
    return next(new ErrorHandler("Your cart is empty", 400));
  const orderItems = [];
  let itemsPrice = 0;
  for (const item of requestedItems) {
    const product = await Product.findById(item.product);
    const quantity = Math.max(1, Number(item.quantity) || 0);
    if (!product)
      return next(
        new ErrorHandler("A product in your cart no longer exists", 400),
      );
    if (product.stock < quantity)
      return next(
        new ErrorHandler(`${product.name} has insufficient stock`, 400),
      );
    const price = Number(product.salePrice || product.price);
    itemsPrice += price * quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      quantity,
      price,
      image: product.images?.[0]?.url || "",
    });
  }
  const taxPrice = 0;
  const shippingPrice = 0;
  const totalPrice = itemsPrice + taxPrice + shippingPrice;
  const order = await Order.create({
    shippingInfo: req.body.shippingInfo,
    orderItems,
    user: req.user._id,
    paymentInfo: { status: "COD", id: "COD" },
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });
  await Promise.all(
    orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      }),
    ),
  );
  notifyOrder(order, req.user, "Order confirmation and receipt").catch((error) =>
    console.error("Order email failed:", error.code, error.message),
  );
  res.status(201).json({ success: true, order });
});
exports.myOrders = catchAsyncErrors(async (req, res) =>
  res.json({
    success: true,
    orders: await Order.find({ user: req.user._id }).sort("-createdAt"),
  }),
);
exports.getOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate("user");
  if (!order) return next(new ErrorHandler("Order not found", 404));
  res.json({ success: true, order });
});
exports.getAllOrders = catchAsyncErrors(async (req, res) =>
  res.json({
    success: true,
    orders: await Order.find().populate("user").sort("-createdAt"),
  }),
);
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user");
  if (!order) return next(new ErrorHandler("Order not found", 404));
  const sequence = { Processing: 0, Shipped: 1, Delivered: 2, Cancelled: 99 };
  const currentRank = sequence[order.orderStatus] ?? 0;
  const nextRank = sequence[req.body.status];
  if (nextRank === undefined)
    return next(new ErrorHandler("Invalid order status", 400));
  if (
    order.orderStatus === "Delivered" ||
    order.orderStatus === "Cancelled" ||
    (req.body.status === "Cancelled" && order.orderStatus !== "Processing") ||
    (nextRank < currentRank && req.body.status !== "Cancelled")
  )
    return next(
      new ErrorHandler(
        "Delivered or completed orders cannot be moved backward",
        400,
      ),
    );
  order.orderStatus = req.body.status;
  if (req.body.status === "Delivered") order.deliveredAt = Date.now();
  await order.save();
  notifyOrder(
    order,
    order.user,
    `Order #${order._id} status updated to ${order.orderStatus}`,
  ).catch((error) =>
    console.error("Order email failed:", error.code, error.message),
  );
  res.json({ success: true, order });
});
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return next(new ErrorHandler("Order not found", 404));
  await Promise.all(
    order.orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      }),
    ),
  );
  res.json({ success: true });
});
exports.stats = catchAsyncErrors(async (req, res) =>
  res.json({ success: true, total: await Order.countDocuments() }),
);
exports.totalSales = catchAsyncErrors(async (req, res) => {
  const result = await Order.aggregate([
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);
  res.json({ success: true, total: result[0] ? result[0].total : 0 });
});
const dateMatch = (req) => {
  const match = {};
  if (req.query.startDate || req.query.endDate) {
    match.createdAt = {};
    if (req.query.startDate)
      match.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate)
      match.createdAt.$lte = new Date(`${req.query.endDate}T23:59:59.999Z`);
  }
  return match;
};
exports.salesPerMonth = catchAsyncErrors(async (req, res) => {
  const rows = await Order.aggregate([
    { $match: dateMatch(req) },
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
        total: { $sum: "$totalPrice" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
  const data = Array.from({ length: 12 }, (_, index) => ({
    month: new Date(2000, index).toLocaleString("en", { month: "short" }),
    total: 0,
  }));
  rows.forEach((row) => {
    data[row._id.month - 1].total = row.total;
  });
  res.json({ success: true, data });
});
exports.productSales = catchAsyncErrors(async (req, res) => {
  const data = await Order.aggregate([
    { $match: dateMatch(req) },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: "$orderItems.name",
        total: {
          $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
        },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);
  res.json({
    success: true,
    data: data.map((row) => ({ name: row._id, total: row.total })),
  });
});
exports.customerSales = catchAsyncErrors(async (req, res) => {
  const data = await Order.aggregate([
    { $match: dateMatch(req) },
    { $group: { _id: "$user", total: { $sum: "$totalPrice" } } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);
  res.json({
    success: true,
    data: data.map((row) => ({ name: row.user.name, total: row.total })),
  });
});
