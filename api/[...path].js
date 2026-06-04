const serverless = require('serverless-http');

let appHandler;

module.exports = (req, res) => {
  if (!appHandler) {
    appHandler = serverless(require('../server/app'));
  }
  return appHandler(req, res);
};
