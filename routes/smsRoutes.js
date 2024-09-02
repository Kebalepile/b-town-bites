/**
 * @description
 * Define the endpoints related to SMS functionality.
 */
const express = require("express");
const router = express.Router();
const { SendSms } = require("../controllers/smsController");

router.post("/send-sms", SendSms);

module.exports = router;
