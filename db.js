const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/cloudinary")
  .then(() => console.log("mongodb connected 🫰"))
  .catch((err) => console.log("Error while connecting DB"));

module.exports = mongoose;
