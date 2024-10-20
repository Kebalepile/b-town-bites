const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    cookId: [String], // Array of strings
    orderNumber: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, match: /^\d{10}$/ },
    checkoutId:{type:String},
    redirectUrl:{type:String},
    notificationsSent:{type:Boolean},
    streetAddress: { type: String },
    houseNumber: { type: String },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "self-collect", "online", "online-delivery"]
    },
    paymentTotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    paymentItemsDescriptions: { type: String, required: true },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Process","Ready", "Cancelled"]
    }
  },
  { timestamps: true }
);

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ phone: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
