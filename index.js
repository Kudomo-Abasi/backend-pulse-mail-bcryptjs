const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userModel = require("./models/users");
const MailBoxModel = require("./models/Mailbox");
const EmailModel = require('./models/Email');
require ('dotenv').config();
const connection = require('./db');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');
const mailBoxRoutes = require('./routes/mailbox');

// database connection 
connection();

const app = express();

// middle wares
app.use(express.json())

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/mailbox", mailBoxRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});