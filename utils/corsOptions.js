
// load .env file to be used
require("dotenv").config();
// Parse the URLs from the environment variables
const devUrls = process.env.DEV_URLS.split(",");
const prodUrls = process.env.PROD_URLS.split(",");

const allowedOrigins =
  process.env.NODE_ENV === "production" ? prodUrls : devUrls;

const corsOptions = {
  origin: function(origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};

module.exports = {corsOptions, allowedOrigins}