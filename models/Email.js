// models/Email.js
const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema({
  content: String,
  cc: [String], // Assuming cc can have multiple values
  bcc: [String], // Assuming bcc can have multiple values
  from: String,
  mailbox: { type: mongoose.Schema.Types.ObjectId, ref: "MailboxModel" }, // Referencing the Mailbox model
  replyTo: String,
  subject: String,
  timestamp: { type: Date, default: null }, // Using Date type for timestamp
  to: [String], // Assuming to can have multiple values
  isRead: { type: Boolean, default: true }, // Using Boolean type for unread flag
});

const EmailModel = mongoose.model("Email", emailSchema, "emails");

module.exports = EmailModel;
