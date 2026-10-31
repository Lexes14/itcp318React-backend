const express = require("express");
const c = require("../controllers/auth");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const upload = require("../utils/multer");
const router = express.Router();
router.post(
  "/users/sync",
  isAuthenticatedUser,
  upload.single("avatar"),
  c.syncUser,
);
router.get("/me", isAuthenticatedUser, c.getUserProfile);
router.put(
  "/me/update",
  isAuthenticatedUser,
  upload.single("avatar"),
  c.updateProfile,
);
router.put("/password/update", isAuthenticatedUser, c.updatePassword);
router.get(
  "/admin/users",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.getAllUsers,
);
router.get(
  "/admin/user/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.getUser,
);
router.put(
  "/admin/user/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.updateUser,
);
router.delete(
  "/admin/user/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  c.deleteUser,
);
module.exports = router;
