const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  streetAddress: { type: String },
  houseNumber: { type: String },
  paymentMethod: { type: String, required: true },
  paymentTotal: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  paymentItemsDescriptions: { type: String, required: true },
  status: { type: String, default: "Pending" }, // e.g., Pending, Completed, Cancelled
  timestamp: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
