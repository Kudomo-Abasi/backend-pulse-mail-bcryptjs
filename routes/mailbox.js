const express = require("express");
const router = express.Router();
const MailboxModel = require("../models/Mailbox");
const EmailModel = require("../models/Email");
const { verifyUserWithToken } = require("../middleware/auth_Middleware");
const {UserModel, validate, findById} = require("../models/users"); // Import your Mongoose User model

// Middleware function to log requests
router.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.originalUrl}`);
  next();
});

// Function to handle errors
const handleErrors = (res, err, message) => {
  console.error(`${message} ${err}`);
  console.log("we got an erro in the mailbox api")
  res.status(500).json({ error: "Internal server error" });
};

// Route to get mailbox data by user ID
router.get("/", verifyUserWithToken, async (req, res) => {
  try {
    const userId = req.user._id;
    let mailbox = await MailboxModel.findOne({ userId });

    // If mailbox is not found, create a new one
    if (!mailbox) {
      mailbox = await new MailboxModel({ userId }).save();
    }

    res.json(mailbox);
  } catch (err) {
    handleErrors(res, err, "Error fetching mailbox data:");
  }
});

router.get("/myinbox", verifyUserWithToken, async (req, res) => {
  try {
    const userId = req.user._id;
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    let mailbox = await MailboxModel.findOne({ userId });

    if (!mailbox) {
      mailbox = await new MailboxModel({ userId }).save();
    }

    const skip = (page - 1) * limit;

    const user = await UserModel.findById(userId); // Retrieve the user document from the users collection

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userEmailAddress = user.email;

    const query = {
      mailbox: mailbox._id,
      to: { $in: [userEmailAddress] },
    };

    const inboxEmails = await EmailModel.find(query)
      .sort({ timestamp: -1 }) // Assuming timestamp is the sort field
      .skip(skip)
      .limit(limit + 1);

    const totalEmails = await EmailModel.countDocuments(query);
    const totalPages = Math.ceil(totalEmails / limit);

    if (page > totalPages) {
      return res.status(404).json({ error: "Page not found" });
    }

    let startIndex = -1;
    if (inboxEmails.length > 0) {
      startIndex = skip + 1;
    }

    let endIndex = null;
    if (inboxEmails.length > 0) {
      endIndex = startIndex + inboxEmails.length - 1; // Calculate end index
    }

    const responseData = {
      messages: inboxEmails.slice(0, -1),
      totalEmails,
      startIndex,
      endIndex,
    };

    res.json(responseData);
  } catch (err) {
    handleErrors(res, err, "Error fetching inbox emails:");
  }
});


router.get("/mysent", verifyUserWithToken, async (req, res) => {
  try {
    const userId = req.user._id;
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    let mailbox = await MailboxModel.findOne({ userId });

    if (!mailbox) {
      mailbox = await new MailboxModel({ userId }).save();
    }

    const skip = (page - 1) * limit;

    const user = await UserModel.findById(userId); // Retrieve the user document from the users collection

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userEmailAddress = user.email;

    const query = {
      mailbox: mailbox._id,
      from: userEmailAddress,
    };

    const sentEmails = await EmailModel.find(query)
      .sort({ timestamp: -1 }) // Assuming timestamp is the sort field
      .skip(skip)
      .limit(limit + 1);

    const totalEmails = await EmailModel.countDocuments(query);
    const totalPages = Math.ceil(totalEmails / limit);

    if (page > totalPages) {
      return res.status(404).json({ error: "Page not found" });
    }

    let startIndex = -1;
    if (sentEmails.length > 0) {
      startIndex = skip + 1;
    }

    let endIndex = null;
    if (sentEmails.length > 0) {
      endIndex = startIndex + sentEmails.length - 1; // Calculate end index
    }

    const responseData = {
      messages: sentEmails.slice(0, -1),
      totalEmails,
      startIndex,
      endIndex,
    };

    res.json(responseData);
  } catch (err) {
    handleErrors(res, err, "Error fetching sent emails:");
  }
});






// Route to get unread emails in user's inbox with pagination
router.get("/myinbox/unread", verifyUserWithToken, async (req, res) => {
  try {
    const userId = req.user._id;
    let { length, startAfter } = req.query; // Get length and startAfter from query params
    length = parseInt(length) || 10; // Default length to 10 if not provided or invalid
    startAfter = parseInt(startAfter) || 0; // Default startAfter to 0 if not provided or invalid

    let mailbox = await MailboxModel.findOne({ userId });

    // If mailbox is not found, create a new one
    if (!mailbox) {
      mailbox = await new MailboxModel({ userId }).save();
    }

    const unreadInboxEmails = await EmailModel.find({
      mailbox: mailbox._id,
      isRead: false,
    })
      .sort({ timestamp: -1 })
      .skip(startAfter)
      .limit(length); // Apply pagination

    res.json(unreadInboxEmails);
  } catch (err) {
    handleErrors(res, err, "Error fetching unread inbox emails:");
  }
});

// Route to get the length of user's inbox emails
router.get("/myinbox/length", verifyUserWithToken, async (req, res) => {
  try {
    const userId = req.user._id;
    let mailbox = await MailboxModel.findOne({ userId: userId });

    // If mailbox is not found, create a new one
    if (!mailbox) {
      mailbox = await new MailboxModel({ userId: userId }).save();
    }

    const inboxEmailsCount = await EmailModel.countDocuments({
      mailbox: mailbox._id,
    });
    res.json({ length: inboxEmailsCount });
  } catch (err) {
    handleErrors(res, err, "Error fetching inbox emails length:");
  }
});

// Route to get the length of user's unread inbox emails
router.get("/myinbox/unread_count", verifyUserWithToken, async (req, res) => {
  try {
    const userId = req.user._id;
    let mailbox = await MailboxModel.findOne({ userId: userId });

    // If mailbox is not found, create a new one
    if (!mailbox) {
      mailbox = await new MailboxModel({ userId: userId }).save();
    }

    const unreadEmailsCount = await EmailModel.countDocuments({
      mailbox: mailbox._id,
      isRead: false,
    });
    res.json({ length: unreadEmailsCount });
  } catch (err) {
    handleErrors(res, err, "Error fetching unread inbox emails count:");
  }
});

// API to send an email
router.post("/send", verifyUserWithToken, async (req, res) => {
  try {
    // Extract email details from request content
    // from: from is the sender's user.id
    // to: to is an array of recipient email addresses
    const { content, subject, to, from } = req.body;
    let senderUserData = await UserModel.findOne({ _id: req.user?._id});
    console.log(senderUserData)

    // Iterate through each recipient's email
    for (const recipientEmail of to) {
      let recipientUserData = await UserModel.findOne({ email: recipientEmail});

      // Find or create the recipient's mailbox
      let recipientMailbox = await MailboxModel.findOne({
        userId: recipientUserData._id,
      });

      // If recipient's mailbox doesn't exist, create one
      if (!recipientMailbox) {
        recipientMailbox = await new MailboxModel({
          userId: recipientEmail,
        }).save();
      }

      // Create an email document for the recipient
      const recipientEmailDoc = new EmailModel({
        content,
        from,
        mailbox: recipientMailbox?._id, // Null safety
        subject,
        timestamp: new Date(),
        to: [recipientEmail],
        isRead: false,
      });

      // Save recipient's email document
      await recipientEmailDoc.save();
    }

    // Find or create the sender's mailbox
    let senderMailbox = await MailboxModel.findOne({ userId: req.user?._id });

    // If sender's mailbox doesn't exist, create one
    if (!senderMailbox) {
      senderMailbox = await new MailboxModel({ userId: req.user?._id }).save();
    }

    // Create an email document for the sender
    const senderEmailDoc = new EmailModel({
      content: content,
      // from is the sender's email
      from: senderUserData.email,
      mailbox: senderMailbox?._id, 
      subject: subject,
      timestamp: new Date(),
      // to is an array of recipients emails.
      to: to,
      isRead: true,
    });

    // Save sender's email document
    await senderEmailDoc.save();

    res.status(201).json({ message: "Email sent successfully" });
  } catch (err) {
    handleErrors(res, err, "Error sending email:");
  }
});

module.exports = router;
