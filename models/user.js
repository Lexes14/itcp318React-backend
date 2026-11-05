const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    avatar: { public_id: String, url: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);
module.exports = mongoose.model("User", userSchema);
