const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
    brand: { type: String, required: true, trim: true, maxlength: 80 },
    model: { type: String, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    salePrice: {
      type: Number,
      min: 0,
      validate: {
        validator(value) {
          return value === undefined || value <= this.price;
        },
        message: "Sale price cannot be greater than price",
      },
    },
    stock: { type: Number, required: true, min: 0, max: 100000 },
    sku: { type: String, required: true, trim: true, maxlength: 60, unique: true },
    category: {
      type: String,
      enum: [
        "Line-Interactive UPS",
        "Online Double-Conversion UPS",
        "Standby UPS",
        "Replacement Batteries",
        "Surge Protectors",
        "Power Inverters",
        "Voltage Regulators (AVR)",
        "Solar Batteries",
        "Rack Accessories",
        "Cables & Connectors",
      ],
      required: true,
    },
    specs: {
      capacityVA: { type: Number, min: 0 },
      capacityWatts: { type: Number, min: 0 },
      batteryType: {
        type: String,
        enum: ["SLA", "AGM", "Gel", "LiFePO4", "Li-ion"],
      },
      voltage: { type: Number, min: 0 },
      ampHours: { type: Number, min: 0 },
      backupTimeMinutes: { type: Number, min: 0 },
      outletCount: { type: Number, min: 0 },
      formFactor: { type: String, enum: ["Tower", "Rack", "Desktop"] },
      warrantyMonths: { type: Number, min: 0 },
      weightKg: { type: Number, min: 0 },
      dimensions: String,
    },
    compatibleModels: [String],
    images: [{ public_id: String, url: String }],
    ratings: { type: Number, min: 0, max: 5, default: 0 },
    numOfReviews: { type: Number, min: 0, default: 0 },
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: { type: String, trim: true, maxlength: 100 },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, trim: true, maxlength: 1000 },
      },
    ],
    seller: { type: String, default: "UPS Battery Store" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Product", productSchema);
