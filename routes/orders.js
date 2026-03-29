const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Items = require("../models/fooditems");
const isLoggedIn = require("../middlewares/isLoggedIn");
const Order = require("../models/orders");




router.post("/orders/place", isLoggedIn, async (req, res) => {

  const cart =
    typeof req.body.cart === "string"
      ? JSON.parse(req.body.cart)
      : req.body.cart || [];

  const { name, phone, street, city, pincode, paymentMethod } = req.body;

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
    paymentMethod: "COD",
    paymentStatus: "Pending",
    orderStatus: "Placed",
    address: { name, phone, street, city, pincode }
  });

  await order.save();

  await sendSMS(
    phone,
    ` COD order placed
Order ID: ${order._id}
Amount: ₹${totalAmount}`
  );

  res.render("/orders/success");
});

router.get("/orders/success", isLoggedIn, (req, res) => {
  res.render("orders/success");
});

router.get("/orders/my", isLoggedIn, async (req, res) => {

  const orders = await Order.find({
    user: req.user._id
  }).sort({ createdAt: -1 });

  res.render("orders/myorders", { orders });
});
//
router.put("/orders/:id/cancel", isLoggedIn, async (req, res) => {

  const order = await Order.findById(req.params.id);

  if (!order || !order.user.equals(req.user._id)) {
    return res.redirect("/orders/my");
  }

  if (
    !order.canCancel ||
    order.orderStatus === "Delivered" ||
    order.orderStatus === "Cancelled"
  ) {
    return res.redirect("/orders/my");
  }

  //  ONLINE REFUND
  if (order.paymentMethod === "ONLINE" &&
      order.paymentStatus === "Paid") {

    try {
      const refund = await axios.post(
        `https://api.razorpay.com/v1/payments/${order.razorpayPaymentId}/refund`,
        {},
        {
          auth: {
            username: process.env.RAZORPAY_KEY_ID,
            password: process.env.RAZORPAY_KEY_SECRET
          }
        }
      );

      order.paymentStatus = "Refunded";
      order.refundId = refund.data.id;

    } catch {
      order.paymentStatus = "Refund Pending";
    }
  }

  order.orderStatus = "Cancelled";
  order.canCancel = false;
  order.cancelledAt = new Date();

  await order.save();

  await sendSMS(
    order.address.phone,
    ` Order cancelled
Order ID: ${order._id}
Status: ${order.paymentStatus}`
  );

  res.redirect("/orders/my");
});

module.exports=router;