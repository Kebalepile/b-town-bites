const axios = require("axios");
/**
 * @description register webhook to very payments where successful
 */
async function registerWebhook() {
  console.log("registering webhook")
  try {
    const URL = "https://payments.yoco.com/api/webhooks",
      postData = {
        name: "paymentSuccess",
        url: process.env.WebHook_Dev
      },
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.YOCO_TEST_SECRET_KEY}`
      };
    const res = await axios.post(URL, postData, { headers });
    console.log(res);
  } catch (err) {}
}

module.exports = registerWebhook;
