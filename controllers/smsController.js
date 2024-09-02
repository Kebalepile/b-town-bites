/**
 * @description SMS sending logic
 */

const { sendResponse, handleError,clickatellApi } = require("../utils/helpers");

const SendSms = async (req, res) => {
  const { to, message } = req.body;

  try {
    const data = await clickatellApi(to, message);

    if (data.messages && data.messages[0].accepted) {
      sendResponse(res, 200, { success: true });
    } else {
      sendResponse(res, 500, { success: false, error: "Failed to send SMS" });
    }
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { SendSms };
