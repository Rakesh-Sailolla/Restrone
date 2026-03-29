const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
      },

      name: String,
      image: String,
      price: Number,
      quantity: Number
    }
  ],

  totalQuantity: Number,
  totalAmount: Number,

  address: {
    name: String,
    phone: Number,
    street: String,
    city: String,
    pincode: String
  },

  // 💳 PAYMENT
  paymentMethod: {
    type: String,
    enum: ["COD", "ONLINE"],
    default: "COD"
  },

  paymentStatus: {
    type: String,
    enum: [
      "Pending",
      "Paid",
      "Refunded",
      "Refund Pending",
      "Failed"
    ],
    default: "Pending"
  },

  // ✅ REQUIRED FOR RAZORPAY
  razorpayPaymentId: {
    type: String
  },

  refundId: {
    type: String
  },

  // 🚚 ORDER STATUS
  orderStatus: {
    type: String,
    enum: [
      "Placed",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled"
    ],
    default: "Placed"
  },

  // ❌ CANCELLATION
  canCancel: {
    type: Boolean,
    default: true
  },

  cancelledAt: Date

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
