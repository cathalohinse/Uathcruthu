"use strict";
const Mongoose = require("mongoose");
const Boom = require("@hapi/boom");
const Schema = Mongoose.Schema;
//const bcrypt = require("bcrypt");

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
});

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email });
};

userSchema.methods.comparePassword = async function (categoryPassword) {
  const isMatch = await bcrypt.compare(categoryPassword, this.password);
  if (!isMatch) {
    throw Boom.unauthorized("Incorrect Password entered");
  }
  return this;
};

module.exports = Mongoose.model("User", userSchema);
