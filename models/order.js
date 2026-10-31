const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      address: String,
      city: String,
      postalCode: String,
      country: String,
      phoneNo: String,
    },
    orderItems: [
      {
        name: String,
        quantity: Number,
        image: String,
        price: Number,
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      },
    ],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    paymentInfo: { id: String, status: String },
    itemsPrice: Number,
    taxPrice: Number,
    shippingPrice: Number,
    totalPrice: Number,
    orderStatus: { type: String, default: "Processing" },
    paidAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true },
);
module.exports = mongoose.model("Order", orderSchema);
