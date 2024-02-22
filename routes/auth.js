// auth.js
const router = require("express").Router();
const { UserModel, validate } = require("../models/users");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // Import JWT module
const { verifyUserWithToken } = require("../middleware/auth_Middleware"); // Import verifyToken middleware

// Define the validateUser function
const validateUser = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data);
};

// Middleware function to log requests
router.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.originalUrl}`);
  next();
});


// recieve the user model and mark as read
router.post("/login", async (req, res) => {
    try {
      const { error } = validateUser(req.body); // Use validateUser from UserModel
      if (error)
        return res.status(400).send({ message: error.details[0].message });
  
      const user = await UserModel.findOne({ email: req.body.email });
  
      if (!user) {
        console.log("User not found.");
        return res.status(401).send({ message: "Invalid Email or Password" });
      }
  
      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!validPassword) {
        console.log("Invalid password.");
        return res.status(401).send({ message: "Invalid Email or Password" });
      }
  
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET); // Generate token
      res
        .status(200)
        .send({ data: token, message: "Logged in successfully" }); // Send token as response
    } catch (error) {
      console.error(`Error processing request: ${error.message}`);
      res
        .status(500)
        .send({ message: "Internal Server Error " + error.message });
    }
  });

  router.post("/register", async (req, res) => {
    try {
      const { error } = validate(req.body);
      if (error)
        return res.status(400).send({ message: error.details[0].message });
  
      const user = await UserModel.findOne({ email: req.body.email });
      if (user) {
        console.log("User with given email already exists.");
        return res
          .status(409)
          .send({ message: "User with given email already exists" });
      }
  
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const hashPassword = await bcrypt.hash(req.body.password, salt);
  
      // Log the hash password for debugging
      console.log("Hashed password:", hashPassword);
  
      // Save the new user to the database
      await new UserModel({ ...req.body, password: hashPassword }).save();
      console.log("User created successfully.");
      res.status(201).send({ message: "User created successfully" });
    } catch (error) {
      console.error(`Error processing request: ${error.message}`);
      res.status(500).send({ message: "Internal Server Error" });
    }
  });
  
module.exports = router;
