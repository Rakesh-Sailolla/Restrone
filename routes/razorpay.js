const express = require("express");
const router = express.Router();

const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/orders");
const isLoggedIn = require("../middlewares/isLoggedIn");
const sendSMS = require("../utiles/sms");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.post("/razorpay/order", isLoggedIn, async (req, res) => {
  const { amount } = req.body;

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: "order_" + Date.now()
  });

  res.json(order);
});

router.post("/razorpay/verify", isLoggedIn, async (req, res) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderData
  } = req.body;

  const body =
    razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.json({ success: false });
  }

  // SAFE CART PARSE
  const cart =
    typeof orderData.cart === "string"
      ? JSON.parse(orderData.cart)
      : orderData.cart || [];

  const items = cart.map(i => ({
    productId: i.id,
    name: i.name,
    price: i.price,
    quantity: i.qty,
    image: i.image
  }));

  const totalQuantity = cart.reduce((s, i) => s + i.qty, 0);
  const totalAmount = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const order = new Order({
    user: req.user._id,
    items,
    totalQuantity,
    totalAmount,
    paymentMethod: "ONLINE",
    paymentStatus: "Paid",
    razorpayPaymentId: razorpay_payment_id,
    orderStatus: "Placed",
    address: orderData.address
  });

  await order.save();

  await sendSMS(
    order.address.phone,
    ` Order placed
Order ID: ${order._id}
Amount: ₹${order.totalAmount}`
  );

  res.json({ success: true });
});
module.exports=router;