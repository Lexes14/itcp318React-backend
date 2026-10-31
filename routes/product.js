const express = require("express");
const c = require("../controllers/product");
const upload = require("../utils/multer");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const router = express.Router();
router.get("/products", c.getProducts);
router.get("/product/:id", c.getProduct);
router.post(
  "/admin/product/new",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  upload.array("images", 10),
  c.newProduct,
);
router.put(
  "/admin/product/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  upload.array("images", 10),
  c.updateProduct,
);
router.delete(
  "/admin/products/bulk",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.bulkDeleteProducts,
);
router.delete(
  "/admin/product/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.deleteProduct,
);
router.delete(
  "/admin/product/:id/image/:imageId",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.deleteProductImage,
);
router.get(
  "/admin/products",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.getAdminProducts,
);
router.get(
  "/admin/reviews",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.getAdminReviews,
);
router.put("/review", isAuthenticatedUser, c.createOrUpdateReview);
router.get("/reviews", isAuthenticatedUser, c.getProductReviews);
router.delete(
  "/reviews",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.deleteReview,
);
module.exports = router;
