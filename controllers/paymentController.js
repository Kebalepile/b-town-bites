/**
 * @description payment processing logic.
 */

const {
    sendResponse,
    handleError
  } = require("../utils/helpers");

const Payment =  async (req, res) => {
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
  }
  module.exports = {
    Payment
  }