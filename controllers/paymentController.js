const axios = require("axios");
const mongoose = require("mongoose");
const formatCellNumber = require("../utils/formatCellNumber");
const Order = require("../models/order");
const {
  sendResponse,
  handleError
} = require("../utils/helpers");



/**
 * @description Handles the checkout failure scenario by finding and deleting the order.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void} - Sends a response indicating the order was deleted or not found.
 */
const FailureOrderCheckout = async (req, res) => {
  const { newOrder } = req.body;
  try {
    const deletedOrder = await Order.findOneAndDelete({
      orderNumber: newOrder.orderNumber
    });

    if (!deletedOrder) {
      return sendResponse(res, 404, {
        success: false,
        message: `🚫 Order not found`
      });
    }

    return sendResponse(res, 200, {
      success: true,
      message: `Order: ${newOrder.orderNumber} checkout failure`
    });
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * @description Cancels an order by finding and deleting it based on the order number.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {void} - Sends a response indicating the order was deleted or not found.
 */
const CancelOrderPurchase = async (req, res) => {
  const { newOrder } = req.body;
  try {
    const deletedOrder = await Order.findOneAndDelete({
      orderNumber: newOrder.orderNumber
    });

    if (!deletedOrder) {
      return sendResponse(res, 404, {
        success: false,
        message: `🚫 Order not found`
      });
    }

    return sendResponse(res, 200, {
      success: true,
      message: `Order: ${newOrder.orderNumber} canceled`
    });
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * @description Marks an order as "Processed" and sends notifications to support and cook teams.
 * @param {Object} req - Express request object containing order, supportPhones, and cookPhones.
 * @param {Object} res - Express response object.
 * @returns {void} - Sends a response indicating the order was updated or not found.
 */
const SuccessfulOrderPurchase = async (req, res) => {
  const { newOrder, supportPhones, cookPhones } = req.body;

  try {
    // Find order by orderNumber and check if it's already processed
    const existingOrder = await Order.findOne({
      orderNumber: newOrder.orderNumber
    });
    if (!existingOrder) {
      return sendResponse(res, 404, { message: "🚫 Order not found" });
    }

    // If the status is already "Process", prevent further updates or notifications
    if (existingOrder.status === "Process" && existingOrder.notificationsSent) {
      return sendResponse(res, 400, {
        success: true,
        message: "Order already processed and notifications sent."
      });
    }

    existingOrder.status = "Process";
    existingOrder.notificationsSent = true; // Mark as notifications sent
    await existingOrder.save(); // Save the updated order after notifications are sent
    
    const { orderNumber, name, phone, paymentItemsDescriptions } = existingOrder;

    sendResponse(res, 200, {
      success: true,
      supportPhones: supportPhones.map(phone => formatCellNumber(phone)),
      cookPhones: cookPhones.map(phone => formatCellNumber(phone)),
      customerPhone: formatCellNumber(phone),
      cookMessage: `New order at Boitekong Eats: ${orderNumber}, ${name}, ${phone}, ${paymentItemsDescriptions}`,
      supportMessage: `New order at Boitekong Eats ready for process order number ${orderNumber}`,
      customerMessage: `Hi ${name}, your order is being processed at BoitekongEats. You'll be notified via SMS when the order is ready. Track your order ${orderNumber} on the web-app.`,
      message: "Order updated and notifications sent successfully!"
    });
  } catch (err) {
    handleError(res, err); // Handle any errors
  }
};



/**
 * @description Handles payment processing using the YOCO payment gateway.
 * @param {Object} req - Express request object containing the order and payment paths.
 * @param {Object} res - Express response object.
 * @returns {void} - Sends a response with payment information or an error message.
 */
const PaymentGateWay = async (req, res) => {
  const { newOrder, paths, lineitems} = req.body;

  if (!newOrder) {
    return sendResponse(res, 400, { message: "Order data is missing." });
  }

  const postData = {
    amount: newOrder.paymentTotal * 100, // YOCO uses cents
    currency: "ZAR",
    cancelUrl: paths.cancelUrl,
    successUrl: paths.successUrl,
    failureUrl: paths.failureUrl,
    lineItems:lineitems
  };

  try {
    const checkoutsAPI = await axios.post(
      "https://payments.yoco.com/api/checkouts",
      postData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.YOCO_TEST_SECRET_KEY}`
        }
      }
    );

    const info = { id: null, redirectUrl: null };

    if (checkoutsAPI.status === 200) {
      info.id = checkoutsAPI.data.id;
      info.redirectUrl = checkoutsAPI.data.redirectUrl;

      if (!Array.isArray(newOrder.cookId)) {
        newOrder.cookId = [newOrder.cookId];
      }

      const tempOrder = new Order({
        ...newOrder,
        checkoutId: checkoutsAPI.data.id,
        redirectUrl: checkoutsAPI.data.redirectUrl,
        status: "Pending",
        timestamp: new Date()
      });

      await tempOrder.save();
      sendResponse(res, checkoutsAPI.status, info);
    } else {
      sendResponse(res, checkoutsAPI.status, {
        message: "Failed to create payment."
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return sendResponse(res, 409, { message: "Duplicate order detected." });
    }
    handleError(res, error);
  }
};

module.exports = {
  PaymentGateWay,
  SuccessfulOrderPurchase,
  FailureOrderCheckout,
  CancelOrderPurchase
};
