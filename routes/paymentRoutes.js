/**
 * @description
 * Define the endpoints related to payment processing.
 */
const express = require("express");
const router = express.Router();
const { Payment } = require("../controllers/paymentController");

router.post("/process-payment", Payment);

module.exports = router;
