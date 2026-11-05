const admin = require("../config/firebaseAdmin");
const User = require("../models/user");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const { getAuthToken } = require("../utils/authToken");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const token = getAuthToken(req);
  if (!token)
    return next(new ErrorHandler("Please log in to access this resource", 401));
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired token", 401));
  }
  const user = await User.findOne({ firebaseUid: decoded.uid });
  req.firebaseUser = decoded;
  req.authToken = token;
  if (!user && req.path !== "/users/sync")
    return next(new ErrorHandler("User profile is not synchronized", 401));
  req.user = user;
  next();
});

exports.authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new ErrorHandler(`Role ${req.user.role} is not allowed`, 403),
      );
    next();
  };
