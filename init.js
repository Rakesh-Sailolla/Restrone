const mongoose = require("mongoose");
const Items = require("./models/fooditems");

const MONGO_URL = "mongodb://127.0.0.1:27017/restroone";
const sampleFoodItems = require("./data");   

main()
.then(() => console.log('Server connected to database'))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}


async function initDB() {
  await mongoose.connect(MONGO_URL);
  await Items.insertMany(sampleFoodItems);
  console.log("Sample food data inserted");
  mongoose.connection.close();
}

initDB();

