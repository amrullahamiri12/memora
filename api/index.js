const serverless = require('serverless-http');

// Env: Vercel injects vars at runtime. Local .env is loaded in server/app.js (server/node_modules).

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
