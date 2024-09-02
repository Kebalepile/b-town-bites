/**
 * @description
 * Store wss in a singleton object
 */
let wssInstance = null;

const setInstance = (wss) => {
  wssInstance = wss;
};

const getInstance = () => {
  if (!wssInstance) {
    throw new Error("WebSocket instance is not set");
  }
  return wssInstance;
};

module.exports = {
  setInstance,
  getInstance
};
