const express = require("express");
const c = require("../controllers/order");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const router = express.Router();
router.post("/order/new", isAuthenticatedUser, c.newOrder);
router.get("/orders/me", isAuthenticatedUser, c.myOrders);
router.get("/order/:id", isAuthenticatedUser, c.getOrder);
router.get(
  "/admin/orders",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.getAllOrders,
);
router.put(
  "/admin/order/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.updateOrder,
);
router.delete(
  "/admin/order/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.deleteOrder,
);
router.get(
  "/admin/total-orders",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.stats,
);
router.get(
  "/admin/total-sales",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.totalSales,
);
router.get(
  "/admin/customer-sales",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.customerSales,
);
router.get(
  "/admin/sales-per-month",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.salesPerMonth,
);
router.get(
  "/admin/product-sales",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.productSales,
);
module.exports = router;
