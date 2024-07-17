/**
   * @description format phone numbers
   * @param {string} number
   * @returns string
   */
function formatCellNumber(number) {
  if (number.startsWith("0")) {
    return "27" + number.slice(1);
  }
  return number;
}

module.exports = formatCellNumber;
