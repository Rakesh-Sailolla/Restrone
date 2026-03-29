const multer = require("multer");
const { storage } = require("../utiles/cloudinary");

const upload = multer({ storage });

module.exports = upload;
