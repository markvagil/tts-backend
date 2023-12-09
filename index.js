const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes");

// environment variables
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.options("*", cors());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://ticket-tracking-system-delta.vercel.app",
    ],
    credentials: false,
  })
);
app.use(bodyParser.json());

const config = {
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
};

app.use(express.json());
app.use(routes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// before listening, mongoose connect with MONGODB_URL

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((error) => console.error("MongoDB connection error:", error.message));

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB database");
});

app.listen(port, () => console.log(`Backend listening on ${port}!`));
