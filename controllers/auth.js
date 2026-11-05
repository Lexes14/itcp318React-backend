const User = require("../models/user");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const { uploadBuffer } = require("../utils/cloudinary");
const {
  AUTH_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getAuthCookieClearOptions,
} = require("../config/authCookie");
const { getAuthToken } = require("../utils/authToken");
const { validateImages, validationError } = require("../utils/validation");
const profile = (user) => ({
  id: user._id,
  firebaseUid: user.firebaseUid,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
});
exports.syncUser = catchAsyncErrors(async (req, res) => {
  const token = req.authToken || getAuthToken(req);
  if (!token) throw new ErrorHandler("Authentication token is required", 401);
  const updates = {
    name:
      req.body.name ||
      req.firebaseUser.name ||
      req.firebaseUser.email.split("@")[0],
    email: req.firebaseUser.email,
  };
  if (req.file) {
    const image = await uploadBuffer(req.file.buffer);
    updates.avatar = { public_id: image.public_id, url: image.secure_url };
  }
  const user = await User.findOneAndUpdate(
    { firebaseUid: req.firebaseUser.uid },
    { $set: updates, $setOnInsert: { firebaseUid: req.firebaseUser.uid } },
    { new: true, upsert: true, runValidators: true },
  );
  if (!user)
    throw new ErrorHandler("Unable to create or load user profile", 500);
  const expires = req.firebaseUser.exp
    ? new Date(req.firebaseUser.exp * 1000)
    : new Date(Date.now() + 60 * 60 * 1000);
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions({ expires }));
  res.status(200).json({ success: true, user: profile(user) });
});
exports.getUserProfile = catchAsyncErrors(async (req, res) =>
  res.json({ success: true, user: req.user }),
);
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const allowedFields = ["name"];
  const unexpectedFields = Object.keys(req.body).filter(
    (field) => !allowedFields.includes(field),
  );
  const errors = {};
  if (unexpectedFields.length)
    unexpectedFields.forEach((field) => {
      errors[field] = `${field} cannot be updated here`;
    });
  if (typeof req.body.name !== "string" || !req.body.name.trim())
    errors.name = "Name is required";
  else if (req.body.name.trim().length < 2)
    errors.name = "Name must be at least 2 characters";
  else if (req.body.name.trim().length > 80)
    errors.name = "Name must be at most 80 characters";
  const imageErrors = validateImages(req.file ? [req.file] : [], {
    maxCount: 1,
    field: "avatar",
  });
  Object.assign(errors, imageErrors);
  if (Object.keys(errors).length) throw validationError(errors);
  const updates = { name: req.body.name.trim() };
  if (req.file) {
    const image = await uploadBuffer(req.file.buffer);
    updates.avatar = { public_id: image.public_id, url: image.secure_url };
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) return next(new ErrorHandler("User not found", 404));
  res.json({ success: true, user: profile(user) });
});
exports.updatePassword = catchAsyncErrors(async (req, res) =>
  res
    .status(410)
    .json({
      success: false,
      message:
        "Password changes are handled by Firebase Authentication. Use updatePassword on the client.",
    }),
);
exports.getAllUsers = catchAsyncErrors(async (req, res) =>
  res.json({ success: true, users: await User.find() }),
);
exports.getUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found", 404));
  res.json({ success: true, user });
});
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name, email: req.body.email, role: req.body.role },
    { new: true, runValidators: true },
  );
  if (!user) return next(new ErrorHandler("User not found", 404));
  res.json({ success: true, user });
});
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new ErrorHandler("User not found", 404));
  res.json({ success: true });
});

exports.logout = catchAsyncErrors(async (req, res) => {
  const clearOptions = getAuthCookieClearOptions();
  res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
  res.clearCookie(LEGACY_AUTH_COOKIE_NAME, clearOptions);
  res.json({ success: true, message: "Logged out successfully" });
});
