const User = require("../models/user");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const { uploadBuffer } = require("../utils/cloudinary");
const profile = (user) => ({
  id: user._id,
  firebaseUid: user.firebaseUid,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
});
exports.syncUser = catchAsyncErrors(async (req, res) => {
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
  res.status(200).json({ success: true, user: profile(user) });
});
exports.getUserProfile = catchAsyncErrors(async (req, res) =>
  res.json({ success: true, user: req.user }),
);
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const updates = { name: req.body.name, email: req.user.email };
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
