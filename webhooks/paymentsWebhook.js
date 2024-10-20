const express = require("express");
const crypto = require("crypto");
const webhook = express.Router();
const Order = require("../models/order");

// Function to find orders with checkoutId in the last 30 minutes
async function findRecentOrdersWithCheckoutId(minutes = 30) {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - minutes * 60000);

  try {
    const results = await Order.find({
      checkoutId: { $exists: true, $ne: null },
      createdAt: { $gte: startTime, $lte: endTime },
    });

    console.log("Recent orders with checkoutId:", results);
    return results;
  } catch (error) {
    console.error("Error finding orders:", error);
  }
}

// Middleware to parse raw body for signature verification
const rawBodyMiddleware = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

const PaymentGateWay = async (req, res) => {
  try {
    // Step 1: Read the headers and raw body
    const headers = req.headers;
    const requestBody = req.rawBody;
    
    // Extract necessary headers
    const id = headers["webhook-id"];
    const timestamp = headers["webhook-timestamp"];
    const signatureHeader = headers["webhook-signature"];
    
    // Construct the signed content
    const signedContent = `${id}.${timestamp}.${requestBody}`;

    // Step 2: Calculate expected signature
    const secret = process.env.YOCO_WEBHOOK_SECRET;
    const secretBytes = new Buffer(secret.split("_")[1], "base64");
    
    const expectedSignature = crypto
      .createHmac("sha256", secretBytes)
      .update(signedContent)
      .digest("base64");

    // Step 3: Extract the signature from the header (v1 signature)
    const signature = signatureHeader.split(" ")[0].split(",")[1];

    // Step 4: Constant time comparison
    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
      console.error("Invalid signature received!");
      return res.status(400).send("Invalid signature");
    }

    // Step 5: Log the event and verify the payment status
    const event = req.body;
    console.log("Webhook event received:", event);

    if (event.type === "payment.succeeded") {
      console.log("Payment succeeded!");
      const orders = await findRecentOrdersWithCheckoutId(30);

      // Step 6: Ensure the event's checkoutId matches the order's checkoutId
      const { checkoutId } = event.metadata; // Assuming metadata contains the checkoutId
      const matchingOrder = orders.find(order => order.checkoutId === checkoutId);

      if (matchingOrder) {
        console.log("Payment matched the checkoutId, processing...");
        // Process order fulfillment or update records as needed
      } else {
        console.log("Checkout ID did not match, skipping...");
      }
    } else {
      console.log("Event type is not payment.succeeded, ignoring...");
    }

    // Respond with 200 OK to acknowledge the webhook
    res.status(200).send("Webhook processed successfully");

  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal server error");
  }
};

// Register the rawBody middleware for the webhook route
webhook.use(express.json({ verify: rawBodyMiddleware }));
webhook.post("/webhook/paymentgateway", PaymentGateWay);

module.exports = webhook;
