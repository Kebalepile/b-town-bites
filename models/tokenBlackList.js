const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  blacklistedAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Token will be removed from the database after 1 hour
  }
});

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
