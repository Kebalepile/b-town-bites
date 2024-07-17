const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/tokenBlacklist'); // Import the token blacklist model

const authenticate = async (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const tokenWithoutBearer = token.split(" ")[1];

  try {
    // Check if the token is blacklisted
    const blacklistedToken = await TokenBlacklist.findOne({ token: tokenWithoutBearer });
    if (blacklistedToken) {
      return res.status(401).json({ error: "Token is blacklisted" });
    }

    // Verify the token
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to the request object
    next();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to authenticate token" });
  }
};

module.exports = authenticate;
