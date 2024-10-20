/**
 * @description
 * Define the endpoints related to payment processing.
 */
const express = require("express");
const router = express.Router();
const {
  PaymentGateWay,
  SuccessfulOrderPurchase,
  FailureOrderCheckout,
  CancelOrderPurchase
} = require("../controllers/paymentController");

router.post("/process-payment", PaymentGateWay);
router.post("/checkout-successful", SuccessfulOrderPurchase);
router.post("/purchase-order-canceled", CancelOrderPurchase);
router.post("/checkout-failure", FailureOrderCheckout);

module.exports = router;
