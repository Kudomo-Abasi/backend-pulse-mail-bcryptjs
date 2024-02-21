// models/users.js
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const Joi = require('joi')
const passwordComplexity = require('joi-password-complexity')

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  createdAt: { type: Date, default: Date.now },
  profilePictureUrl: String,
});

userSchema.statics.findById = async function(userId) {
  try {
    const user = await this.findOne({ _id: userId });
    return user;
  } catch (error) {
    // Handle errors appropriately
    console.error("Error finding user by ID:", error);
    throw error;
  }
};

userSchema.methods.generateAuthToken = function (){
  const token = jwt.sign({_id: this._id}, process.env.JWT_SECRET, {expiresIn: "7d"});
  return token;
}

const UserModel = mongoose.model("User", userSchema, "users");

// joi to validate the input.
const validate = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
    password: passwordComplexity().required().label("Password"),  
  })
  return schema.validate(data)
};

module.exports = { UserModel, validate };
