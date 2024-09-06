/**
 * @description
 * Handle authentication logic like signup, login, and logout.
 */
const jwt = require("jsonwebtoken");
const generateUniquePin = require("../utils/generateUniquePin");
const { hashPassword, comparePassword } = require("../utils/bcryptUtils");
const TokenBlacklist = require("../models/tokenBlacklist");
const LoginModel = require("../models/login");
const { notifyClients } = require("../utils/helpers");

const SignUp = async (req, res) => {
  const { username } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await LoginModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists 😕" });
    }

    // Generate a unique PIN
    const pin = await generateUniquePin();

    // Hash the PIN before saving
    const hashedPin = await hashPassword(pin);

    // Create a new user with username and hashed PIN
    const newUser = new LoginModel({ username, pin: hashedPin });

    // Save the new user
    await newUser.save();

    // Generate a JWT token
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });
    // Notify clients of a new signup
    // Get the origin URL from the request
    const origin = req.get("origin");

    notifyClients(origin, { type: "newSignup", user: { username, pin } });
    // Send response
    res
      .status(201)
      .json({ message: "🎉signed up successfully 🎉", username, pin, token });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to sign up user 🥺" });
  }
};

const Login = async (req, res) => {
  const { username, pin } = req.body;

  try {
    // Find the user by username
    const user = await LoginModel.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid NAME or PIN 🥺" });
    }

    const isPinValid = await comparePassword(pin, user.pin);
    if (!isPinValid) {
      return res.status(400).json({ error: "Invalid NAME or PIN 🥺" });
    }

    // Generate a JWT token
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    // Notify clients of a successful login
    // Get the origin URL from the request
    const origin = req.get("origin");
    notifyClients(origin, { type: "userLogin", user: { username } });
    // Send response
    res.status(200).json({ message: "🎉 Login successful🎉", token });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to login user" });
  }
};

const Logout = async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];

  try {
    // Add the token to the blacklist
    const blacklistedToken = new TokenBlacklist({ token });
    await blacklistedToken.save();

    // Notify clients of a user logout
    const decodedToken = jwt.decode(token);
    if (decodedToken && decodedToken.username) {
      // Get the origin URL from the request
      const origin = req.get("origin");
      notifyClients(origin, {
        type: "userLogout",
        user: { username: decodedToken.username }
      });
    }
    // Send response
    res.status(200).json({ message: "🎉 Logout successful 🎉" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to logout user" });
  }
};

module.exports = {
  SignUp,
  Login,
  Logout
};
