const router = require("express").Router();
const { UserModel, validate } = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // Import JWT module
const { verifyUserWithToken } = require("../middleware/auth_Middleware"); // Import verifyToken middleware

// Middleware function to log requests
router.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.originalUrl}`);
  next();
});

// Route for fetching user information using token
router.get("/me", verifyUserWithToken, async (req, res) => {
  try {
    // Fetch user information using the decoded user data from the token
    const user = await UserModel.findById(req.user._id);
    res.status(200).json(user); // Respond with the user's data
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Route for fetching user information using token
router.get("/my_ordinary_info", verifyUserWithToken, async (req, res) => {
  try {
    // Fetch user information using the decoded user data from the token
    const user = await UserModel.findById(req.user._id).select("-password");
    res.status(200).json(user); // Respond with the user's data
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/info_by_email", verifyUserWithToken, async (req, res) => {
  try {
    // Extract user emails from the request body and ensure it's an array
    const userEmails = Array.isArray(req.body.emails) ? req.body.emails : [req.body.emails];

    // Query the database to find user information for each email
    const userInfoPromises = userEmails.map(async (email) => {
      // Exclude the password field from the query result
      const user = await UserModel.findOne({ email }).select("-password");
      return { email, user };
    });

    // Wait for all queries to complete
    const userInfo = await Promise.all(userInfoPromises);

    // Assemble the response object containing user information
    const response = userInfo.reduce((acc, { email, user }) => {
      acc[email] = user ? user.toObject() : null;
      return acc;
    }, {});

    // Send the response back to the client
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Route to search for users by email, firstName, or lastName
router.post("/search", verifyUserWithToken, async (req, res) => {
  try {
    const { query, excludeEmail, limit } = req.body;

    // Set a default value of 10 if limit is not provided or is null
    const limitValue = limit || 10;

    let users = await UserModel.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } }
      ]
    }).limit(limitValue);

    // Exclude the current user's email if provided
    if (excludeEmail) {
      users = users.filter(user => user.email !== excludeEmail);
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});





module.exports = router;
