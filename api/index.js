const path = require('path');
const serverless = require('serverless-http');

require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const app = require('../server/app');

module.exports = serverless(app);
