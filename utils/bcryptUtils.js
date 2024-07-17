
const bcrypt = require('bcrypt');

/**
 * Hashes a password using bcrypt.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Compares a plain-text password with a hashed password using bcrypt.
 * @param {string} password - The plain-text password to compare.
 * @param {string} hashedPassword - The hashed password stored in the database.
 * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, otherwise false.
 */
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword
};
