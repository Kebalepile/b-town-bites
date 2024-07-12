const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const Order = require("./models/order"); 
const WebSocket = require("ws");
const http = require("http");
const axios = require("axios");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Parse the URLs from the environment variables
const devUrls = process.env.DEV_URLS.split(",");
const prodUrls = process.env.PROD_URLS.split(",");

const allowedOrigins =
  process.env.NODE_ENV === "production" ? prodUrls : devUrls;

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

const sendResponse = (res, status, data) => {
  res.status(status).json(data);
};

const handleError = (res, error) => {
  console.error("Error:", error);
  res.status(500).json({ error: error.message });
};

const validateOrderFields = ({
  orderNumber,
  name,
  paymentMethod,
  paymentTotal,
  paymentItemsDescriptions
}) => {
  return (
    orderNumber &&
    name &&
    paymentMethod &&
    paymentTotal !== undefined &&
    paymentItemsDescriptions
  );
};

const sendSMS = async (phone, message) => {
  const response = await axios.get(
    `https://platform.clickatell.com/messages/http/send`,
    {
      params: {
        apiKey: process.env.CLICKATELL_API_KEY,
        to: phone,
        content: message
      }
    }
  );
  return response.data;
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

  if (!validateOrderFields(req.body)) {
    return sendResponse(res, 400, { error: "Missing required fields" });
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
    sendResponse(res, 201, newOrder);
    notifyClients({ type: "newOrder", order: newOrder });
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({});
    sendResponse(res, 200, orders);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/orders/:orderNumber", async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return sendResponse(res, 404, { message: "Order not found" });
    }
    sendResponse(res, 200, order);
  } catch (error) {
    handleError(res, error);
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
      return sendResponse(res, 404, { message: "Order not found" });
    }

    sendResponse(res, 200, updatedOrder);
    notifyClients({ type: "updateOrder", order: updatedOrder });
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/orders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return sendResponse(res, 404, { message: "Order not found" });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return sendResponse(res, 404, { message: "Order not found" });
    }

    const { phone: originalPhone, name, orderNumber } = order;
    const phone = formatCellNumber(originalPhone);

    const message = `Dear ${name}, your order no: ${orderNumber} has been fulfilled. Boitekong Eats 😋`;
    
    const data = await sendSMS(phone, message);

    if (data.messages && data.messages[0].accepted) {
      console.log("SMS sent successfully");
    } else {
      console.error("Failed to send SMS");
    }

    sendResponse(res, 200, { message: "Order deleted successfully" });
    notifyClients({ type: "deleteOrder", orderId: id });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/process-payment", async (req, res) => {
  const { token, paymentTotal, deliveryCharge } = req.body;

  try {
    const response = await axios.post(
      "https://online.yoco.com/v1/charges/",
      {
        token: token,
        amountInCents: (paymentTotal + deliveryCharge) * 100,
        currency: "ZAR"
      },
      {
        headers: {
          "X-Auth-Secret-Key": process.env.YOCO_SECRET_KEY
        }
      }
    );

    console.log("Yoco response:", response.data);

    if (response.data.status === "successful") {
      sendResponse(res, 200, { success: true });
    } else {
      sendResponse(res, 500, { success: false });
    }
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/send-sms", async (req, res) => {
  const { to, message } = req.body;

  try {
    const data = await sendSMS(to, message);

    if (data.messages && data.messages[0].accepted) {
      sendResponse(res, 200, { success: true });
    } else {
      sendResponse(res, 500, { success: false, error: "Failed to send SMS" });
    }
  } catch (error) {
    handleError(res, error);
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

/**
   * @description format phone numbers
   * @param {string} number
   * @returns string
   */
function formatCellNumber(number) {
  if (number.startsWith("0")) {
    return "27" + number.slice(1);
  }
  return number;
}
