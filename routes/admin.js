const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const isAdmin = require("../middlewares/isAdmin");
const Order = require("../models/orders");
const Razorpay = require("razorpay");
const Items = require("../models/fooditems");
const upload = require("../middlewares/upload");
const authRoutes = require("./auth");



router.get("/admin", isAdmin, async (req, res) => {

  const usersCount = await User.countDocuments();

  const ordersCount = await Order.countDocuments();

  const productsCount = await Items.countDocuments();

  const revenue = await Order.aggregate([
    { $match: { paymentStatus: "Paid" } },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" }
      }
    }
  ]);

  const totalRevenue = revenue[0]?.total || 0;

  const recentOrders = await Order.find()
    .populate("user", "username email")
    .sort({ createdAt: -1 })
    .limit(5);

  // ✅ SEND DATA TO EJS
  res.render("admin/dashboard", {
    usersCount,
    ordersCount,
    productsCount,
    totalRevenue,
    recentOrders
  });
});

router.get("/admin/orders", isAdmin, async (req, res) => {
  const orders = await Order.find()
    .populate("user", "email username")
    .sort({ createdAt: -1 });

  res.render("admin/orders", { orders });
});


 router.get("/admin/products", isAdmin, async (req, res) => {
  const products = await Items.find();
  res.render("admin/products", { products }); });



router.put("/admin/orders/:id", isAdmin, async (req, res) => {

  const order = await Order.findById(req.params.id);

  if (!order) return res.redirect("/admin/orders");

  // admin cannot change cancelled orders
  if (order.orderStatus === "Cancelled") {
    return res.redirect("/admin/orders");
  }

  order.orderStatus = req.body.orderStatus;

  // auto-disable cancellation
  if (
    order.orderStatus === "Out for Delivery" ||
    order.orderStatus === "Delivered"
  ) {
    order.canCancel = false;
  }

  await order.save();

  res.redirect("/admin/orders");
});  


router.get("/admin/users", isAdmin, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.render("admin/users", { users });
});

// new product page
router.get("/admin/products/new", isAdmin, (req, res) => {
  res.render("admin/newproduct");
});

router.post(
  "/admin/products",
  isAdmin,
  upload.single("image"),
  async (req, res) => {

    const newitem = new Items({
      foodname: req.body.foodname,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
       image: req.file ? req.file.path : ""
    });

    await newitem.save();
    res.redirect("/admin/products");
  }
);

router.get("/admin/products/:id/edit",isAdmin,async(req,res)=>{
  const {id}=req.params;
  const item= await Items.findById(id);
  res.render("admin/editproduct",{item})
})


router.put(
  "/admin/products/:id",
  isAdmin,
  upload.single("image"),
  async (req, res) => {

    const updateData = {
      foodname: req.body.foodname,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category
    };

    if (req.file) {
      updateData.image = req.file.path; // new Cloudinary image
    }

    await Items.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/admin/products");
  }
);

router.delete("/admin/products/:id",isAdmin, async (req, res) => {
    const deleteditem=await Items.findByIdAndDelete(req.params.id);
  console.log(deleteditem)

  res.redirect("/admin/products");
});
module.exports = router;
