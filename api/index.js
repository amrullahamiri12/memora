const path = require('path');
const serverless = require('serverless-http');

require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

let handler;
try {
  const app = require('../server/app');
  handler = serverless(app);
} catch (err) {
  console.error('API startup failed:', err);
  handler = async () =>
    jsonResponse(500, {
      error: 'API failed to start',
      details: err.message,
    });
}

module.exports = handler;
