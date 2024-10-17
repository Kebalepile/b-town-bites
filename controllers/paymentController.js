/**
 * @description payment processing logic using YOCO Payment GateWay
 */

const { sendResponse, handleError } = require("../utils/helpers");
 const axios = require("axios")

const Payment = async (req, res) => {
  const { token, paymentTotal} = req.body;
  const postData = {
    token,
    amountInCents: paymentTotal,
    currency: "ZAR"
  };
  try {
    const response = await axios.post(
      'https://online.yoco.com/v1/charges/',
      postData,
      {
        headers: {
         
         'X-Auth-Secret-Key': process.env.YOCO_SECRET_KEY
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
};
module.exports = {
  Payment
};
