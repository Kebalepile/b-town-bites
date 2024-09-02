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
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
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
      return sendResponse(res, 404, { message: "Order not found" });
    }
    sendResponse(res, 200, order);
  } catch (error) {
    handleError(res, error);
  }
};

const updateOrder = async (req, res) => {
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
};

const deleteOrder = async (req, res) => {
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

    const data = await clickatellApi(phone, message);

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
};
module.exports = { createOrder, getOrders, getOrder, updateOrder, deleteOrder };
