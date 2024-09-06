/**
 * @description 
 * all logic related to orders, such as creating, retrieving, 
 * updating, and deleting orders.
 */

const mongoose = require("mongoose");
const formatCellNumber = require("../utils/formatCellNumber");
const Order = require("../models/order");
const {
  notifyClients,
  sendResponse,
  handleError,
  validateOrderFields,
  clickatellApi
} = require("../utils/helpers");

const createOrder = async (req, res) => {
  let {
    cookId,
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

  // Ensure cookId is always an array
  if (!Array.isArray(cookId)) {
    cookId = [cookId];
  }

  if (!validateOrderFields(req.body)) {
    return sendResponse(res, 400, { error: "Missing required fields" });
  }

  // Determine the status based on paymentTotal
  // If paymentTotal is less than 50, set status to 'Process'
  const status = paymentTotal < 50 ? "Process" : "Pending"; 

  const newOrder = new Order({
    cookId,
    orderNumber,
    name,
    phone,
    streetAddress,
    houseNumber,
    paymentMethod,
    paymentTotal,
    deliveryCharge,
    paymentItemsDescriptions,
    status, 
    timestamp: new Date()
  });

  try {
    const savedOrder = await newOrder.save();
    // Get the origin URL from the request
    const origin = req.get("origin");
    notifyClients(origin, { type: "newOrder", order: newOrder });
    sendResponse(res, 201, newOrder);
  } catch (error) {
    handleError(res, error);
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({});

    if (!orders || orders.length === 0) {
      return sendResponse(res, 404, {
        message: "No orders found for this cook"
      });
    }
    sendResponse(res, 200, orders);
  } catch (error) {
    handleError(res, error);
  }
};

const getCookOrders = async (req, res) => {
  try {
    const { cookId } = req.body;
    const orders = await Order.find({
      cookId: { $in: [cookId.toLowerCase()] }
    });

    if (!orders || orders.length === 0) {
      return sendResponse(res, 404, {
        message: " 🍽️, No orders found for this cook"
      });
    }

    sendResponse(res, 200, orders);
  } catch (error) {
    handleError(res, error);
  }
};

const getOrder = async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return sendResponse(res, 404, { message: "🚫 Order not found" });
    }
    sendResponse(res, 200, order);
  } catch (error) {
    handleError(res, error);
  }
};

const updateOrder = async (req, res) => {
  const { id } = req.params;
  const order = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(id, order, {
      new: true
    });

    if (!updatedOrder) {
      return sendResponse(res, 404, { message: "🚫 Order not found" });
    }
    const smsNotification = async order => {
      const baseMessage = `Hey ${order.name}, `;
      let customerMessage = "";

      const collectionLocation = {
        charmi: "2278 Betlhakwe St, Boitekong Ext2, Rustenburg",
        charmaine: "2278 Betlhakwe St, Boitekong Ext2, Rustenburg",
        boitekongEats: "2379 Windsa St, Boitekong Ext2, Rustenburg"
      };

      const paymentMethod = order.paymentMethod.toLowerCase();
      const cookLocation = collectionLocation[order.cookId[0]];

      if (order.deliveryCharge > 0) {
        const deliveryMessage = `BoitekongEats order:${order.orderNumber} is ready for delivery!`;
        const deliveryPhone = formatCellNumber("0698488813");
        const deliveryResponse = await clickatellApi(
          deliveryPhone,
          deliveryMessage
        );

        if (
          !deliveryResponse.messages ||
          !deliveryResponse.messages[0].accepted
        ) {
          return [503, { message: "🚫 Failed to send SMS to delivery team" }];
        }
      }

      // Prepare customer message based on payment method
      if (["online", "self-collect"].includes(paymentMethod)) {
        customerMessage = `${baseMessage}your order ${order.orderNumber} at BoitekongEats is ready for self-collection. Collect at ${cookLocation}. Total is R${order.paymentTotal}.`;
      } else if (["cash", "online-delivery"].includes(paymentMethod)) {
        customerMessage = `${baseMessage}your order ${order.orderNumber} at BoitekongEats is out on delivery to ${order.streetAddress}, house number: ${order.houseNumber}.`;
      }

      // Send SMS only if there's a customer message to send
      if (customerMessage.length > 0) {
        const phone = formatCellNumber(order.phone);
        const customerResponse = await clickatellApi(phone, customerMessage);

        if (
          !customerResponse.messages ||
          !customerResponse.messages[0].accepted
        ) {
          return [503, { message: "🚫 Failed to send SMS to customer" }];
        }
      }

      // Final return if everything went smoothly
      return [
        200,
        { message: `Sent SMS notifications for order ${order.orderNumber}` }
      ];
    };

    if (order.status.trim().toLowerCase() === "ready") {
      const [statusCode, statusMessage] = await smsNotification(order);

      if (statusCode === 503) {
        return sendResponse(res, 503, statusMessage);
      }
    }

    // Get the origin URL from the request
    const origin = req.get("origin");
    notifyClients(origin, { type: "updateOrder", order: updatedOrder });
    sendResponse(res, 200, updatedOrder);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return sendResponse(res, 404, { message: "🚫 Order not found" });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return sendResponse(res, 404, { message: "🚫 Order not found" });
    }

    const { phone: originalPhone, name, orderNumber } = order;
    const phone = formatCellNumber(originalPhone);

    const message = `Dear ${name}, your order no: ${orderNumber} has been fulfilled. Boitekong Eats 😋`;

    const data = await clickatellApi(phone, message);

    if (data.messages && data.messages[0].accepted) {
      console.log("SMS sent successfully");
    } else {
      console.error("Failed to send SMS");
    }

    // Get the origin URL from the request
    const origin = req.get("origin");
    notifyClients(origin, { type: "deleteOrder", orderId: id });
    sendResponse(res, 200, { message: "Order deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getCookOrders,
  getOrder,
  updateOrder,
  deleteOrder
};
