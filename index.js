const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
mongoose
  .connect(
    "mongodb+srv://anonymous:anonymous@cluster0.3hdvk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
  )
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
