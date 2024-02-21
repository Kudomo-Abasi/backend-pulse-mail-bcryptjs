// emailRoutes.js

const express = require("express");
const router = express.Router();
const EmailModel = require("../models/Email");
const { verifyUserWithToken } = require("../middleware/auth_Middleware"); // Import verifyToken middleware

// Middleware function to log requests
router.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.originalUrl}`);
  next();
});

// API to get all emails or a specific email by ID
router.get("/:emailId?", verifyUserWithToken, async (req, res) => {
  const { emailId } = req.params;
  const query = emailId ? { _id: emailId } : {};
  EmailModel.find(query)
    .sort({ timestamp: -1 }) // Sort by timestamp in descending order
    .then((emails) => {
      res.json(emails);
    })
    .catch((err) => res.json(err));
});

// PUT endpoint to mark an email as read
router.put("/:emailId/mark-as-read", verifyUserWithToken, async (req, res) => {
  // Logic to mark an email as read
  const { emailId } = req.params;
  EmailModel.findByIdAndUpdate(emailId, { isRead: true }, { new: false })
    .then((updatedEmail) => {
      if (!updatedEmail) {
        return res.status(404).json({ error: "Email not found" });
      }
      res.json(updatedEmail);
    })
    .catch((err) =>
      res.status(500).json({ error: "Failed to mark email as read" })
    );
});

// PUT endpoint to mark an email as unread
router.put(
  "/:emailId/mark-as-unread",
  verifyUserWithToken,
  async (req, res) => {
    // Logic to mark an email as unread
    const { emailId } = req.params;
    EmailModel.findByIdAndUpdate(emailId, { isRead: false }, { new: true })
      .then((updatedEmail) => {
        if (!updatedEmail) {
          return res.status(404).json({ error: "Email not found" });
        }
        res.json(updatedEmail);
      })
      .catch((err) =>
        res.status(500).json({ error: "Failed to mark email as unread" })
      );
  }
);

// API to get the next email
router.get("/next/:emailId", verifyUserWithToken, async (req, res) => {
  try {
    const { emailId } = req.params;

    // Find the email document by ID
    const currentEmail = await EmailModel.findById(emailId);

    if (!currentEmail) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Query for the next email with a timestamp greater than the current email
    const nextEmail = await EmailModel.findOne({
      timestamp: { $gt: currentEmail.timestamp },
    })
      .sort({ timestamp: 1 }) // Sort in ascending order of timestamp
      .limit(1);

    res.json({ email: nextEmail });
  } catch (err) {
    handleErrors(res, err, "Error fetching next email:");
  }
});

// API to get the previous email
router.get("/prev/:emailId", verifyUserWithToken, async (req, res) => {
  try {
    const { emailId } = req.params;

    // Find the email document by ID
    const currentEmail = await EmailModel.findById(emailId);

    if (!currentEmail) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Query for the previous email with a timestamp less than the current email
    const prevEmail = await EmailModel.findOne({
      timestamp: { $lt: currentEmail.timestamp },
    })
      .sort({ timestamp: -1 }) // Sort in descending order of timestamp
      .limit(1);

    res.json({ email: prevEmail });
  } catch (err) {
    handleErrors(res, err, "Error fetching previous email:");
  }
});

// API to delete an email by ID
router.delete("/delete/:emailId", verifyUserWithToken, async (req, res) => {
  try {
    // Extract email ID from request parameters
    const { emailId } = req.params;

    // Find the email document by ID
    const email = await EmailModel.findById(emailId);

    let user = await UserModel.findById(req.user._id);

    if(!user){
      throw "user not found";
    }

    let mailbox = await MailboxModel.findOne({userId: user._id});
    if(!mailbox){
      throw "mailbox not found"
    }

    // Check if the email exists
    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    // Check if the mailbox ID associated with the request user matches the mailbox ID in the email
    if (email.mailbox.toString() !== req.user.mailbox.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this email" });
    }

    // Delete the email document
    await email.remove();

    res.status(200).json({ message: "Email deleted successfully" });
  } catch (err) {
    handleErrors(res, err, "Error deleting email:");
  }
});

module.exports = router;
