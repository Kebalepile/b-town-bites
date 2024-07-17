const Login = require("../models/login");

const generateUniquePin = async () => {
  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  let uniquePin;
  let isUnique = false;

  while (!isUnique) {
    uniquePin = generateRandomPin();
    const existingPin = await Login.findOne({ pin: uniquePin });
    if (!existingPin) {
      isUnique = true;
    }
  }

  return uniquePin;
};

module.exports = generateUniquePin;
