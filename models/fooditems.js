const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    foodname: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: "Fresh & delicious food"
    },

    image: {
      type: String,
      required: true 
    },

    price: {
      type: Number,
      required: true,
      min: 1
    },

    category: {
      type: String,
      enum: ["veg", "nonveg", "drinks", "dessert"],
      required: true
    },

    isAvailable: {
      type: Boolean,
      default: true
    },

    stock: {
      type: Number,
      default: 100
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", foodItemSchema);
