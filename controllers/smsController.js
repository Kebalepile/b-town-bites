/**
 * @description SMS sending logic
 */

const {
  sendResponse,
  handleError,
  clickatellApi,
  notifyClients
} = require("../utils/helpers");

const SendSms = async (req, res) => {
  const { to, message } = req.body;

  try {
    const data = await clickatellApi(to, message);

    if (data.messages && data.messages[0].accepted) {
      // Notify clients that SMS was sent successfully
      // Get the origin URL from the request
      const origin = req.get("origin");
      notifyClients(origin, { type: "smsSent", info: { to, message } });
      sendResponse(res, 200, { success: true });
    } else {
      // Notify clients that SMS failed to send
      // Get the origin URL from the request
      const origin = req.get("origin");
      notifyClients(origin, { type: "smsFailed", info: { to, message } });
      sendResponse(res, 500, { success: false, error: "Failed to send SMS" });
    }
  } catch (error) {
    // Notify clients that an error occurred while sending SMS
    // Get the origin URL from the request
    const origin = req.get("origin");
    notifyClients(origin, {
      type: "smsError",
      info: { to, message, error: error.message }
    });
    handleError(res, error);
  }
};

module.exports = { SendSms };
