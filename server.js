const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const Order = require("./models/order"); // Import the order model
const WebSocket = require("ws");
const http = require("http");
const axios = require("axios");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// const allowedOrigins = ["http://localhost:5173", "http://localhost:5173/"];  // developement

const allowedOrigins = [
  "https://boitekongeats.co.za/",
  "https://boitekongeats.co.za",
  "https://btownbites.github.io/",
  "https://btownbites.github.io"
]; //production

const corsOptions = {
  origin: function(origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", async ws => {
  console.log("New WebSocket connection");

  try {
    const orders = await Order.find({});
    ws.send(JSON.stringify({ type: "initialData", orders }));
  } catch (error) {
    ws.send(JSON.stringify({ type: "error", message: error.message }));
  }
});

const notifyClients = data => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

app.post("/orders", async (req, res) => {
  const {
    name,
    phone,
    streetAddress,
    houseNumber,
    paymentMethod,
    paymentTotal,
    deliveryCharge,
    paymentItemsDescriptions,
    orderNumber
  } = req.body;

  // Ensure all required fields are provided
  if (
    !orderNumber ||
    !name ||
    !paymentMethod ||
    paymentTotal === undefined ||
    !paymentItemsDescriptions
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newOrder = new Order({
    orderNumber,
    name,
    phone,
    streetAddress,
    houseNumber,
    paymentMethod,
    paymentTotal,
    deliveryCharge,
    paymentItemsDescriptions,
    status: "Pending",
    timestamp: new Date()
  });

  try {
    const savedOrder = await newOrder.save();
    res.status(201).json(newOrder);

    // Notify all connected clients
    notifyClients({ type: "newOrder", order: newOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({});
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/orders/:orderNumber", async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(updatedOrder);

    // Notify all connected clients
    notifyClients({ type: "updateOrder", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/orders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });

    // Notify all connected clients
    notifyClients({ type: "deleteOrder", orderId: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/process-payment", async (req, res) => {
  const { token, paymentTotal, deliveryCharge } = req.body;

  try {
    const response = await axios.post(
      "https://online.yoco.com/v1/charges/",
      {
        token: token,
        amountInCents: (paymentTotal + deliveryCharge) * 100, // Convert to cents
        currency: "ZAR"
      },
      {
        headers: {
          "X-Auth-Secret-Key": process.env.YOCO_SECRET_KEY // Use your actual secret key
        }
      }
    );

    console.log("Yoco response:", response.data);

    if (response.data.status === "successful") {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    res.json({ success: false, error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// function generateOrderNumber() {
//   return Math.floor(Math.random() * 1000000).toString();
// }
