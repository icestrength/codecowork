var mongoose = require("mongoose");
var User = require("./user");
var Schema = require("mongoose").Schema;

var taskSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  sharedTo:[{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
  content: String
});

module.exports = mongoose.model("Task", taskSchema);
