const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    contact: {
      type: Number,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

const Profile = model("Profile", schema);
module.exports = Profile;
