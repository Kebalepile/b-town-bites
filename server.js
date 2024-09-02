const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { corsOptions } = require("./utils/corsOptions");
const mongoose = require("mongoose");
const WebSocket = require("ws");
// Store wss in a singleton object
const WebSocketSingleton = require("./utils/WebSocketSingleton");
const http = require("http");

// load .env file to be used
require("dotenv").config();

const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const smsRoutes = require("./routes/smsRoutes");

const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

// Server setup
const server = http.createServer(app);
// WebSocket setup
const wss = new WebSocket.Server({ server });

WebSocketSingleton.setInstance(wss);

wss.on("connection", async ws => {
  try {
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "connect to BoitekongEats server"
      })
    );
  } catch (error) {
    ws.send(JSON.stringify({ type: "error", message: error.message }));
  }
});

// Routes setup
app.use(orderRoutes);
app.use(authRoutes);
app.use(paymentRoutes);
app.use(smsRoutes);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
