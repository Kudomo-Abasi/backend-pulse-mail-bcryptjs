// models/Mailbox.js

const mongoose = require('mongoose');

const mailboxSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Assuming the referenced model is named 'User'
  // name: { type: String, required: true }, // Add a required field for the mailbox name
  // emails: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmailModel' }]
});

const MailBoxModel = mongoose.model('Mailbox', mailboxSchema, "mailboxes");

module.exports = MailBoxModel;

