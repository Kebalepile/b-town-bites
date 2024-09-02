const axios = require("axios")
const WebSocketSingleton = require("./WebSocketSingleton");

const notifyClients = data => {
  const wss = WebSocketSingleton.getInstance();
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

const sendResponse = (res, status, data) => {
  res.status(status).json(data);
};

const handleError = (res, error) => {
  console.error("Error:", error);
  res.status(500).json({ error: error.message });
};

const validateOrderFields = ({
  orderNumber,
  name,
  paymentMethod,
  paymentTotal,
  paymentItemsDescriptions
}) => {
  return (
    orderNumber &&
    name &&
    paymentMethod &&
    paymentTotal !== undefined &&
    paymentItemsDescriptions
  );
};

/**
 * @description send sms to phone number via clickatell api
 * @param {string} phone 
 * @param {string} message 
 * @returns 
 */
const clickatellApi = async (phone, message) => {
  const response = await axios.get(
    `https://platform.clickatell.com/messages/http/send`,
    {
      params: {
        apiKey: process.env.CLICKATELL_API_KEY,
        to: phone,
        content: message
      }
    }
  );
  return response.data;
};

module.exports = {
  notifyClients,
  sendResponse,
  handleError,
  validateOrderFields,
  clickatellApi
};
