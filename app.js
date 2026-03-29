require("dotenv").config();
const express=require('express');
const mongoose = require('mongoose');
const Items = require("./models/fooditems");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const User = require("./models/user");
const LocalStrategy = require("passport-local");
const Order = require("./models/orders");
const axios = require("axios");
const sendSMS = require("./utiles/sms");
const isLoggedIn = require("./middlewares/isLoggedIn");
const app=express();
const port=3000;
const MONGO_URL = process.env.MONGO_URL;
app.set("view engine", "ejs");
app.use(express.json());

app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);   

app.use(
  session({
    secret: process.env.SESSION_SECRET ,
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});





app.use(require("./routes/auth"));
app.use(require("./routes/admin"));
app.use(require("./routes/products"));
app.use(require("./routes/orders"));
app.use( require("./routes/razorpay"));

main()
  .then(() => console.log("Server connected to database"))
  .catch(err => console.log("Mongo error:", err));

async function main() {
  await mongoose.connect(MONGO_URL);
}


passport.use(
  new LocalStrategy(
    { usernameField: "email" }, // login using email
    async (email, password, done) => {
      try {
        // find user by email
        const user = await User.findOne({ email });

        // user not found
        if (!user) return done(null, false);

        // compare password
        const isValid = await user.validatePassword(password);

        // password wrong
        if (!isValid) return done(null, false);

        // success login
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user._id);
});

/*
  Get user from id stored in session
*/
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

//main route
app.get("/", async (req, res) => {

  const allitems = await Items.find();

  res.render("intro", { allitems });
});

app.get("/checkout", isLoggedIn, (req, res) => {
  res.render("orders/checkouts");
});

app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]); // Return empty if no query

  try {
    // Note: Changed 'Item' to 'Items' to match your constant at line 7
    const results = await Items.find({
      $or: [
        { foodname: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } }
      ]
    }).limit(10);
    
    res.json(results);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

app.get("/test-sms", async (req, res) => {
  try {
    await sendSMS(
      "9392651327",   
      "SMS test succssful from RestroOne!"
    );

    res.send("SMS sent successfully");
  } catch (err) {
    res.send("SMS failed");
  }
});
//userprofile
app.get("/profile", isLoggedIn, async (req, res) => {
  try {

    // optional (if orders exist)
    let orders = [];
    try {
      orders = await Order.find({ user: req.user._id });
    } catch (e) {
      orders = [];
    }

    res.render("profile", {
      user: req.user,
      ordersCount: orders.length,
     deliveredOrders: orders.filter(o => o.orderStatus === "Delivered").length,
     pendingOrders: orders.filter(o => o.orderStatus !== "Delivered").length

    });

  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

//
app.get("/about", (req, res) => {
  res.render("about");
});
app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/contact", (req, res) => {
  console.log(req.body); // later you can store or email
  res.redirect("/contact");
});
app.get("/locations", (req, res) => {
  res.render("locations");
});

app.listen(port,()=>{
    console.log(`server is listening to port ${port}`);
})