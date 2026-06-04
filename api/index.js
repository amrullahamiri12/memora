const serverless = require('serverless-http');

let handler;

module.exports = (req, res) => {
  if (!handler) {
    const app = require('../server/app');
    handler = serverless(app);
  }
  return handler(req, res);
};
