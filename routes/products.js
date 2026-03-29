const express = require("express");
const router = express.Router();
const Items = require("../models/fooditems");

//allproducts
router.get("/products",async(req,res)=>{
  const allitems= await Items.find();
  res.render("index.ejs",{allitems})
});
 //showonlyone product 

router.get("/products/:id",async(req,res)=>{
  const {id}=req.params;
  const item= await Items.findById(id);
  res.render("show.ejs",{item})
})
module.exports = router; 
