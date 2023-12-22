const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema({
  link: String
});

module.exports = mongoose.model("Tag", TagSchema);